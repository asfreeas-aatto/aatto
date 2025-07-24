import { Server } from 'socket.io';
import { User, Game, Poem } from '../models';
import mongoose from 'mongoose';

interface QueuePlayer {
  userId: string;
  socketId: string;
  rank: string;
  level: number;
  joinTime: Date;
}

interface GameRoom {
  gameId: string;
  players: QueuePlayer[];
  theme: string;
  status: 'waiting' | 'active' | 'voting' | 'finished';
  startTime: Date;
}

class MatchmakingService {
  private rankQueue: Map<string, QueuePlayer[]> = new Map();
  private playerSockets: Map<string, string> = new Map(); // userId -> socketId
  private activeGames: Map<string, GameRoom> = new Map();
  private io: Server;

  // 테마 풀
  private themes = [
    '첫눈', '지하철', '야근', '비오는날',
    '벚꽃', '여름밤', '단풍', '겨울바람',
    '그리움', '설렘', '아쉬움', '기쁨',
    '어머니', '친구', '꿈', '희망'
  ];

  constructor(io: Server) {
    this.io = io;
    this.initializeQueues();
  }

  private initializeQueues() {
    const ranks = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    ranks.forEach(rank => {
      this.rankQueue.set(rank, []);
    });
  }

  // 매칭 큐에 참가
  async joinQueue(userId: string, socketId: string, mode: string = 'rank') {
    try {
      // MongoDB 연결이 없을 때 기본값 사용
      let user = null;
      try {
        user = await User.findById(userId);
      } catch (dbError) {
        console.log('⚠️  Database not available, using default user data');
      }

      const player: QueuePlayer = {
        userId,
        socketId,
        rank: user?.profile?.rank || 'bronze',
        level: user?.profile?.level || 1,
        joinTime: new Date()
      };

      // 기존 큐에서 제거 (중복 방지)
      this.leaveQueue(userId);

      // 랭크별 큐에 추가
      const queue = this.rankQueue.get(player.rank) || [];
      queue.push(player);
      this.rankQueue.set(player.rank, queue);

      // 소켓 매핑 저장
      this.playerSockets.set(userId, socketId);

      console.log(`🎯 ${user.profile.nickname} (${player.rank}) 매칭 큐 참가`);

      // 즉시 매칭 시도
      this.tryCreateMatch(player.rank);

      // 큐 상태 브로드캐스트
      this.broadcastQueueStatus();

      return { success: true, message: '매칭 큐에 참가했습니다.' };

    } catch (error) {
      console.error('큐 참가 오류:', error);
      throw error;
    }
  }

  // 매칭 큐에서 나가기
  leaveQueue(userId: string) {
    // 모든 큐에서 해당 유저 제거
    for (const [rank, queue] of this.rankQueue.entries()) {
      const filteredQueue = queue.filter(player => player.userId !== userId);
      this.rankQueue.set(rank, filteredQueue);
    }

    // 소켓 매핑 제거
    this.playerSockets.delete(userId);
    
    this.broadcastQueueStatus();
    console.log(`🚪 유저 ${userId} 큐 퇴장`);
  }

  // 매칭 시도
  private async tryCreateMatch(targetRank: string) {
    const queue = this.rankQueue.get(targetRank) || [];
    
    if (queue.length >= 2) {
      // 가장 오래 기다린 2명 매칭
      const player1 = queue.shift()!;
      const player2 = queue.shift()!;
      
      await this.createGame([player1, player2]);
      this.rankQueue.set(targetRank, queue);
    } else {
      // 30초 이상 기다린 플레이어가 있으면 다른 랭크와 매칭 시도
      const waitingTooLong = queue.find(
        player => Date.now() - player.joinTime.getTime() > 30000
      );

      if (waitingTooLong) {
        const matchedPlayer = this.findCrossRankMatch(targetRank, waitingTooLong);
        if (matchedPlayer) {
          const idx1 = queue.findIndex(p => p.userId === waitingTooLong.userId);
          queue.splice(idx1, 1);
          
          await this.createGame([waitingTooLong, matchedPlayer]);
        }
      }
    }
  }

  // 다른 랭크에서 매칭 상대 찾기
  private findCrossRankMatch(targetRank: string, player: QueuePlayer): QueuePlayer | null {
    const rankOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const targetIndex = rankOrder.indexOf(targetRank);
    
    // ±1 랭크에서 찾기
    const searchRanks = [
      rankOrder[targetIndex - 1],
      rankOrder[targetIndex + 1]
    ].filter(Boolean);

    for (const rank of searchRanks) {
      const queue = this.rankQueue.get(rank) || [];
      if (queue.length > 0) {
        const opponent = queue.shift()!;
        this.rankQueue.set(rank, queue);
        return opponent;
      }
    }

    return null;
  }

  // 게임 생성
  private async createGame(players: QueuePlayer[]) {
    try {
      const theme = this.getRandomTheme();
      
      // MongoDB에 게임 생성 (DB 연결이 있을 때만)
      let gameId = new mongoose.Types.ObjectId().toString();
      try {
        const game = new Game({
          mode: 'rank',
          players: players.map(p => new mongoose.Types.ObjectId(p.userId)),
          theme,
          status: 'waiting',
          poems: [],
          votes: [],
          settings: {
            timeLimit: 180, // 3분
            maxPlayers: 2,
            isPrivate: false
          }
        });

        await game.save();
        gameId = game._id.toString();
      } catch (dbError) {
        console.log('⚠️  Database not available, using temporary game ID:', gameId);
      }

      // 게임룸 생성
      const gameRoom: GameRoom = {
        gameId,
        players,
        theme,
        status: 'waiting',
        startTime: new Date()
      };

      this.activeGames.set(gameId, gameRoom);

      // 플레이어들을 게임룸에 참가시키기
      players.forEach(player => {
        this.io.to(player.socketId).emit('match-found', {
          gameId,
          opponent: players.find(p => p.userId !== player.userId),
          theme,
          timeLimit: 180
        });

        // 게임룸 조인
        this.io.sockets.sockets.get(player.socketId)?.join(`game:${gameId}`);
      });

      console.log(`🎮 게임 생성: ${gameId} - 주제: ${theme}`);

      // 5초 후 게임 시작
      setTimeout(() => {
        this.startGame(gameId);
      }, 5000);

    } catch (error) {
      console.error('게임 생성 오류:', error);
    }
  }

  // 게임 시작
  private async startGame(gameId: string) {
    const gameRoom = this.activeGames.get(gameId);
    if (!gameRoom) return;

    gameRoom.status = 'active';
    
    // 게임 시작 이벤트 발송
    this.io.to(`game:${gameId}`).emit('game-start', {
      gameId,
      theme: gameRoom.theme,
      timeLimit: 180,
      startTime: new Date()
    });

    // 게임 DB 상태 업데이트 (DB 연결이 있을 때만)
    try {
      await Game.findByIdAndUpdate(gameId, { status: 'active' });
    } catch (dbError) {
      console.log('⚠️  Database not available, skipping game status update');
    }

    console.log(`🚀 게임 시작: ${gameId}`);

    // 3분 후 자동으로 투표 단계로 이동
    setTimeout(() => {
      this.startVoting(gameId);
    }, 180000);
  }

  // 투표 시작
  private async startVoting(gameId: string) {
    const gameRoom = this.activeGames.get(gameId);
    if (!gameRoom || gameRoom.status !== 'active') return;

    gameRoom.status = 'voting';

    // 제출된 시 가져오기 (DB 연결이 있을 때만)
    let poems = [];
    try {
      const game = await Game.findById(gameId).populate('poems');
      poems = game?.poems || [];
    } catch (dbError) {
      console.log('⚠️  Database not available, using empty poems array');
    }
    
    this.io.to(`game:${gameId}`).emit('voting-start', {
      gameId,
      poems
    });

    try {
      await Game.findByIdAndUpdate(gameId, { status: 'voting' });
    } catch (dbError) {
      console.log('⚠️  Database not available, skipping voting status update');
    }

    console.log(`🗳️ 투표 시작: ${gameId}`);

    // 30초 후 결과 발표
    setTimeout(() => {
      this.endGame(gameId);
    }, 30000);
  }

  // 게임 종료
  private async endGame(gameId: string) {
    const gameRoom = this.activeGames.get(gameId);
    if (!gameRoom) return;

    gameRoom.status = 'finished';

    // 투표 결과 집계 및 승자 결정 (DB 연결이 있을 때만)
    let game = null;
    let winner = null;
    try {
      game = await Game.findById(gameId).populate('poems');
      winner = this.calculateWinner(game);
    } catch (dbError) {
      console.log('⚠️  Database not available, using temporary winner data');
    }

    this.io.to(`game:${gameId}`).emit('game-end', {
      gameId,
      winner,
      finalResults: game?.poems || []
    });

    try {
      await Game.findByIdAndUpdate(gameId, { 
        status: 'finished',
        winner: winner?.userId || null,
        endTime: new Date()
      });
    } catch (dbError) {
      console.log('⚠️  Database not available, skipping game end update');
    }

    // 게임룸 정리
    this.activeGames.delete(gameId);

    console.log(`🏁 게임 종료: ${gameId} - 승자: ${winner?.userId || 'None'}`);
  }

  // 승자 계산
  private calculateWinner(game: any) {
    if (!game?.poems || game.poems.length === 0) return null;

    // 투표수가 많은 시의 작성자가 승자
    let maxVotes = 0;
    let winner = null;

    game.poems.forEach((poem: any) => {
      if (poem.votes > maxVotes) {
        maxVotes = poem.votes;
        winner = { userId: poem.userId };
      }
    });

    return winner;
  }

  // 랜덤 테마 선택
  private getRandomTheme(): string {
    return this.themes[Math.floor(Math.random() * this.themes.length)];
  }

  // 큐 상태 브로드캐스트
  private broadcastQueueStatus() {
    const queueStatus: any = {};
    let totalPlayers = 0;

    for (const [rank, queue] of this.rankQueue.entries()) {
      queueStatus[rank] = queue.length;
      totalPlayers += queue.length;
    }

    this.io.emit('queue-status', {
      totalPlayers,
      byRank: queueStatus
    });
  }

  // 플레이어 연결 해제 처리
  handleDisconnect(socketId: string) {
    // socketId로 userId 찾기
    let disconnectedUserId = null;
    for (const [userId, sId] of this.playerSockets.entries()) {
      if (sId === socketId) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      this.leaveQueue(disconnectedUserId);
      console.log(`🔌 플레이어 연결 해제: ${disconnectedUserId}`);
    }
  }

  // 시 제출 처리
  async handlePoemSubmit(gameId: string, userId: string, poem: any) {
    try {
      // DB 연결이 있을 때만 실제 저장
      let poemId = new mongoose.Types.ObjectId().toString();
      
      try {
        const mongoose = require('mongoose');

        // 이미 제출했는지 확인
        const existingPoem = await Poem.findOne({ 
          gameId: new mongoose.Types.ObjectId(gameId), 
          userId: new mongoose.Types.ObjectId(userId) 
        });

        if (existingPoem) {
          return { success: false, error: 'Poem already submitted' };
        }

        // 게임 정보 가져오기
        const game = await Game.findById(gameId);
        if (!game && mongoose.connection.readyState === 1) {
          return { success: false, error: 'Game not found' };
        }

        // 시 생성
        const newPoem = new Poem({
          userId: new mongoose.Types.ObjectId(userId),
          gameId: new mongoose.Types.ObjectId(gameId),
          content: {
            line1: poem.line1 || '',
            line2: poem.line2 || '',
            line3: poem.line3 || ''
          },
          theme: game?.theme || 'default',
          votes: 0,
          tags: [],
          isPublic: true
        });

        await newPoem.save();
        poemId = newPoem._id as string;

        // 게임의 poems 배열에 추가
        await Game.findByIdAndUpdate(gameId, {
          $push: { poems: newPoem._id }
        });

      } catch (dbError) {
        console.log('⚠️  Database not available, using temporary poem submission');
      }

      console.log(`📝 시 제출: ${gameId} - 사용자: ${userId}`);
      
      return { success: true, poemId };

    } catch (error) {
      console.error('시 제출 오류:', error);
      return { success: false, error: 'Failed to submit poem' };
    }
  }

  // 큐 상태 조회
  getQueueStatus() {
    const status: any = {};
    let total = 0;

    for (const [rank, queue] of this.rankQueue.entries()) {
      status[rank] = queue.length;
      total += queue.length;
    }

    return { total, byRank: status };
  }
}

export default MatchmakingService;
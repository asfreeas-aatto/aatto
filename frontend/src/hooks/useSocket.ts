'use client';

import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface GameData {
  gameId: string;
  opponent: any;
  theme: string;
  timeLimit: number;
}

interface QueueStatus {
  total: number;
  byRank: Record<string, number>;
}

export const useSocket = () => {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ total: 0, byRank: {} });
  const [isInQueue, setIsInQueue] = useState(false);
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'active' | 'voting' | 'finished'>('waiting');

  // 클라이언트 전용 렌더링 보장
  useEffect(() => {
    console.log('🚀 useSocket: 컴포넌트 마운트됨');
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('🔄 useSocket useEffect 실행됨', { 
      mounted, 
      hasSession: !!session, 
      hasUserId: !!session?.user?.id,
      hasUserEmail: !!session?.user?.email,
      sessionStatus: (session?.user?.id || session?.user?.email) ? 'ready' : 'not ready'
    });
    
    // 마운트되고 세션이 있고 (ID 또는 이메일이 있으면) 연결 시도
    const userId = session?.user?.id || session?.user?.email;
    
    if (!mounted || !session || !userId) {
      if (!mounted) console.log('⏳ Component not mounted yet');
      if (mounted && !session) console.log('❌ No session');
      if (mounted && session && !userId) {
        console.log('❌ No user ID or email:', session?.user);
      }
      return;
    }

    console.log('🔄 Attempting Socket connection to:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    console.log('👤 Session user:', session.user);

    // Socket 연결
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      forceNew: true,
      timeout: 20000,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    // 연결 이벤트
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully:', socket.id);
      setIsConnected(true);
      
      // 연결 성공 시 즉시 큐 상태 요청
      socket.emit('get-queue-status');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      setIsInQueue(false);
    });

    // 큐 관련 이벤트
    socket.on('queue-joined', (data) => {
      console.log('✅ 큐 참가 성공:', data);
      setIsInQueue(true);
    });

    socket.on('queue-left', (data) => {
      console.log('🚪 큐 퇴장:', data);
      setIsInQueue(false);
    });

    socket.on('queue-status', (status: QueueStatus) => {
      console.log('📊 큐 상태 업데이트:', status);
      setQueueStatus(status);
    });

    // 매칭 및 게임 이벤트
    socket.on('match-found', (gameData: GameData) => {
      console.log('🎯 매칭 성공!', gameData);
      setCurrentGame(gameData);
      setIsInQueue(false);
      setGameStatus('waiting');
    });

    socket.on('game-start', (data) => {
      console.log('🚀 게임 시작!', data);
      setGameStatus('active');
    });

    socket.on('voting-start', (data) => {
      console.log('🗳️ 투표 시작!', data);
      setGameStatus('voting');
    });

    socket.on('game-end', (data) => {
      console.log('🏁 게임 종료!', data);
      setGameStatus('finished');
      
      // 5초 후 게임 상태 초기화
      setTimeout(() => {
        setCurrentGame(null);
        setGameStatus('waiting');
      }, 5000);
    });

    // 시 제출 확인
    socket.on('poem-submit-success', (data) => {
      console.log('✅ 시 제출 완료:', data);
    });

    // 상대방 시 제출 알림
    socket.on('poem-submitted', (data) => {
      console.log('📝 상대방 시 제출:', data);
    });

    // 투표 결과
    socket.on('vote-counted', (data) => {
      console.log('🗳️ 투표 집계:', data);
    });

    // 에러 처리
    socket.on('error', (error) => {
      console.error('❌ Socket 오류:', error);
      console.error('❌ Socket 오류 상세:', JSON.stringify(error, null, 2));
      
      // 특정 오류에 대한 처리
      if (error?.message?.includes('User ID is required')) {
        console.error('❌ 사용자 ID가 필요합니다. 세션을 확인해주세요.');
      }
    });

    // 초기 큐 상태 요청
    socket.emit('get-queue-status');

    return () => {
      console.log('🔌 Socket 연결 해제');
      socket.disconnect();
    };
  }, [mounted, session?.user?.id, session?.user?.email]);

  // 매칭 큐 참가
  const joinQueue = (mode: string = 'rank') => {
    const userId = session?.user?.id || session?.user?.email;
    if (!mounted || !socketRef.current || !userId) {
      console.log('❌ joinQueue 실패: mounted:', mounted, 'socket:', !!socketRef.current, 'userId:', userId);
      return;
    }
    
    console.log('🎯 매칭 큐 참가 요청:', { userId, mode });
    socketRef.current.emit('join-queue', {
      userId,
      mode
    });
  };

  // 매칭 큐 나가기
  const leaveQueue = () => {
    const userId = session?.user?.id || session?.user?.email;
    if (!mounted || !socketRef.current || !userId) return;
    
    socketRef.current.emit('leave-queue', {
      userId
    });
  };

  // 시 제출
  const submitPoem = (poem: { line1: string; line2: string; line3: string }) => {
    const userId = session?.user?.id || session?.user?.email;
    if (!mounted || !socketRef.current || !currentGame || !userId) return;
    
    socketRef.current.emit('submit-poem', {
      gameId: currentGame.gameId,
      userId,
      poem
    });
  };

  // 투표
  const vote = (poemId: string) => {
    if (!mounted || !socketRef.current || !currentGame) return;
    
    socketRef.current.emit('vote', {
      gameId: currentGame.gameId,
      poemId,
      voterId: `anonymous_${Date.now()}`
    });
  };

  // 큐 상태 업데이트 요청
  const refreshQueueStatus = () => {
    if (!mounted || !socketRef.current) return;
    socketRef.current.emit('get-queue-status');
  };

  // 서버 사이드에서는 기본값 반환
  if (!mounted) {
    return {
      isConnected: false,
      queueStatus: { total: 0, byRank: {} },
      isInQueue: false,
      currentGame: null,
      gameStatus: 'waiting' as const,
      joinQueue: () => {},
      leaveQueue: () => {},
      submitPoem: () => {},
      vote: () => {},
      refreshQueueStatus: () => {}
    };
  }

  return {
    isConnected,
    queueStatus,
    isInQueue,
    currentGame,
    gameStatus,
    joinQueue,
    leaveQueue,
    submitPoem,
    vote,
    refreshQueueStatus
  };
};
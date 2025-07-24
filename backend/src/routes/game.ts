import express from 'express';
import { Game, Poem } from '../models';
import mongoose from 'mongoose';

const router = express.Router();

// 큐 상태 조회 (REST API)
router.get('/queue-status', async (req, res) => {
  try {
    // 간단한 큐 상태 응답 (실제로는 MatchmakingService에서 가져와야 함)
    res.json({
      total: 0,
      byRank: {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        diamond: 0
      }
    });
  } catch (error) {
    console.error('큐 상태 조회 오류:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// 게임 정보 조회
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId)
      .populate('players', 'profile.nickname profile.rank profile.level')
      .populate('poems');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);

  } catch (error) {
    console.error('게임 조회 오류:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

// 시 제출
router.post('/:gameId/submit-poem', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { userId, poem, theme } = req.body;

    if (!userId || !poem || !poem.line1 || !poem.line2 || !poem.line3) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // 게임 존재 확인
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // 이미 제출했는지 확인
    const existingPoem = await Poem.findOne({ 
      gameId: new mongoose.Types.ObjectId(gameId), 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (existingPoem) {
      return res.status(400).json({ error: 'Poem already submitted' });
    }

    // 시 생성
    const newPoem = new Poem({
      userId: new mongoose.Types.ObjectId(userId),
      gameId: new mongoose.Types.ObjectId(gameId),
      content: {
        line1: poem.line1,
        line2: poem.line2,
        line3: poem.line3
      },
      theme: theme || game.theme,
      votes: 0,
      tags: [],
      isPublic: true
    });

    await newPoem.save();

    // 게임의 poems 배열에 추가
    await Game.findByIdAndUpdate(gameId, {
      $push: { poems: newPoem._id }
    });

    res.json({
      success: true,
      poemId: newPoem._id,
      message: 'Poem submitted successfully'
    });

  } catch (error) {
    console.error('시 제출 오류:', error);
    res.status(500).json({ error: 'Failed to submit poem' });
  }
});

// 투표
router.post('/:gameId/vote', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { poemId, voterId } = req.body;

    if (!poemId || !voterId) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // 게임 존재 확인
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // 이미 투표했는지 확인
    const existingVote = game.votes.find(vote => vote.voterId === voterId);
    if (existingVote) {
      return res.status(400).json({ error: 'Already voted' });
    }

    // 투표 추가
    await Game.findByIdAndUpdate(gameId, {
      $push: { 
        votes: { 
          voterId, 
          poemId: new mongoose.Types.ObjectId(poemId) 
        } 
      }
    });

    // 시의 투표 수 증가
    await Poem.findByIdAndUpdate(poemId, {
      $inc: { votes: 1 }
    });

    res.json({
      success: true,
      message: 'Vote recorded successfully'
    });

  } catch (error) {
    console.error('투표 오류:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// 게임 결과 조회
router.get('/:gameId/results', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findById(gameId)
      .populate('players', 'profile.nickname profile.rank')
      .populate('poems')
      .populate('winner', 'profile.nickname');

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // 시별 투표 결과 정리
    const results = game.poems.map((poem: any) => ({
      _id: poem._id,
      content: poem.content,
      author: game.players.find((p: any) => p._id.toString() === poem.userId.toString()),
      votes: poem.votes
    }));

    // 투표 수로 정렬
    results.sort((a, b) => b.votes - a.votes);

    res.json({
      gameId: game._id,
      theme: game.theme,
      status: game.status,
      players: game.players,
      results,
      winner: game.winner,
      startTime: game.startTime,
      endTime: game.endTime
    });

  } catch (error) {
    console.error('게임 결과 조회 오류:', error);
    res.status(500).json({ error: 'Failed to get game results' });
  }
});

export default router;
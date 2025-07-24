import express from 'express';
import { User } from '../models';

const router = express.Router();

// 로그인/회원가입 처리
router.post('/login', async (req, res) => {
  try {
    const { id, email, name, image, provider } = req.body;

    if (!id || !email || !provider) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // 기존 사용자 찾기
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { username: id }
      ]
    });

    if (user) {
      // 기존 사용자 - 마지막 로그인 시간 업데이트
      user.lastLogin = new Date();
      await user.save();
    } else {
      // 신규 사용자 - 계정 생성
      user = new User({
        username: id,
        email: email,
        provider: provider,
        profile: {
          avatar: image || '',
          nickname: name || '익명의 시인',
          bio: '',
          level: 1,
          exp: 0,
          rank: 'bronze'
        },
        stats: {
          totalGames: 0,
          wins: 0,
          winRate: 0,
          bestStreak: 0,
          totalPoems: 0
        },
        createdAt: new Date(),
        lastLogin: new Date()
      });

      await user.save();
      console.log('✅ 새 사용자 생성:', user.profile.nickname);
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      stats: user.stats
    });

  } catch (error) {
    console.error('로그인 처리 오류:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 사용자 프로필 조회
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      profile: user.profile,
      stats: user.stats,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
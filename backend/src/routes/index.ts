import express from 'express';
import authRoutes from './auth';
import gameRoutes from './game';
import aiRoutes from './ai';

const router = express.Router();

// 라우트 등록
router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/ai', aiRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
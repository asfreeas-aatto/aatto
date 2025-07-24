import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware (temporarily disabled for deployment)
// import { generalLimiter, validateInput, errorHandler } from './middleware/security';

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting (temporarily disabled)
// app.use(generalLimiter);

// Input validation (temporarily disabled)
// app.use(validateInput);

// MongoDB connection
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  MongoDB URI not configured - running in development mode without database');
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚡ Starting server without MongoDB connection...');
  }
};

// Socket.io connection with matchmaking
import MatchmakingService from './services/MatchmakingService';

const matchmaking = new MatchmakingService(io);

io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);
  console.log('🔗 Connection details:', {
    id: socket.id,
    handshake: socket.handshake.query,
    address: socket.handshake.address
  });

  // 매칭 큐 참가
  socket.on('join-queue', async (data) => {
    try {
      console.log('📥 join-queue 요청:', data);
      const { userId, mode = 'rank' } = data;
      if (!userId) {
        console.error('❌ User ID 누락');
        socket.emit('error', { message: 'User ID is required' });
        return;
      }

      console.log('🎯 매칭 큐 참가 시도:', { userId, mode });
      const result = await matchmaking.joinQueue(userId, socket.id, mode);
      socket.emit('queue-joined', result);
      console.log('✅ 큐 참가 성공:', result);
      
    } catch (error) {
      console.error('❌ 큐 참가 오류:', error);
      socket.emit('error', { message: 'Failed to join queue', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // 매칭 큐 나가기
  socket.on('leave-queue', (data) => {
    const { userId } = data;
    if (userId) {
      matchmaking.leaveQueue(userId);
      socket.emit('queue-left', { success: true });
    }
  });

  // 큐 상태 조회
  socket.on('get-queue-status', () => {
    try {
      console.log('📊 큐 상태 조회 요청');
      const status = matchmaking.getQueueStatus();
      socket.emit('queue-status', status);
      console.log('📊 큐 상태 응답:', status);
    } catch (error) {
      console.error('❌ 큐 상태 조회 오류:', error);
      socket.emit('error', { message: 'Failed to get queue status', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // 시 제출
  socket.on('submit-poem', async (data) => {
    try {
      const { gameId, userId, poem } = data;
      
      const result = await matchmaking.handlePoemSubmit(gameId, userId, poem);
      
      if (result.success) {
        // 게임룸의 모든 플레이어에게 알림
        io.to(`game:${gameId}`).emit('poem-submitted', {
          playerId: userId,
          timestamp: new Date()
        });

        socket.emit('poem-submit-success', { gameId, poemId: result.poemId });
      } else {
        socket.emit('error', { message: result.error });
      }
      
    } catch (error) {
      console.error('시 제출 오류:', error);
      socket.emit('error', { message: 'Failed to submit poem' });
    }
  });

  // 투표
  socket.on('vote', async (data) => {
    try {
      const { gameId, poemId, voterId } = data;
      
      // 투표 결과를 게임룸에 브로드캐스트
      io.to(`game:${gameId}`).emit('vote-counted', {
        poemId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('투표 오류:', error);
      socket.emit('error', { message: 'Failed to vote' });
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    matchmaking.handleDisconnect(socket.id);
  });
});

// 기본 라우트 추가
app.get('/', (req, res) => {
  res.json({ 
    message: '세 줄 마음 API 서버', 
    status: 'running',
    socketConnected: true 
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
import routes from './routes';
app.use('/api', routes);

// Error handling middleware (temporarily disabled)
// app.use(errorHandler);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
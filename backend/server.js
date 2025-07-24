const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple AI service
const { GoogleGenerativeAI } = require('@google/generative-ai');

class SimpleAIService {
  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (apiKey && apiKey !== 'your_google_ai_studio_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
  }

  async generatePoem(theme, difficulty = 'medium') {
    // Fallback templates
    const templates = {
      '사랑해': ['사람은 혼자서는 살 수 없어', '랑하는 마음이 있어야만', '해피엔딩을 만들 수 있지'],
      '고마워': ['고개 숙여 인사드려요', '마음 깊이 새겨놓은', '워밍한 당신의 사랑을'],
      '벚꽃비': ['벚꽃이 흩날리는 봄날', '꽃잎처럼 떨어지는 추억', '비 오듯 내리는 그리움'],
    };

    const fallback = templates[theme] || [
      `${theme[0]}로 시작하는 이야기`,
      `${theme[1] || theme[0]}처럼 아름다운`,
      `${theme[2] || theme[0]}과 함께하는 시간`
    ];

    if (this.model) {
      try {
        const prompt = `한국어 3행시를 작성해주세요. 주제: "${theme}". 각 줄은 주제의 각 글자로 시작해야 합니다.`;
        const result = await this.model.generateContent(prompt);
        const text = await result.response.text();
        const lines = text.split('\n').filter(line => line.trim()).slice(0, 3);
        
        if (lines.length >= 3) {
          return {
            line1: lines[0],
            line2: lines[1],
            line3: lines[2],
            theme,
            reasoning: 'AI generated'
          };
        }
      } catch (error) {
        console.error('AI generation error:', error);
      }
    }

    return {
      line1: fallback[0],
      line2: fallback[1],
      line3: fallback[2],
      theme,
      reasoning: 'Template based'
    };
  }
}

const aiService = new SimpleAIService();

// Routes
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

// AI routes
app.post('/api/ai/generate-poem', async (req, res) => {
  try {
    const { theme, difficulty, style } = req.body;
    const poem = await aiService.generatePoem(theme, difficulty);
    
    res.json({
      success: true,
      poem,
      aiInfo: {
        nickname: 'AI 시인',
        description: '균형잡힌 창작 AI',
        winMessage: '좋은 대결이었습니다!',
        loseMessage: '당신의 작품이 더 훌륭하네요!'
      }
    });
  } catch (error) {
    console.error('Poem generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate poem' });
  }
});

app.post('/api/ai/battle/evaluate', async (req, res) => {
  try {
    const { humanPoem, aiPoem, theme, userChoice } = req.body;
    
    res.json({
      success: true,
      evaluation: {
        winner: userChoice,
        feedback: '재미있는 대결이었습니다!'
      }
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ success: false, error: 'Failed to evaluate' });
  }
});

// Basic Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('get-queue-status', () => {
    socket.emit('queue-status', {
      total: 0,
      byRank: { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 }
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
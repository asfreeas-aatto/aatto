import express from 'express';
import AIService from '../services/AIService';

const router = express.Router();
const aiService = new AIService();

// AI와 대전 시작
router.post('/battle/start', async (req, res) => {
  try {
    const { theme, difficulty = 'medium', userId } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    // AI 상대방 정보 생성
    const aiPersonality = aiService.getAIPersonality(difficulty);
    
    // 게임 세션 생성
    const gameSession = {
      gameId: `ai_battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mode: 'ai-battle',
      theme,
      difficulty,
      players: [
        { userId, type: 'human', nickname: 'Player' },
        { userId: 'ai', type: 'ai', nickname: aiPersonality.nickname }
      ],
      aiPersonality,
      status: 'active',
      timeLimit: 180,
      createdAt: new Date()
    };

    res.json({
      success: true,
      gameSession,
      message: `${aiPersonality.nickname}와(과) "${theme}" 주제로 3행시 대결을 시작합니다!`
    });

  } catch (error) {
    console.error('AI 대전 시작 오류:', error);
    res.status(500).json({ error: 'Failed to start AI battle' });
  }
});

// AI 시 생성
router.post('/generate-poem', async (req, res) => {
  try {
    const { theme, difficulty = 'medium', style = 'creative' } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    console.log('🤖 AI 시 생성 요청:', { theme, difficulty, style });

    const poem = await aiService.generatePoem({ 
      theme, 
      difficulty, 
      style 
    });

    res.json({
      success: true,
      poem,
      aiInfo: aiService.getAIPersonality(difficulty)
    });

  } catch (error) {
    console.error('AI 시 생성 오류:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI poem',
      fallback: true
    });
  }
});

// AI 대전 결과 평가
router.post('/battle/evaluate', async (req, res) => {
  try {
    const { humanPoem, aiPoem, theme, gameId } = req.body;

    // 간단한 평가 로직 (추후 더 정교하게 개선 가능)
    const evaluation = {
      humanScore: calculatePoemScore(humanPoem, theme),
      aiScore: calculatePoemScore(aiPoem, theme),
      feedback: generateFeedback(humanPoem, aiPoem, theme)
    };

    const winner = evaluation.humanScore > evaluation.aiScore ? 'human' : 'ai';
    
    res.json({
      success: true,
      evaluation,
      winner,
      gameId,
      message: winner === 'human' ? '축하합니다! 승리하셨네요!' : '아쉽게도 AI가 이겼네요. 다시 도전해보세요!'
    });

  } catch (error) {
    console.error('AI 대전 평가 오류:', error);
    res.status(500).json({ error: 'Failed to evaluate AI battle' });
  }
});

// 시 점수 계산 함수 (간단한 버전)
function calculatePoemScore(poem: any, theme: string): number {
  if (!poem || !poem.line1 || !poem.line2 || !poem.line3) {
    return 0;
  }

  let score = 0;
  
  // 기본 완성도 점수
  if (poem.line1.trim()) score += 30;
  if (poem.line2.trim()) score += 30; 
  if (poem.line3.trim()) score += 30;
  
  // 주제 연관성 점수 (단순 키워드 매칭)
  const themeChars = theme.split('');
  const content = `${poem.line1} ${poem.line2} ${poem.line3}`;
  
  themeChars.forEach(char => {
    if (content.includes(char)) score += 3;
  });

  // 창의성 보너스 (길이와 다양성 기반)
  const totalLength = poem.line1.length + poem.line2.length + poem.line3.length;
  if (totalLength > 30) score += 5;
  if (totalLength > 50) score += 5;

  return Math.min(score, 100);
}

// 피드백 생성 함수
function generateFeedback(humanPoem: any, aiPoem: any, theme: string): string {
  const feedbacks = [
    `"${theme}" 주제를 잘 살린 멋진 작품이네요!`,
    '창의적인 표현이 돋보이는 시입니다.',
    '감정이 잘 드러나는 따뜻한 작품이에요.',
    '리듬감이 좋고 읽기 편한 시네요.',
    '독창적인 발상이 인상깊습니다.'
  ];

  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
}

export default router;
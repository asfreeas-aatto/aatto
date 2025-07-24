import { GoogleGenerativeAI } from '@google/generative-ai';

interface PoemRequest {
  theme: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  style?: 'funny' | 'serious' | 'cute' | 'creative';
}

interface GeneratedPoem {
  line1: string;
  line2: string;
  line3: string;
  theme: string;
  reasoning?: string;
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || apiKey === 'your_google_ai_studio_api_key_here') {
      console.warn('⚠️ Google AI API key not configured');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async generatePoem(request: PoemRequest): Promise<GeneratedPoem> {
    if (!this.model) {
      // API key가 없을 때 임시 시 생성
      return this.generateFallbackPoem(request.theme);
    }

    try {
      const prompt = this.buildPrompt(request);
      console.log('🤖 AI 시 생성 요청:', { theme: request.theme, difficulty: request.difficulty });
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const poem = this.parseAIResponse(text, request.theme);
      console.log('✅ AI 시 생성 완료:', poem);
      
      return poem;
    } catch (error) {
      console.error('❌ AI 시 생성 오류:', error);
      return this.generateFallbackPoem(request.theme);
    }
  }

  private buildPrompt(request: PoemRequest): string {
    const { theme, difficulty = 'medium', style = 'creative' } = request;
    
    const difficultyGuides = {
      easy: '쉽고 직관적인 표현을 사용하며',
      medium: '적당한 수준의 창의성과 표현력으로',
      hard: '고급스럽고 창의적인 문학적 표현을 사용하여'
    };

    const styleGuides = {
      funny: '유머러스하고 재미있게',
      serious: '진지하고 깊이 있게', 
      cute: '귀엽고 따뜻하게',
      creative: '창의적이고 독특하게'
    };

    return `한국어 3행시를 작성해주세요.

주제: "${theme}"
난이도: ${difficulty} (${difficultyGuides[difficulty]})
스타일: ${style} (${styleGuides[style]})

조건:
1. "${theme}"의 각 글자로 시작하는 3줄의 시를 작성
2. 각 줄은 15-25글자 내외로 자연스럽게
3. 전체적으로 하나의 완성된 이야기나 감정을 표현
4. 한국어 문법과 어법을 정확히 지켜서
5. ${styleGuides[style]} 표현할 것

응답 형식:
첫째줄: [${theme[0]}로 시작하는 문장]
둘째줄: [${theme[1] || theme[0]}로 시작하는 문장]  
셋째줄: [${theme[2] || theme[0]}로 시작하는 문장]

추가 설명은 하지 말고, 오직 3행의 시만 작성해주세요.`;
  }

  private parseAIResponse(text: string, theme: string): GeneratedPoem {
    const lines = text.split('\n').filter(line => line.trim());
    
    // AI 응답에서 시 라인만 추출
    const poemLines = lines
      .filter(line => !line.includes(':') || line.includes('째줄:'))
      .map(line => line.replace(/^.*째줄:\s*/, '').trim())
      .filter(line => line.length > 0);

    if (poemLines.length >= 3) {
      return {
        line1: poemLines[0],
        line2: poemLines[1], 
        line3: poemLines[2],
        theme,
        reasoning: `AI가 "${theme}" 주제로 창작한 작품`
      };
    }

    // 파싱 실패 시 전체 텍스트에서 라인 추출
    const allLines = text.split('\n').filter(line => line.trim().length > 5);
    
    return {
      line1: allLines[0] || `${theme[0]}로 시작하는 멋진 이야기`,
      line2: allLines[1] || `${theme[1] || theme[0]}처럼 아름다운 순간들`,
      line3: allLines[2] || `${theme[2] || theme[0]}과 함께하는 시간`,
      theme,
      reasoning: 'AI 응답 파싱 후 생성된 작품'
    };
  }

  private generateFallbackPoem(theme: string): GeneratedPoem {
    // API 키가 없거나 오류 시 사용할 임시 시 템플릿
    const fallbackTemplates = {
      '사랑해': {
        line1: '사람은 혼자서는 살 수 없어',
        line2: '랑하는 마음이 있어야만',
        line3: '해피엔딩을 만들 수 있지'
      },
      '고마워': {
        line1: '고개 숙여 인사드려요',
        line2: '마음 깊이 새겨놓은',
        line3: '워밍한 당신의 사랑을'
      },
      '벚꽃비': {
        line1: '벚꽃이 흩날리는 봄날',
        line2: '꽃잎처럼 떨어지는 추억',
        line3: '비 오듯 내리는 그리움'
      },
      '별하늘': {
        line1: '별빛이 쏟아지는 밤',
        line2: '하얀 달빛 아래서',
        line3: '늘 꿈꾸던 이야기를'
      },
      '친구야': {
        line1: '친한 사이라서 좋은',
        line2: '구름처럼 자유로운',
        line3: '야생화 같은 우정이'
      },
      '엄마야': {
        line1: '엄청나게 소중한 분',
        line2: '마음속 깊이 자리한',
        line3: '야속하지만 고마운 사랑'
      },
      '행복해': {
        line1: '행여나 잊을까 봐',
        line2: '복된 이 순간을',
        line3: '해맑은 웃음으로 간직해'
      },
      '꿈나무': {
        line1: '꿈을 키우는 어린이',
        line2: '나무처럼 자라나서',
        line3: '무럭무럭 자라날 거야'
      },
      '바다야': {
        line1: '바람이 불어오는 곳',
        line2: '다정한 파도 소리와',
        line3: '야속한 갈매기 울음'
      },
      '하늘아': {
        line1: '하얗게 펼쳐진 구름',
        line2: '늘 푸른 너의 모습',
        line3: '아름다운 꿈을 그려줘'
      }
    };

    const template = fallbackTemplates[theme as keyof typeof fallbackTemplates];
    
    if (template) {
      return {
        ...template,
        theme,
        reasoning: 'AI 시스템이 생성한 기본 템플릿'
      };
    }

    // 기본 템플릿이 없는 주제일 경우
    return {
      line1: `${theme[0]}로 시작하는 이야기`,
      line2: `${theme[1] || theme[0]}처럼 아름다운`,
      line3: `${theme[2] || theme[0]}과 함께하는 시간`,
      theme,
      reasoning: 'AI 시스템이 생성한 동적 템플릿'
    };
  }

  // AI 난이도별 성격 설정
  getAIPersonality(difficulty: 'easy' | 'medium' | 'hard') {
    const personalities = {
      easy: {
        nickname: 'AI 새싹이',
        description: '귀엽고 친근한 AI',
        winMessage: '와! 정말 재미있었어요!',
        loseMessage: '다음엔 더 열심히 할게요!'
      },
      medium: {
        nickname: 'AI 시인',
        description: '균형잡힌 창작 AI',
        winMessage: '좋은 대결이었습니다!',
        loseMessage: '당신의 작품이 더 훌륭하네요!'
      },
      hard: {
        nickname: 'AI 대가',
        description: '고수준 문학 AI',
        winMessage: '치열한 대결이었군요.',
        loseMessage: '당신의 문학적 감성에 감복합니다.'
      }
    };

    return personalities[difficulty];
  }
}

export default AIService;
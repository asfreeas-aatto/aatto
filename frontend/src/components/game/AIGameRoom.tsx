'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

interface AIGameRoomProps {
  gameData: {
    gameId: string;
    theme: string;
    timeLimit: number;
    opponent: {
      nickname: string;
      type: string;
    };
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  onComplete?: (userPoem: any, aiPoem: any) => void;
}

export default function AIGameRoom({ gameData, onComplete }: AIGameRoomProps) {
  const { data: session } = useSession();
  const [timeLeft, setTimeLeft] = useState(gameData.timeLimit);
  const [gamePhase, setGamePhase] = useState<'writing' | 'ai_thinking' | 'complete'>('writing');
  const [poem, setPoem] = useState({
    line1: '',
    line2: '',
    line3: ''
  });
  const [aiPoem, setAiPoem] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiThinkingTime, setAiThinkingTime] = useState(0);

  // 게임 타이머
  useEffect(() => {
    if (gamePhase !== 'writing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 시간 종료 시 자동 제출
          if (!isSubmitted && (poem.line1 || poem.line2 || poem.line3)) {
            handleSubmitPoem();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, isSubmitted, poem]);

  // AI 생각 시간 타이머
  useEffect(() => {
    if (gamePhase !== 'ai_thinking') return;

    const timer = setInterval(() => {
      setAiThinkingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (line: 'line1' | 'line2' | 'line3', value: string) => {
    if (value.length <= 50) {
      setPoem(prev => ({
        ...prev,
        [line]: value
      }));
    }
  };

  const handleSubmitPoem = async () => {
    if (!poem.line1.trim() && !poem.line2.trim() && !poem.line3.trim()) {
      alert('최소 한 줄은 작성해주세요!');
      return;
    }

    setIsSubmitted(true);
    setGamePhase('ai_thinking');

    // AI 시 생성 요청
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      console.log('API URL:', apiUrl); // 디버깅용
      const response = await fetch(`${apiUrl}/api/ai/generate-poem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: gameData.theme,
          difficulty: gameData.difficulty || 'medium',
          style: 'creative'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setAiPoem(result.poem);
        setGamePhase('complete');
        
        // 결과 콜백 호출
        if (onComplete) {
          onComplete(poem, result.poem);
        }
      } else {
        console.error('AI 시 생성 실패:', result.error);
        // 실패 시에도 게임 진행
        setGamePhase('complete');
      }
    } catch (error) {
      console.error('AI 시 생성 오류:', error);
      
      // 폴백: 템플릿 기반 시 생성
      const fallbackPoems: Record<string, any> = {
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
          line2: '하늘을 올려다보며',
          line3: '늘 꿈꾸던 소원을 빌어'
        },
        '친구야': {
          line1: '친하게 지내던 그때가',
          line2: '구름처럼 떠오르네',
          line3: '야속하게도 시간은 빨라'
        },
        '엄마야': {
          line1: '엄청난 사랑으로 키워주신',
          line2: '마음 깊이 감사드려요',
          line3: '야무지게 효도하며 살게요'
        },
        '행복해': {
          line1: '행운이 가득한 하루',
          line2: '복스러운 웃음소리가',
          line3: '해맑게 울려 퍼지네'
        },
        '꿈나무': {
          line1: '꿈을 키우는 아이들이',
          line2: '나날이 자라나는 모습',
          line3: '무럭무럭 푸르게 자라네'
        },
        '바다야': {
          line1: '바람이 불어오는 해변',
          line2: '다정한 파도소리와 함께',
          line3: '야경이 아름다운 밤'
        },
        '하늘아': {
          line1: '하얗게 떠가는 구름',
          line2: '늘 푸른 창공 아래서',
          line3: '아름다운 세상을 바라봐'
        }
      };

      const fallback = fallbackPoems[gameData.theme] || {
        line1: `${gameData.theme[0]}로 시작하는 이야기`,
        line2: `${gameData.theme[1] || gameData.theme[0]}처럼 아름다운`,
        line3: `${gameData.theme[2] || gameData.theme[0]}과 함께하는 시간`
      };

      setAiPoem(fallback);
      setGamePhase('complete');
      
      // 결과 콜백 호출
      if (onComplete) {
        onComplete(poem, fallback);
      }
    }
  };

  const isPoemComplete = poem.line1.trim() && poem.line2.trim() && poem.line3.trim();

  if (gamePhase === 'writing') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* 게임 헤더 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl mr-2">✍️</div>
            <div className="text-4xl mx-2">⚔️</div>
            <div className="text-4xl ml-2">🤖</div>
          </div>
          <h2 className="text-2xl font-bold mb-2">AI와 3행시 대결!</h2>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
            <p className="text-lg font-bold text-purple-600 mb-1">주제: {gameData.theme}</p>
            <p className="text-3xl font-bold text-red-600">{formatTime(timeLeft)}</p>
            <p className="text-sm text-gray-600 mt-2">
              상대: {gameData.opponent.nickname} ({gameData.difficulty || 'medium'} 난이도)
            </p>
          </div>
        </div>

        {/* 3행시 입력 폼 */}
        <div className="space-y-4 mb-6">
          {['line1', 'line2', 'line3'].map((line, index) => (
            <div key={line}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {index + 1}번째 줄 ({poem[line as keyof typeof poem].length}/50)
              </label>
              <input
                type="text"
                value={poem[line as keyof typeof poem]}
                onChange={(e) => handleInputChange(line as keyof typeof poem, e.target.value)}
                placeholder={`${gameData.theme}의 ${index === 0 ? '첫' : index === 1 ? '두' : '세'}번째 글자로 시작하는 문장`}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isSubmitted}
                maxLength={50}
              />
            </div>
          ))}
        </div>

        {/* 작성 상태 및 제출 버튼 */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-sm text-gray-600">
              완성도: {isPoemComplete ? '✅ 완성' : '⏳ 작성 중...'}
            </div>
          </div>
          
          <Button
            onClick={handleSubmitPoem}
            disabled={(!poem.line1.trim() && !poem.line2.trim() && !poem.line3.trim()) || isSubmitted}
            className="w-full py-3"
          >
            {isPoemComplete ? 'AI와 대결하기!' : '미완성이어도 제출하기'}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            💡 제출하면 AI가 같은 주제로 시를 작성합니다
          </p>
        </div>
      </div>
    );
  }

  if (gamePhase === 'ai_thinking') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-2xl font-bold mb-4">AI가 시를 창작하고 있어요...</h2>
        
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {formatTime(aiThinkingTime)}
          </div>
          <p className="text-sm text-gray-600 mb-4">AI 창작 시간</p>
          
          <div className="flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* 사용자 작품 미리보기 */}
        <div className="bg-purple-50 rounded-xl p-4">
          <h3 className="font-semibold mb-3">내가 제출한 작품</h3>
          <div className="space-y-2 text-center">
            {poem.line1 && <p className="text-lg">{poem.line1}</p>}
            {poem.line2 && <p className="text-lg">{poem.line2}</p>}
            {poem.line3 && <p className="text-lg">{poem.line3}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'complete') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold mb-4">작품 완성!</h2>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-green-600 font-semibold">양쪽 모두 창작 완료! 결과를 확인해보세요.</p>
          </div>
        </div>

        {/* 작품 비교 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 사용자 작품 */}
          <div className="border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-center text-purple-600">
              👤 {session?.user?.nickname || session?.user?.name || '나'}
            </h3>
            <div className="space-y-2 text-center bg-purple-50 rounded-lg p-4">
              {poem.line1 && <p className="text-lg">{poem.line1}</p>}
              {poem.line2 && <p className="text-lg">{poem.line2}</p>}
              {poem.line3 && <p className="text-lg">{poem.line3}</p>}
            </div>
          </div>

          {/* AI 작품 */}
          <div className="border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-center text-blue-600">
              🤖 {gameData.opponent.nickname}
            </h3>
            <div className="space-y-2 text-center bg-blue-50 rounded-lg p-4">
              {aiPoem ? (
                <>
                  <p className="text-lg">{aiPoem.line1}</p>
                  <p className="text-lg">{aiPoem.line2}</p>
                  <p className="text-lg">{aiPoem.line3}</p>
                </>
              ) : (
                <p className="text-gray-400 italic">AI 작품을 불러오는 중...</p>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">두 작품이 모두 완성되었습니다!</p>
          <p className="text-sm text-gray-500">곧 투표 화면으로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return null;
}
'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

interface Poem {
  line1: string;
  line2: string;
  line3: string;
  author: string;
  authorType: 'human' | 'ai';
}

interface AIVotingRoomProps {
  gameData: {
    gameId: string;
    theme: string;
  };
  humanPoem: Poem;
  aiPoem: Poem;
  onVotingComplete?: (winner: 'human' | 'ai', results: any) => void;
}

export default function AIVotingRoom({ 
  gameData, 
  humanPoem, 
  aiPoem, 
  onVotingComplete 
}: AIVotingRoomProps) {
  const { data: session } = useSession();
  const [selectedPoem, setSelectedPoem] = useState<'human' | 'ai' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // 투표 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!hasVoted) {
            // 시간 종료 시 무작위 투표
            handleVote(Math.random() > 0.5 ? 'human' : 'ai');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasVoted]);

  const handleVote = async (choice: 'human' | 'ai') => {
    if (hasVoted) return;

    setSelectedPoem(choice);
    setHasVoted(true);
    setIsEvaluating(true);

    // AI 대전 결과 평가 요청
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/ai/battle/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          humanPoem,
          aiPoem,
          theme: gameData.theme,
          gameId: gameData.gameId,
          userChoice: choice
        }),
      });

      const result = await response.json();
      
      if (result.success && onVotingComplete) {
        // 사용자 선택과 AI 평가를 모두 고려한 최종 결과
        const finalWinner = choice; // 우선 사용자 선택을 기준으로
        onVotingComplete(finalWinner, {
          userChoice: choice,
          aiEvaluation: result.evaluation,
          feedback: result.evaluation?.feedback
        });
      }
    } catch (error) {
      console.error('AI 대전 평가 오류:', error);
      // 실패해도 사용자 선택대로 진행
      if (onVotingComplete) {
        onVotingComplete(choice, { userChoice: choice });
      }
    }

    setIsEvaluating(false);
  };

  const formatTime = (seconds: number) => {
    return `${seconds}초`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* 투표 헤더 */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🗳️</div>
        <h2 className="text-2xl font-bold mb-2">어떤 작품이 더 마음에 드시나요?</h2>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-lg font-bold text-blue-600 mb-1">주제: {gameData.theme}</p>
          <p className="text-2xl font-bold text-red-600">{formatTime(timeLeft)}</p>
        </div>
      </div>

      {/* 작품 비교 투표 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 사용자 작품 */}
        <div
          className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
            selectedPoem === 'human'
              ? 'border-purple-500 bg-purple-50'
              : hasVoted
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
          }`}
          onClick={() => !hasVoted && handleVote('human')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-purple-600">
              👤 {session?.user?.nickname || session?.user?.name || '나'}
            </h3>
            {selectedPoem === 'human' && (
              <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                ✅ 선택됨
              </div>
            )}
          </div>
          
          <div className="space-y-2 text-center bg-white rounded-lg p-4">
            {humanPoem.line1 && <p className="text-lg leading-relaxed">{humanPoem.line1}</p>}
            {humanPoem.line2 && <p className="text-lg leading-relaxed">{humanPoem.line2}</p>}
            {humanPoem.line3 && <p className="text-lg leading-relaxed">{humanPoem.line3}</p>}
            
            {!humanPoem.line1 && !humanPoem.line2 && !humanPoem.line3 && (
              <div className="text-gray-400 italic">작품이 제출되지 않았습니다</div>
            )}
          </div>
        </div>

        {/* AI 작품 */}
        <div
          className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
            selectedPoem === 'ai'
              ? 'border-blue-500 bg-blue-50'
              : hasVoted
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
          }`}
          onClick={() => !hasVoted && handleVote('ai')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-blue-600">
              🤖 AI 시인
            </h3>
            {selectedPoem === 'ai' && (
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                ✅ 선택됨
              </div>
            )}
          </div>
          
          <div className="space-y-2 text-center bg-white rounded-lg p-4">
            {aiPoem?.line1 && <p className="text-lg leading-relaxed">{aiPoem.line1}</p>}
            {aiPoem?.line2 && <p className="text-lg leading-relaxed">{aiPoem.line2}</p>}
            {aiPoem?.line3 && <p className="text-lg leading-relaxed">{aiPoem.line3}</p>}
            
            {(!aiPoem || (!aiPoem.line1 && !aiPoem.line2 && !aiPoem.line3)) && (
              <div className="text-gray-400 italic">AI 작품을 불러오는 중...</div>
            )}
          </div>
        </div>
      </div>

      {/* 투표 상태 */}
      <div className="text-center">
        {!hasVoted && timeLeft > 0 && (
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">
              ✨ 더 마음에 드는 작품을 선택해주세요
            </p>
            <p className="text-xs text-gray-500">
              두 작품을 비교하여 더 창의적이고 감동적인 작품을 골라보세요
            </p>
          </div>
        )}

        {hasVoted && !isEvaluating && (
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-green-600 font-semibold mb-2">✅ 투표 완료!</div>
            <p className="text-sm text-gray-600">
              {selectedPoem === 'human' ? '내 작품' : 'AI 작품'}을 선택하셨네요. 곧 결과가 발표됩니다!
            </p>
          </div>
        )}

        {isEvaluating && (
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-blue-600 font-semibold mb-2">🔄 결과 계산 중...</div>
            <p className="text-sm text-gray-600">AI가 두 작품을 분석하고 있습니다</p>
          </div>
        )}

        {timeLeft === 0 && !hasVoted && (
          <div className="bg-red-50 rounded-xl p-4">
            <div className="text-red-600 font-semibold mb-2">⏰ 투표 시간 종료</div>
            <p className="text-sm text-gray-600">자동으로 결과를 계산합니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
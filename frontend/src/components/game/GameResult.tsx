'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

interface Poem {
  _id: string;
  content: {
    line1: string;
    line2: string;
    line3: string;
  };
  userId: string;
  votes: number;
  author?: {
    profile: {
      nickname: string;
    };
  };
}

interface GameResultProps {
  gameData: {
    gameId: string;
    theme: string;
  };
  results: Poem[];
  winner?: {
    userId: string;
    profile?: {
      nickname: string;
    };
  };
  onPlayAgain?: () => void;
  onGoHome?: () => void;
}

export default function GameResult({ 
  gameData, 
  results, 
  winner, 
  onPlayAgain, 
  onGoHome 
}: GameResultProps) {
  const { data: session } = useSession();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const isWinner = winner?.userId === session?.user?.id;
  const sortedResults = [...results].sort((a, b) => b.votes - a.votes);

  useEffect(() => {
    // 결과 발표 시 승리 애니메이션
    if (isWinner) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [isWinner]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* 결과 헤더 */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">
          {isWinner ? '🏆' : winner ? '👏' : '🤝'}
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {isWinner ? '축하합니다! 승리!' : winner ? '아쉽게 패배...' : '무승부!'}
        </h2>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-lg font-bold text-yellow-600">주제: {gameData.theme}</p>
        </div>
      </div>

      {/* 승자 정보 */}
      {winner && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-6 text-center">
          <div className="text-2xl mb-2">👑</div>
          <h3 className="text-xl font-bold text-purple-800 mb-2">
            {winner.profile?.nickname || '익명의 시인'}님 승리!
          </h3>
          <div className="flex justify-center items-center space-x-4 text-sm text-purple-600">
            <span>최다 득표: {sortedResults[0]?.votes || 0}표</span>
            <span>•</span>
            <span>승리 작품</span>
          </div>
        </div>
      )}

      {/* 작품 순위 */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-center">📋 작품 순위</h3>
        {sortedResults.map((poem, index) => (
          <div
            key={poem._id}
            className={`border-2 rounded-xl p-6 ${
              index === 0 && poem.votes > 0
                ? 'border-yellow-400 bg-yellow-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-400 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold">
                    {poem.author?.profile?.nickname || '익명의 시인'}
                    {poem.userId === session?.user?.id && ' (나)'}
                  </p>
                  <p className="text-sm text-gray-600">{poem.votes}표 획득</p>
                </div>
              </div>
              {index === 0 && poem.votes > 0 && (
                <div className="text-yellow-500 text-2xl">🏆</div>
              )}
            </div>
            
            <div className="space-y-2 text-center bg-white rounded-lg p-4">
              {poem.content.line1 && (
                <p className="text-lg leading-relaxed">{poem.content.line1}</p>
              )}
              {poem.content.line2 && (
                <p className="text-lg leading-relaxed">{poem.content.line2}</p>
              )}
              {poem.content.line3 && (
                <p className="text-lg leading-relaxed">{poem.content.line3}</p>
              )}
              
              {!poem.content.line1 && !poem.content.line2 && !poem.content.line3 && (
                <div className="text-gray-400 italic">작품이 제출되지 않았습니다</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 경험치 및 랭킹 변화 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
        <h4 className="font-semibold mb-2">🎁 보상</h4>
        <div className="space-y-1 text-sm text-blue-600">
          <p>+ {isWinner ? '50' : '10'} 경험치</p>
          {isWinner && <p>+ 1 승리</p>}
          <p>+ 1 게임 참여</p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={onPlayAgain}
          variant="primary"
          className="py-3"
        >
          다시 게임하기
        </Button>
        <Button
          onClick={onGoHome}
          variant="outline"
          className="py-3"
        >
          홈으로 가기
        </Button>
      </div>

      {/* 공유 기능 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 mb-2">이 게임이 재미있었다면?</p>
        <Button
          variant="ghost"
          className="text-sm"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: '세 줄 마음 - 3행시 게임',
                text: `"${gameData.theme}" 주제로 3행시 대결! 나도 도전해보기`,
                url: window.location.origin
              });
            } else {
              // 클립보드에 복사
              navigator.clipboard.writeText(`${window.location.origin} - 세 줄 마음 게임에서 "${gameData.theme}" 주제로 대결했어요!`);
              alert('링크가 클립보드에 복사되었습니다!');
            }
          }}
        >
          🔗 게임 공유하기
        </Button>
      </div>

      {/* 승리 애니메이션 */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl animate-bounce">🎉</div>
        </div>
      )}
    </div>
  );
}
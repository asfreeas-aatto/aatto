'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import Button from '@/components/ui/Button';

interface Poem {
  _id: string;
  content: {
    line1: string;
    line2: string;
    line3: string;
  };
  userId: string;
  votes: number;
}

interface VotingRoomProps {
  gameData: {
    gameId: string;
    theme: string;
  };
  poems: Poem[];
}

export default function VotingRoom({ gameData, poems }: VotingRoomProps) {
  const { vote } = useSocket();
  const [selectedPoem, setSelectedPoem] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30초 투표 시간

  // 투표 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVote = (poemId: string) => {
    if (!hasVoted) {
      // Socket 연결이 있으면 실제 투표, 없으면 로컬에서만 처리
      if (vote) {
        vote(poemId);
      } else {
        console.log('🗳️ 투표 (임시):', poemId);
      }
      setSelectedPoem(poemId);
      setHasVoted(true);
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds}초`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* 투표 헤더 */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🗳️</div>
        <h2 className="text-2xl font-bold mb-2">투표 시간</h2>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-lg font-bold text-blue-600 mb-1">주제: {gameData.theme}</p>
          <p className="text-2xl font-bold text-red-600">{formatTime(timeLeft)}</p>
        </div>
      </div>

      {/* 작품 목록 */}
      <div className="space-y-6 mb-6">
        {poems.map((poem, index) => (
          <div
            key={poem._id}
            className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedPoem === poem._id
                ? 'border-purple-500 bg-purple-50'
                : hasVoted
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
            }`}
            onClick={() => !hasVoted && handleVote(poem._id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">작품 {index + 1}</h3>
              {selectedPoem === poem._id && (
                <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                  ✅ 선택됨
                </div>
              )}
            </div>
            
            <div className="space-y-2 text-center">
              {poem.content.line1 && (
                <p className="text-lg leading-relaxed">{poem.content.line1}</p>
              )}
              {poem.content.line2 && (
                <p className="text-lg leading-relaxed">{poem.content.line2}</p>
              )}
              {poem.content.line3 && (
                <p className="text-lg leading-relaxed">{poem.content.line3}</p>
              )}
            </div>

            {!poem.content.line1 && !poem.content.line2 && !poem.content.line3 && (
              <div className="text-center text-gray-400 italic">
                작품이 제출되지 않았습니다
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 투표 상태 */}
      <div className="text-center">
        {!hasVoted && timeLeft > 0 && (
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">
              ✨ 더 마음에 드는 작품을 선택해주세요
            </p>
            <p className="text-xs text-gray-500">
              투표는 익명으로 진행되며 결과는 공개됩니다
            </p>
          </div>
        )}

        {hasVoted && (
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-green-600 font-semibold mb-2">✅ 투표 완료!</div>
            <p className="text-sm text-gray-600">
              다른 참여자들의 투표를 기다리고 있습니다...
            </p>
          </div>
        )}

        {timeLeft === 0 && !hasVoted && (
          <div className="bg-red-50 rounded-xl p-4">
            <div className="text-red-600 font-semibold mb-2">⏰ 투표 시간 종료</div>
            <p className="text-sm text-gray-600">곧 결과가 발표됩니다</p>
          </div>
        )}
      </div>

      {/* 투표 현황 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold mb-2">투표 현황 (개발 모드)</h4>
          <div className="space-y-1 text-sm">
            {poems.map((poem, index) => (
              <div key={poem._id} className="flex justify-between">
                <span>작품 {index + 1}</span>
                <span>{poem.votes || 0}표</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
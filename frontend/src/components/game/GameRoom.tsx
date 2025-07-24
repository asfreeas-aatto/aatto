'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import Button from '@/components/ui/Button';

interface GameRoomProps {
  gameData: {
    gameId: string;
    theme: string;
    timeLimit: number;
    opponent: any;
  };
}

export default function GameRoom({ gameData }: GameRoomProps) {
  const { gameStatus, submitPoem } = useSocket();
  const [timeLeft, setTimeLeft] = useState(gameData.timeLimit);
  const [localGameStatus, setLocalGameStatus] = useState<'waiting' | 'active' | 'voting' | 'finished'>('waiting');
  const [poem, setPoem] = useState({
    line1: '',
    line2: '',
    line3: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Socket 연결이 안 될 때 임시로 게임 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalGameStatus('active');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const currentStatus = gameStatus || localGameStatus;

  // 타이머
  useEffect(() => {
    if (currentStatus !== 'active') return;

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
  }, [currentStatus, isSubmitted, poem]);

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

  const handleSubmitPoem = () => {
    if (poem.line1.trim() || poem.line2.trim() || poem.line3.trim()) {
      // Socket 연결이 있으면 실제 제출, 없으면 로컬에서만 처리
      if (submitPoem) {
        submitPoem(poem);
      } else {
        console.log('📝 시 제출 (임시):', poem);
      }
      setIsSubmitted(true);
    }
  };

  const isPoemComplete = poem.line1.trim() && poem.line2.trim() && poem.line3.trim();

  if (currentStatus === 'waiting') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold mb-4">게임 준비 중...</h2>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">주제: <span className="font-bold text-purple-600">{gameData.theme}</span></p>
          <p className="text-sm text-gray-600 mt-1">제한시간: {gameData.timeLimit}초</p>
        </div>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">곧 게임이 시작됩니다...</span>
        </div>
      </div>
    );
  }

  if (currentStatus === 'active') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* 게임 헤더 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✍️</div>
          <h2 className="text-2xl font-bold mb-2">3행시 창작 시간</h2>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-lg font-bold text-purple-600 mb-1">주제: {gameData.theme}</p>
            <p className="text-3xl font-bold text-red-600">{formatTime(timeLeft)}</p>
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
          {!isSubmitted ? (
            <>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-600">
                  완성도: {isPoemComplete ? '✅ 완성' : '⏳ 작성 중...'}
                </div>
              </div>
              
              <Button
                onClick={handleSubmitPoem}
                disabled={!poem.line1.trim() && !poem.line2.trim() && !poem.line3.trim()}
                className="w-full py-3"
              >
                {isPoemComplete ? '완성된 시 제출하기' : '미완성이어도 제출하기'}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                💡 시간이 다 되면 자동으로 제출됩니다
              </p>
            </>
          ) : (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-green-600 font-semibold mb-2">✅ 시 제출 완료!</div>
              <p className="text-sm text-gray-600">상대방 완성을 기다리고 있습니다...</p>
            </div>
          )}
        </div>

        {/* 제출된 시 미리보기 */}
        {isSubmitted && (
          <div className="mt-6 bg-purple-50 rounded-xl p-4">
            <h3 className="font-semibold text-center mb-3">제출한 작품</h3>
            <div className="space-y-2 text-center">
              {poem.line1 && <p className="text-lg">{poem.line1}</p>}
              {poem.line2 && <p className="text-lg">{poem.line2}</p>}
              {poem.line3 && <p className="text-lg">{poem.line3}</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentStatus === 'voting') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🗳️</div>
        <h2 className="text-2xl font-bold mb-4">투표 시간</h2>
        <p className="text-gray-600 mb-6">두 작품 중 더 마음에 드는 작품에 투표해주세요!</p>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">투표는 익명으로 진행되며</p>
          <p className="text-sm text-gray-600">30초 후 결과가 발표됩니다.</p>
        </div>
      </div>
    );
  }

  if (currentStatus === 'finished') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold mb-4">게임 종료</h2>
        <p className="text-gray-600 mb-6">결과가 발표되었습니다!</p>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">곧 메인 화면으로 돌아갑니다...</p>
        </div>
      </div>
    );
  }

  return null;
}
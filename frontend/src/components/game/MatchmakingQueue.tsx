'use client';

import { useSocket } from '@/hooks/useSocket';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';

interface MatchmakingQueueProps {
  onMatchFound?: (gameData: any) => void;
}

export default function MatchmakingQueue({ onMatchFound }: MatchmakingQueueProps) {
  const { 
    isConnected, 
    queueStatus, 
    isInQueue, 
    currentGame, 
    gameStatus,
    joinQueue, 
    leaveQueue,
    refreshQueueStatus 
  } = useSocket();

  const [waitTime, setWaitTime] = useState(0);

  // 대기 시간 카운터
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isInQueue) {
      interval = setInterval(() => {
        setWaitTime(prev => prev + 1);
      }, 1000);
    } else {
      setWaitTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInQueue]);

  // 매칭 성공 시 콜백 호출
  useEffect(() => {
    if (currentGame && onMatchFound) {
      onMatchFound(currentGame);
    }
  }, [currentGame, onMatchFound]);

  // 큐 상태 주기적 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      refreshQueueStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshQueueStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">🔄</div>
        <h2 className="text-xl font-bold mb-2">서버 연결 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
        <div className="mt-4 text-xs text-gray-400">
          <p>Socket 연결 상태: {isConnected ? '연결됨' : '연결 중'}</p>
          <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
          <p>환경변수 확인: {JSON.stringify({ 
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            NODE_ENV: process.env.NODE_ENV 
          })}</p>
          <p>디버그: useSocket 호출됨</p>
        </div>
      </div>
    );
  }

  if (currentGame) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold mb-4 text-green-600">매칭 성공!</h2>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-2">게임 정보</h3>
          <p className="text-sm text-gray-600 mb-1">주제: <span className="font-bold text-purple-600">{currentGame.theme}</span></p>
          <p className="text-sm text-gray-600">제한시간: {currentGame.timeLimit}초</p>
        </div>
        
        {gameStatus === 'waiting' && (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">게임 시작 준비 중...</span>
          </div>
        )}
        
        {gameStatus === 'active' && (
          <div className="text-green-600 font-semibold">
            🚀 게임이 시작되었습니다!
          </div>
        )}
        
        {gameStatus === 'voting' && (
          <div className="text-blue-600 font-semibold">
            🗳️ 투표 시간입니다!
          </div>
        )}
      </div>
    );
  }

  if (isInQueue) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold mb-4">매칭 중...</h2>
        
        <div className="bg-purple-50 rounded-xl p-4 mb-6">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {formatTime(waitTime)}
          </div>
          <p className="text-sm text-gray-600">대기 시간</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full"></div>
            <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
            <div className="animate-pulse w-3 h-3 bg-purple-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-sm text-gray-600">상대방을 찾고 있습니다...</p>
        </div>

        <Button 
          onClick={leaveQueue}
          variant="outline"
          className="w-full"
        >
          매칭 취소
        </Button>

        {waitTime > 30 && (
          <p className="text-xs text-orange-600 mt-4">
            💡 30초 이상 대기 시 다른 랭크와도 매칭됩니다
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="text-6xl mb-4">⚔️</div>
      <h2 className="text-2xl font-bold mb-4">랭크 배틀</h2>
      <p className="text-gray-600 mb-6">실력이 비슷한 상대와 1vs1 3행시 대전을 펼쳐보세요!</p>

      {/* 현재 대기 인원 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-3">현재 대기 중인 플레이어</h3>
        <div className="text-2xl font-bold text-purple-600 mb-2">
          {queueStatus.total}명
        </div>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {Object.entries(queueStatus.byRank).map(([rank, count]) => (
            <div key={rank} className="text-center">
              <div className="font-semibold capitalize">{rank}</div>
              <div className="text-gray-600">{count}</div>
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={() => {
          console.log('🎯 매칭 시작 버튼 클릭됨');
          joinQueue('rank');
        }}
        className="w-full py-4 text-lg"
        disabled={!isConnected}
      >
        매칭 시작
      </Button>

      <p className="text-xs text-gray-500 mt-4">
        ⚡ 평균 매칭 시간: 30초 이내
      </p>
    </div>
  );
}
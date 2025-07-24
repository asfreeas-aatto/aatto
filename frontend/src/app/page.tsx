'use client';

import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import MatchmakingQueue from '@/components/game/MatchmakingQueue';
import GameRoom from '@/components/game/GameRoom';
import AIGameRoom from '@/components/game/AIGameRoom';
import VotingRoom from '@/components/game/VotingRoom';
import AIVotingRoom from '@/components/game/AIVotingRoom';
import GameResult from '@/components/game/GameResult';
import UserMenu from '@/components/ui/UserMenu';
import { useSocket } from '@/hooks/useSocket';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { currentGame, gameStatus } = useSocket();
  const [gameData, setGameData] = useState<unknown>(null);
  const [poems, setPoems] = useState<unknown[]>([]);
  const [results, setResults] = useState<unknown[]>([]);
  const [winner, setWinner] = useState<unknown>(null);
  const [aiGamePhase, setAiGamePhase] = useState<'writing' | 'voting' | 'result' | null>(null);
  const [aiPoemData, setAiPoemData] = useState<{userPoem: unknown, aiPoem: unknown} | null>(null);

  const handleMatchFound = (data: unknown) => {
    setGameData(data);
  };

  const handlePlayAgain = () => {
    setGameData(null);
    setPoems([]);
    setResults([]);
    setWinner(null);
  };

  const handleGoHome = () => {
    setGameData(null);
    setPoems([]);
    setResults([]);
    setWinner(null);
    setAiGamePhase(null);
    setAiPoemData(null);
  };

  const handleAIGameComplete = (userPoem: unknown, aiPoem: unknown) => {
    setAiPoemData({ userPoem, aiPoem });
    setAiGamePhase('voting');
  };

  const handleAIVotingComplete = (winner: 'human' | 'ai', results: unknown) => {
    // AI 대전 결과 설정
    setResults([
      {
        _id: 'user_poem',
        userId: session?.user?.email || 'user',
        votes: winner === 'human' ? 1 : 0,
        author: { profile: { nickname: session?.user?.nickname || session?.user?.name || '나' } },
        content: aiPoemData?.userPoem || {}
      },
      {
        _id: 'ai_poem',
        userId: 'ai',
        votes: winner === 'ai' ? 1 : 0,
        author: { profile: { nickname: 'AI 시인' } },
        content: aiPoemData?.aiPoem || {}
      }
    ]);
    
    setWinner({
      userId: winner === 'human' ? (session?.user?.email || 'user') : 'ai',
      profile: { 
        nickname: winner === 'human' 
          ? (session?.user?.nickname || session?.user?.name || '나') 
          : 'AI 시인' 
      }
    });
    
    setAiGamePhase('result');
  };

  const isAIBattle = gameData?.opponent?.type === 'ai';

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="container mx-auto px-4 py-16 text-center text-white">
          {/* 헤더 */}
          <div className="mb-12">
            <div className="text-8xl mb-6">🌸</div>
            <h1 className="text-6xl font-bold mb-4">세 줄 마음</h1>
            <p className="text-xl opacity-90">한국형 3행시 창작과 실시간 대전 게임</p>
          </div>

          {/* 기능 소개 */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">실시간 대전</h3>
              <p className="opacity-80">1vs1 실시간 3행시 배틀</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-2">랭킹 시스템</h3>
              <p className="opacity-80">브론즈부터 다이아까지</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold mb-2">창작의 즐거움</h3>
              <p className="opacity-80">매일 새로운 주제로 도전</p>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <div className="space-y-4 max-w-md mx-auto">
            <Button 
              onClick={() => router.push('/auth/signin')}
              className="w-full py-4 text-lg bg-white text-purple-600 hover:bg-gray-100"
            >
              게임 시작하기
            </Button>
            <p className="text-sm opacity-75">
              카카오 또는 구글 계정으로 간편 로그인
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인된 사용자용 대시보드
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🌸</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">세 줄 마음</h1>
                <p className="text-gray-600">안녕하세요, {session.user.nickname}님!</p>
              </div>
            </div>
            <UserMenu user={session.user} />
          </div>
        </header>

        {/* 게임 상태에 따른 화면 렌더링 */}
        {!currentGame && !gameData && (
          <>
            {/* 게임 메뉴 */}
            <div className="grid md:grid-cols-2 gap-6">
              <MatchmakingQueue onMatchFound={handleMatchFound} />

              <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow cursor-pointer">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold mb-2">AI 대전</h2>
                <p className="text-gray-600 mb-6">창의적인 AI와 3행시 실력 대결!</p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    // AI 대전 시작
                    const themes = ['사랑해', '고마워', '벚꽃비', '별하늘', '친구야', '엄마야', '행복해', '꿈나무', '바다야', '하늘아'];
                    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
                    
                    setGameData({
                      gameId: 'ai-battle-' + Date.now(),
                      theme: randomTheme,
                      timeLimit: 180,
                      difficulty: 'medium',
                      opponent: { 
                        nickname: 'AI 시인',
                        type: 'ai'
                      }
                    });
                    setAiGamePhase('writing');
                  }}
                >
                  AI와 대결하기
                </Button>
              </div>
            </div>

            {/* 통계 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
              <h3 className="text-xl font-bold mb-4">내 기록</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-gray-500">총 게임</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">0</p>
                  <p className="text-sm text-gray-500">승리</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">0%</p>
                  <p className="text-sm text-gray-500">승률</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">0</p>
                  <p className="text-sm text-gray-500">연승</p>
                </div>
              </div>
            </div>
            
            {/* 임시 테스트 버튼들 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-6">
              <h3 className="text-lg font-bold mb-4 text-yellow-800">🧪 개발 테스트</h3>
              <div className="grid md:grid-cols-5 gap-3">
                <Button 
                  onClick={() => setGameData({
                    gameId: 'test-game-1',
                    theme: '사랑해',
                    timeLimit: 180,
                    opponent: { nickname: '테스트상대' }
                  })}
                  variant="outline"
                  className="text-xs"
                >
                  게임룸 테스트
                </Button>
                <Button 
                  onClick={() => {
                    setPoems([
                      {
                        _id: 'poem1',
                        userId: 'user1',
                        votes: 3,
                        author: { profile: { nickname: '나' } },
                        content: { line1: '사람은 혼자서는 살 수 없어', line2: '랑하는 마음이 있어야만', line3: '해피엔딩을 만들 수 있지' }
                      },
                      {
                        _id: 'poem2', 
                        userId: 'user2',
                        votes: 5,
                        author: { profile: { nickname: '테스트상대' } },
                        content: { line1: '사랑스러운 너의 미소', line2: '랑만적인 우리 시간', line3: '해맑은 웃음이 좋아' }
                      }
                    ]);
                    setGameData({
                      gameId: 'test-game-2',
                      theme: '사랑해',
                      timeLimit: 30,
                      opponent: { nickname: '테스트상대' }
                    });
                  }}
                  variant="outline" 
                  className="text-xs"
                >
                  투표룸 테스트
                </Button>
                <Button 
                  onClick={() => {
                    const testResults = [
                      {
                        _id: 'poem1',
                        userId: session?.user?.email || 'user1',
                        votes: 3,
                        author: { profile: { nickname: '나' } },
                        content: { line1: '사람은 혼자서는 살 수 없어', line2: '랑하는 마음이 있어야만', line3: '해피엔딩을 만들 수 있지' }
                      },
                      {
                        _id: 'poem2', 
                        userId: 'user2',
                        votes: 5,
                        author: { profile: { nickname: '테스트상대' } },
                        content: { line1: '사랑스러운 너의 미소', line2: '랑만적인 우리 시간', line3: '해맑은 웃음이 좋아' }
                      }
                    ];
                    setResults(testResults);
                    setWinner({ 
                      userId: 'user2', 
                      profile: { nickname: '테스트상대' } 
                    });
                    setGameData({
                      gameId: 'test-game-3',
                      theme: '사랑해',
                      timeLimit: 0,
                      opponent: { nickname: '테스트상대' }
                    });
                  }}
                  variant="outline"
                  className="text-xs"
                >
                  결과룸 테스트
                </Button>
                <Button 
                  onClick={() => {
                    setGameData(null);
                    setPoems([]);
                    setResults([]);
                    setWinner(null);
                  }}
                  variant="outline"
                  className="text-xs"
                >
                  초기화
                </Button>
                <Button 
                  onClick={async () => {
                    // NextAuth 세션 강제 업데이트
                    window.location.href = '/api/auth/signin';
                  }}
                  variant="outline"
                  className="text-xs bg-red-50"
                >
                  세션 새로고침
                </Button>
              </div>
            </div>
          </>
        )}

        {/* AI 대전 게임 진행 화면 */}
        {isAIBattle && aiGamePhase === 'writing' && (
          <AIGameRoom 
            gameData={gameData} 
            onComplete={handleAIGameComplete}
          />
        )}

        {/* AI 대전 투표 화면 */}
        {isAIBattle && aiGamePhase === 'voting' && aiPoemData && (
          <AIVotingRoom 
            gameData={gameData}
            humanPoem={{
              line1: aiPoemData.userPoem?.line1 || '',
              line2: aiPoemData.userPoem?.line2 || '',
              line3: aiPoemData.userPoem?.line3 || '',
              author: 'human',
              authorType: 'human'
            }}
            aiPoem={{
              line1: aiPoemData.aiPoem?.line1 || '',
              line2: aiPoemData.aiPoem?.line2 || '',
              line3: aiPoemData.aiPoem?.line3 || '',
              author: 'AI 시인',
              authorType: 'ai'
            }}
            onVotingComplete={handleAIVotingComplete}
          />
        )}

        {/* AI 대전 결과 화면 */}
        {isAIBattle && aiGamePhase === 'result' && (
          <GameResult 
            gameData={gameData}
            results={results}
            winner={winner}
            onPlayAgain={handlePlayAgain}
            onGoHome={handleGoHome}
          />
        )}

        {/* 일반 게임 진행 화면 */}
        {!isAIBattle && (currentGame || gameData) && gameStatus !== 'voting' && gameStatus !== 'finished' && poems.length === 0 && (
          <GameRoom gameData={currentGame || gameData} />
        )}

        {/* 일반 게임 투표 화면 */}
        {!isAIBattle && (gameStatus === 'voting' || (gameData && poems.length > 0)) && (
          <VotingRoom gameData={currentGame || gameData} poems={poems} />
        )}

        {/* 일반 게임 결과 화면 */}
        {!isAIBattle && (gameStatus === 'finished' || (gameData && results.length > 0)) && (
          <GameResult 
            gameData={currentGame || gameData}
            results={results}
            winner={winner}
            onPlayAgain={handlePlayAgain}
            onGoHome={handleGoHome}
          />
        )}
      </div>
    </div>
  );
}
'use client';

import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
    getSession().then((session) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  const handleSignIn = async (provider: 'kakao' | 'google') => {
    setIsLoading(true);
    try {
      const result = await signIn(provider, {
        callbackUrl: '/',
        redirect: true,
      });
      
      if (result?.error) {
        console.error('로그인 실패:', result.error);
      }
    } catch (error) {
      console.error('로그인 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">세 줄 마음</h1>
          <p className="text-gray-600">한국형 3행시 창작 게임</p>
        </div>

        {/* 로그인 버튼들 */}
        <div className="space-y-4">
          {/* 카카오 로그인 */}
          <button
            onClick={() => handleSignIn('kakao')}
            disabled={isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-colors disabled:opacity-50"
          >
            <div className="w-5 h-5 bg-gray-800 rounded-full"></div>
            <span>카카오로 시작하기</span>
          </button>

          {/* 구글 로그인 */}
          <button
            onClick={() => handleSignIn('google')}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 flex items-center justify-center space-x-3 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google로 시작하기</span>
          </button>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <span className="text-gray-600">로그인 중...</span>
            </div>
          </div>
        )}

        {/* 하단 텍스트 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>로그인하면 게임 기록이 저장되고</p>
          <p>랭킹에 참여할 수 있어요!</p>
        </div>
      </div>
    </div>
  );
}
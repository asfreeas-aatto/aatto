'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorType = searchParams.get('error');
    setError(errorType);
    
    // 에러 로깅
    console.error('NextAuth Error:', {
      error: errorType,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/auth/signin');
  };

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'OAuthCallback':
        return {
          title: 'OAuth 콜백 에러',
          description: 'Google 로그인 과정에서 문제가 발생했습니다. 환경설정을 확인해주세요.',
          suggestion: 'Google Cloud Console의 OAuth 설정을 다시 확인해보세요.'
        };
      case 'OAuthSignin':
        return {
          title: 'OAuth 로그인 에러',
          description: '로그인 요청 처리 중 문제가 발생했습니다.',
          suggestion: '잠시 후 다시 시도해주세요.'
        };
      case 'OAuthCreateAccount':
        return {
          title: '계정 생성 에러',
          description: '새 계정 생성 중 문제가 발생했습니다.',
          suggestion: '이미 가입된 계정일 수 있습니다.'
        };
      default:
        return {
          title: '인증 에러',
          description: '로그인 과정에서 알 수 없는 오류가 발생했습니다.',
          suggestion: '잠시 후 다시 시도해주세요.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* 에러 아이콘 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{errorInfo.title}</h1>
          <p className="text-gray-600">{errorInfo.description}</p>
        </div>

        {/* 에러 상세 정보 */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">에러 코드</h3>
          <code className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
            {error || 'Unknown'}
          </code>
          <p className="text-sm text-gray-600 mt-2">{errorInfo.suggestion}</p>
        </div>

        {/* 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            다시 로그인하기
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>

        {/* 디버그 정보 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">디버그 정보</h4>
            <pre className="text-xs text-yellow-700 overflow-x-auto">
              {JSON.stringify({
                error,
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
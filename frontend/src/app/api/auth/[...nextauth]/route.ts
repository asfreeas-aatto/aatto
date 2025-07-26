import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    }),
  ],
  debug: true,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 로그인 성공 후 메인 페이지로 리디렉션
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, account, profile }) {
      // 첫 로그인 시 사용자 정보 저장
      if (account && profile) {
        console.log('🔄 JWT callback - account:', account.provider);
        console.log('🔄 JWT callback - profile:', profile);
        
        token.provider = account.provider;
        token.id = profile.sub || profile.id;
        
        // 항상 기본 사용자 정보를 설정 (백엔드 연결 실패해도 게임 진행 가능)
        token.userId = token.id || profile?.sub || profile?.id || token.email;
        token.nickname = token.name || '임시 사용자';
        token.level = 1;
        token.rank = 'bronze';
        
        console.log('✅ JWT token set:', { 
          userId: token.userId, 
          nickname: token.nickname,
          email: token.email 
        });
        
        // 백엔드에 사용자 정보 전송 시도 (실패해도 게임 진행)
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (apiUrl && apiUrl !== 'http://localhost:3001') {
            const response = await fetch(`${apiUrl}/api/auth/login`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: token.userId,
                email: token.email,
                name: token.name,
                image: token.picture,
                provider: account.provider,
              }),
            });
            
            if (response.ok) {
              const userData = await response.json();
              token.userId = userData._id;
              token.nickname = userData.profile.nickname;
              token.level = userData.profile.level;
              token.rank = userData.profile.rank;
              console.log('✅ Backend sync successful:', userData);
            }
          }
        } catch (error) {
          console.log('⚠️ Backend not available, using local user data');
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // 세션에 추가 정보 포함
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
          provider: token.provider as string,
          nickname: token.nickname as string,
          level: token.level as number,
          rank: token.rank as string,
        },
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
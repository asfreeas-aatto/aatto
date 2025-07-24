import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      provider: string;
      nickname: string;
      level: number;
      rank: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    provider?: string;
    nickname?: string;
    level?: number;
    rank?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    provider?: string;
    nickname?: string;
    level?: number;
    rank?: string;
  }
}
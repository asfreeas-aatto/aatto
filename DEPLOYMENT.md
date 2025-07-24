# 🚀 배포 가이드: 세 줄 마음 (Three-Line Heart)

## 📋 배포 전 체크리스트

### 🔒 보안 설정
- [ ] 실제 시크릿 키 생성 (NEXTAUTH_SECRET)
- [ ] MongoDB 프로덕션 데이터베이스 설정
- [ ] OAuth 앱 프로덕션 도메인 등록
- [ ] Google AI Studio API 할당량 확인
- [ ] 민감한 정보 .env.example로 마스킹

### 🛠️ 기술 스택 최종 확인
```
Frontend: Next.js 15 + TypeScript + Tailwind CSS
Backend: Node.js + Express + Socket.io + TypeScript
Database: MongoDB Atlas
Auth: NextAuth.js (Google + Kakao OAuth)
AI: Google AI Studio API
Deployment: Vercel (Frontend) + Railway (Backend)
```

## 🎯 권장 배포 전략

### 1️⃣ **Vercel (Frontend) - 추천 ⭐**
```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 루트에서 배포
cd frontend
vercel

# 3. 환경변수 설정 (Vercel Dashboard)
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-app.vercel.app
KAKAO_CLIENT_ID=your-kakao-id
KAKAO_CLIENT_SECRET=your-kakao-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
MONGODB_URI=your-production-mongodb-uri
```

**장점:**
- ✅ 자동 CI/CD, CDN 최적화
- ✅ 무료 플랜으로도 충분한 성능
- ✅ Next.js 최적화 자동 적용
- ✅ 커스텀 도메인 쉬운 연결

### 2️⃣ **Railway (Backend) - 추천 ⭐**
```bash
# 1. Railway CLI 설치
npm i -g @railway/cli

# 2. 프로젝트 배포
cd backend
railway login
railway init
railway up

# 3. 환경변수 설정 (Railway Dashboard)
PORT=3001
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
FRONTEND_URL=https://your-app.vercel.app
GOOGLE_AI_API_KEY=your-google-ai-key
```

**장점:**
- ✅ Node.js 최적화, 자동 스케일링
- ✅ MongoDB Atlas 연동 쉬움
- ✅ Socket.io WebSocket 완전 지원
- ✅ 무료 플랜 500시간/월

## 🔄 대안 배포 방법

### 🐳 **도커 셀프호스팅**
```bash
# Backend
cd backend
docker build -t three-line-heart-backend .
docker run -p 3001:3001 --env-file .env three-line-heart-backend

# Frontend (Optional - Vercel 대신)
cd frontend
docker build -t three-line-heart-frontend .
docker run -p 3000:3000 --env-file .env.local three-line-heart-frontend
```

### ☁️ **대안 플랫폼**
| 플랫폼 | Frontend | Backend | 특징 |
|--------|----------|---------|------|
| **Vercel + Railway** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 추천, 무료/성능 밸런스 |
| **Netlify + Render** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 안정적, 약간 비쌈 |
| **AWS Amplify + EC2** | ⭐⭐⭐ | ⭐⭐⭐ | 확장성 좋음, 복잡함 |
| **Firebase Hosting + Cloud Run** | ⭐⭐⭐ | ⭐⭐⭐ | Google 생태계 |

## 🗄️ 데이터베이스 설정

### MongoDB Atlas (추천)
1. **클러스터 생성**: M0 (무료) → M2/M5 (프로덕션)
2. **IP 화이트리스트**: `0.0.0.0/0` (모든 IP 허용)
3. **연결 문자열**: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
4. **백업 설정**: 자동 백업 활성화

## 🔐 보안 체크포인트

### OAuth 앱 설정
```bash
# Google Console
Authorized redirect URIs: 
- https://your-app.vercel.app/api/auth/callback/google
- http://localhost:3000/api/auth/callback/google (개발용)

# Kakao Developers
Redirect URI:
- https://your-app.vercel.app/api/auth/callback/kakao
- http://localhost:3000/api/auth/callback/kakao (개발용)
```

### 환경변수 보안
```bash
# 강력한 시크릿 생성
openssl rand -base64 32

# 또는 Node.js에서
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📊 모니터링 및 최적화

### 성능 모니터링
- **Vercel Analytics**: 프론트엔드 성능 추적
- **Railway Metrics**: 백엔드 리소스 사용량
- **MongoDB Atlas Monitoring**: 데이터베이스 성능

### 비용 최적화
```
예상 월 비용:
- Vercel Pro: $20 (트래픽에 따라)
- Railway: $5-20 (사용량에 따라)  
- MongoDB Atlas: $0 (M0) ~ $57 (M2)
총 예상: $0-97/월 (초기엔 무료로 시작 가능)
```

## 🚨 배포 후 필수 작업

1. **도메인 설정**: 커스텀 도메인 연결
2. **HTTPS 강제**: HTTP → HTTPS 리다이렉트
3. **모니터링 설정**: 에러 추적, 성능 알림
4. **백업 확인**: 데이터베이스 정기 백업
5. **보안 테스트**: 펜테스트, 취약점 스캔

## 🔄 CI/CD 파이프라인

### GitHub Actions (선택사항)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v20
```

## ⚡ 성능 최적화

### 추천 설정
- **CDN**: Vercel Edge Network 활용
- **이미지 최적화**: Next.js Image 컴포넌트
- **Bundle 분석**: `npx @next/bundle-analyzer`
- **Core Web Vitals**: Lighthouse 점수 90+ 목표

## 🎉 배포 완료 후

배포가 완료되면 다음 기능들이 프로덕션에서 작동합니다:
- ✅ 카카오/구글 소셜 로그인
- ✅ AI와 3행시 실시간 대결
- ✅ 자동 스케일링 및 글로벌 CDN
- ✅ HTTPS 보안 연결
- ✅ 모바일 반응형 UI

---
**배포 관련 문제가 있으면 각 플랫폼의 로그를 확인하세요:**
- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app/dashboard  
- MongoDB: https://cloud.mongodb.com
# 🌸 세 줄 마음 (Three-Line Heart)

한국형 3행시 창작과 실시간 대전 게임

## 🎮 게임 소개

**세 줄 마음**은 한국어 3행시(삼행시)를 주제로 한 실시간 창작 대전 게임입니다.
AI와 대결하며 창의적인 3행시를 작성하고, 투표를 통해 승부를 결정합니다.

### ✨ 주요 기능

- 🤖 **AI 대전**: Google AI Studio를 활용한 창의적 AI와 3행시 대결
- ⚡ **실시간 게임**: Socket.io 기반 실시간 상호작용
- 🎯 **3글자 주제**: 각 글자로 시작하는 진짜 3행시 게임
- 🏆 **투표 시스템**: 사용자가 직접 선택하는 공정한 승부
- 📱 **반응형 UI**: 모바일/데스크톱 완벽 지원

## 🛠️ 기술 스택

### Frontend
- **Next.js 15** + TypeScript
- **Tailwind CSS** - 스타일링
- **NextAuth.js** - OAuth 인증 (Google/Kakao)
- **Socket.io Client** - 실시간 통신

### Backend  
- **Node.js** + Express + TypeScript
- **Socket.io** - 실시간 WebSocket 통신
- **MongoDB Atlas** - 데이터베이스
- **Google AI Studio API** - AI 시 생성

### Infrastructure
- **Vercel** - 프론트엔드 배포
- **Railway** - 백엔드 배포  
- **GitHub Actions** - CI/CD 자동화

## 🚀 배포 URL

- **게임 플레이**: https://frontend-5xrguoho1-asfreeas-aattos-projects.vercel.app
- **API 서버**: https://your-backend.railway.app (배포 후 업데이트)

## 🎯 게임 플레이 방법

1. **로그인**: Google 또는 Kakao 계정으로 간편 로그인
2. **AI 대전 시작**: "AI와 대결하기" 버튼 클릭
3. **주제 확인**: 랜덤으로 선택된 3글자 주제 확인
4. **3행시 작성**: 각 글자로 시작하는 3줄 시 작성 (3분 제한)
5. **AI와 비교**: AI가 생성한 작품과 나의 작품 비교
6. **투표**: 더 마음에 드는 작품 선택
7. **결과 확인**: 승부 결과 및 작품 감상

## 📝 개발 가이드

### 로컬 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/asfreeas-aatto/aatto.git
cd aatto

# 의존성 설치
cd frontend && npm install
cd ../backend && npm install

# 환경변수 설정
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# 개발 서버 실행
cd backend && npm run dev    # 백엔드 (포트 3001)
cd frontend && npm run dev   # 프론트엔드 (포트 3000)
```

### 환경변수 설정

필수 환경변수들을 `.env` 파일에 설정해주세요:

```bash
# OAuth 설정
GOOGLE_CLIENT_ID=your-google-client-id
KAKAO_CLIENT_ID=your-kakao-client-id

# AI API
GOOGLE_AI_API_KEY=your-google-ai-api-key

# 데이터베이스
MONGODB_URI=your-mongodb-connection-string
```

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 오픈

## 📜 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**개발자**: asfreeas  
**연락처**: chaewondeok@gmail.com  
**프로젝트 시작일**: 2025년 1월
# 세 줄 마음 (Three-Line Heart) - 게임형 PRD
## Claude Code 개발 최적화 문서

---

## 🎯 프로젝트 개요

### 제품명
**세 줄 마음** (Three-Line Heart)

### 핵심 컨셉
**한국형 3행시 창작 + 실시간 대전 게임**
- 장르: 창작 게임 + 소셜 배틀
- 플랫폼: 웹 앱 (모바일 최적화)
- 타겟: 20-40대 창작 욕구가 있는 한국 사용자

---

## 🏗️ 기술 스택 (Claude Code 최적화)

```
Frontend: Next.js 14 + TypeScript + Tailwind CSS
Backend: Node.js + Express + Socket.io
Database: MongoDB + Redis (세션 관리)
Authentication: NextAuth.js (Kakao, Google)
Deployment: Vercel (Frontend) + Railway (Backend)
```

---

## 🎮 게임 시스템 설계

### 1. 핵심 게임 루프
```
1. 로그인 → 2. 대기실 → 3. 매칭 → 4. 게임 시작 → 5. 창작 시간 → 6. 투표 → 7. 결과 → 8. 경험치/랭킹
```

### 2. 게임 모드

#### A. 랭크 배틀 (1v1)
- **매칭 시간**: 최대 30초
- **창작 시간**: 3분
- **투표**: 익명 유저 5명 (30초)
- **승리 조건**: 과반수 득표
- **랭킹 시스템**: 브론즈 → 실버 → 골드 → 플래티넘 → 다이아

#### B. 친구 배틀
- **방 코드 공유** 시스템
- **커스텀 주제** 설정 가능
- **관전 모드** 지원

#### C. 토너먼트 (주간 이벤트)
- **32강 → 16강 → 8강 → 결승**
- **우승자**: 특별 칭호 + 프로필 배지

---

## 📊 데이터베이스 스키마

### User Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  provider: "kakao" | "google",
  profile: {
    avatar: String,
    nickname: String,
    bio: String,
    level: Number,
    exp: Number,
    rank: "bronze" | "silver" | "gold" | "platinum" | "diamond"
  },
  stats: {
    totalGames: Number,
    wins: Number,
    winRate: Number,
    bestStreak: Number,
    totalPoems: Number
  },
  createdAt: Date,
  lastLogin: Date
}
```

### Poem Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  gameId: ObjectId,
  content: {
    line1: String,
    line2: String,
    line3: String
  },
  theme: String,
  votes: Number,
  tags: [String],
  isPublic: Boolean,
  createdAt: Date
}
```

### Game Collection
```javascript
{
  _id: ObjectId,
  mode: "rank" | "friend" | "tournament",
  players: [ObjectId],
  theme: String,
  status: "waiting" | "active" | "voting" | "finished",
  poems: [ObjectId],
  votes: [{
    voterId: String, // anonymous
    poemId: ObjectId
  }],
  winner: ObjectId,
  startTime: Date,
  endTime: Date
}
```

---

## 🎨 UI/UX 요구사항

### 디자인 시스템
```css
/* 색상 팔레트 */
--primary: #6B73FF;     /* 메인 블루 */
--secondary: #9B59B6;   /* 보조 퍼플 */
--accent: #FF6B9D;      /* 포인트 핑크 */
--bg-primary: #F8F9FA;  /* 배경 */
--text-primary: #2D3436; /* 메인 텍스트 */

/* 타이포그래피 */
--font-korean: 'Noto Sans KR', sans-serif;
--font-handwrite: 'Cute Font', cursive;
```

### 반응형 브레이크포인트
- Mobile: 320px - 768px
- Tablet: 769px - 1024px
- Desktop: 1025px+

### 애니메이션 요구사항
- **로딩**: 종이학 날아가는 애니메이션 (Lottie)
- **텍스트**: 타이핑 효과 (Typewriter.js)
- **투표**: 하트 파티클 효과
- **승리**: 벚꽃 흩날리는 효과

---

## ⚡ 실시간 기능 명세 (Socket.io)

### 이벤트 리스트
```javascript
// Client → Server
'join-queue': { mode, userId }
'leave-queue': { userId }
'submit-poem': { gameId, poem }
'vote': { gameId, poemId, voterId }

// Server → Client
'match-found': { gameId, opponent, theme }
'game-start': { gameId, theme, timeLimit }
'poem-submitted': { playerId }
'voting-start': { poems }
'vote-counted': { poemId, votes }
'game-end': { winner, finalVotes }
'queue-status': { playersInQueue }
```

### 실시간 상태 관리
```javascript
// Redis 키 구조
queue:rank -> Set of userIds
game:{gameId}:status -> "waiting|active|voting|finished"
game:{gameId}:players -> Array of userIds
user:{userId}:status -> "online|offline|ingame"
```

---

## 🎲 게임 밸런싱

### 매칭 시스템
- **랭크 차이**: ±2 티어 내에서 매칭
- **대기 시간**: 30초 후 매칭 범위 확대
- **연승 보너스**: 5연승 시 더 높은 랭크와 매칭

### 경험치 시스템
```javascript
const EXP_TABLE = {
  win: 50,
  lose: 10,
  streak_bonus: 25, // 3연승부터
  first_win_daily: 100,
  tournament_participation: 200
};

const LEVEL_UP = {
  1: 100, 2: 250, 3: 450, 4: 700, 5: 1000
  // ... 최대 50레벨
};
```

### 주제 풀 관리
```javascript
const THEMES = {
  daily: ["첫눈", "지하철", "야근", "비오는 날"],
  seasonal: ["벚꽃", "여름밤", "단풍", "겨울바람"],
  emotion: ["그리움", "설렘", "아쉬움", "기쁨"],
  special: ["어머니", "친구", "꿈", "희망"]
};
```

---

## 🔧 API 엔드포인트 명세

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Game
```
GET  /api/games/queue-status
POST /api/games/join-queue
POST /api/games/leave-queue
GET  /api/games/:id
POST /api/games/:id/submit-poem
POST /api/games/:id/vote
```

### User & Stats
```
GET  /api/users/profile
PUT  /api/users/profile
GET  /api/users/stats
GET  /api/users/poems
GET  /api/leaderboard
```

### Admin
```
GET  /api/admin/games
POST /api/admin/themes
GET  /api/admin/reports
```

---

## 🚀 MVP 개발 우선순위

### Phase 1 (2주) - 핵심 게임
- [ ] 사용자 인증 (카카오 로그인)
- [ ] 1v1 랭크 배틀 시스템
- [ ] 실시간 매칭
- [ ] 기본 UI/UX

### Phase 2 (1주) - 게임 확장
- [ ] 투표 시스템
- [ ] 랭킹/레벨 시스템
- [ ] 개인 프로필 페이지

### Phase 3 (1주) - 소셜 기능
- [ ] 친구 배틀
- [ ] 시집 보기
- [ ] 리더보드

### Phase 4 (1주) - 폴리싱
- [ ] 애니메이션 효과
- [ ] 알림 시스템
- [ ] 성능 최적화

---

## 📝 개발 가이드라인

### 코드 스타일
- **TypeScript** 엄격 모드 사용
- **ESLint + Prettier** 설정
- **컴포넌트**: 함수형 + hooks 패턴
- **상태관리**: Zustand (가벼운 프로젝트)

### 폴더 구조
```
src/
├── components/          # 재사용 컴포넌트
│   ├── ui/             # 기본 UI 컴포넌트
│   ├── game/           # 게임 관련 컴포넌트
│   └── layout/         # 레이아웃 컴포넌트
├── pages/              # Next.js 페이지
├── hooks/              # 커스텀 훅
├── stores/             # Zustand 스토어
├── utils/              # 유틸리티 함수
├── types/              # TypeScript 타입
└── styles/             # 스타일 파일
```

### 성능 최적화
- **이미지**: Next.js Image 컴포넌트 사용
- **폰트**: 로컬 폰트 최적화
- **번들**: 동적 import로 코드 스플리팅
- **캐싱**: React Query로 API 캐싱

---

## 🔍 테스트 전략

### 단위 테스트
- **Jest + React Testing Library**
- 커버리지: 80% 이상
- 핵심 비즈니스 로직 우선

### 통합 테스트
- **Playwright** (E2E)
- 게임 플로우 전체 테스트
- 실시간 기능 테스트

### 성능 테스트
- **Lighthouse** CI
- **Socket.io** 부하 테스트
- 동시 접속자 100명 목표

---

## 📊 모니터링 & 분석

### 핵심 지표
- **DAU/MAU**: 일일/월간 활성 사용자
- **게임 완료율**: 시작 대비 완료 비율
- **평균 세션 시간**: 앱 사용 시간
- **재방문률**: 7일 내 재방문
- **랭킹 분포**: 티어별 사용자 분포

### 기술적 모니터링
- **Sentry**: 에러 트래킹
- **Vercel Analytics**: 성능 모니터링
- **Socket.io Admin UI**: 실시간 연결 상태

---

## 🎪 마케팅 연동 기능

### 바이럴 요소
- **시 공유하기**: 이미지로 변환 후 SNS 공유
- **친구 초대**: 초대 코드 시스템
- **일일 도전**: 매일 새로운 주제 제공

### 데이터 수집
```javascript
// 게임 이벤트 트래킹
analytics.track('game_started', {
  mode: 'rank',
  user_level: 5,
  theme: '첫눈'
});

analytics.track('poem_submitted', {
  user_id: 'xxx',
  game_id: 'xxx',
  submission_time: 180 // 초
});
```

---

## ✅ Definition of Done

### 기능 완성 기준
- [ ] 모든 API 엔드포인트 구현 및 테스트 완료
- [ ] 반응형 UI 구현 (모바일/데스크톱)
- [ ] 실시간 기능 안정성 확보
- [ ] 기본 게임 플로우 완전 동작
- [ ] 에러 핸들링 및 로딩 상태 처리
- [ ] 성능 최적화 (Lighthouse 90점 이상)

### 배포 준비
- [ ] 환경변수 설정 완료
- [ ] DB 스키마 최종 확정
- [ ] CI/CD 파이프라인 구축
- [ ] 도메인 연결 및 SSL 설정
- [ ] 모니터링 도구 연동

---

*Claude Code야, 한국인의 감성을 담은 게임을 만들어보자! 🌸*
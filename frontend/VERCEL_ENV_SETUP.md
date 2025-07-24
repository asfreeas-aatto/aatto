# Vercel 환경변수 설정 가이드

## 🔧 필수 환경변수

Vercel Dashboard → Settings → Environment Variables에서 다음 변수들을 설정하세요:

### NextAuth 설정
```
NEXTAUTH_SECRET = [새로운 강력한 시크릿 키]
NEXTAUTH_URL = https://your-app-name.vercel.app
```

### OAuth 공급자
```
KAKAO_CLIENT_ID = [현재 .env.local의 값]
KAKAO_CLIENT_SECRET = [현재 .env.local의 값]
GOOGLE_CLIENT_ID = [현재 .env.local의 값] 
GOOGLE_CLIENT_SECRET = [현재 .env.local의 값]
```

### API 연결
```
NEXT_PUBLIC_API_URL = https://your-backend.railway.app
```

### 데이터베이스
```
MONGODB_URI = [MongoDB Atlas 연결 문자열]
```

## 🔑 새로운 NEXTAUTH_SECRET 생성

터미널에서 실행:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📱 OAuth 리다이렉트 URL 업데이트

### Google Console
1. Google Cloud Console → APIs & Services → Credentials
2. OAuth 2.0 Client IDs에서 클라이언트 선택
3. Authorized redirect URIs에 추가:
   - `https://your-app-name.vercel.app/api/auth/callback/google`

### Kakao Developers
1. Kakao Developers Console → 내 애플리케이션
2. 제품 설정 → 카카오 로그인 → Redirect URI
3. URI 추가:
   - `https://your-app-name.vercel.app/api/auth/callback/kakao`

## ✅ 배포 완료 체크리스트

- [ ] 모든 환경변수 설정 완료
- [ ] OAuth 리다이렉트 URI 업데이트
- [ ] 사이트 접속 및 로그인 테스트
- [ ] AI 대전 기능 테스트
- [ ] 모바일 반응형 확인
# 카페 주문 취합 MVP

사내 카페 주문 취합 웹앱 MVP입니다. 사용자와 관리자가 한 앱에서 주문을 등록하고 취합 상태를 관리할 수 있습니다.

## 실행 방법

1. 프로젝트 디렉터리로 이동
   ```powershell
   cd c:\testCode\cafe
   ```
2. 의존성 설치
   ```powershell
   "C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
   ```
3. 개발 서버 실행
   ```powershell
   "C:\Program Files\nodejs\node.exe" "c:\testCode\cafe\node_modules\next\dist\bin\next" dev
   ```
4. 브라우저에서 `http://localhost:3000` 접속

## 주요 파일 구조

- `app/page.tsx` - 사용자/관리자 UI와 주문 로직
- `app/layout.tsx` - 페이지 레이아웃 및 메타데이터
- `app/globals.css` - Tailwind 기반 글로벌 스타일
- `lib/types.ts` - `OrderSheet`, `OrderItem` 등의 타입 정의
- `lib/localStorage.ts` - 로컬 스토리지 저장/불러오기, 네이버 주문 URL
- `tailwind.config.ts` - Tailwind 구성
- `package.json` - Next.js, React, TypeScript, Tailwind 의존성

## Supabase로 전환 시 변경 포인트

1. `lib/localStorage.ts`를 교체
   - 현재: 브라우저 `localStorage` 기반
   - 이후: Supabase 클라이언트로 `OrderSheet`와 `OrderItem` CRUD 구현

2. `app/page.tsx`에서 데이터 로딩/저장 처리 변경
   - 현재: `loadAppData()`, `saveAppData()` 사용
   - 이후: Supabase 쿼리 + 실시간 동기화/캐시 로직으로 변경

3. 인증 추가
   - 현재: 관리자 인증 없음
   - Supabase 단계에서는 관리자 기능에 인증 또는 역할 기반 접근 제어 추가

4. 앱 배포
   - 현재: 로컬 개발 환경
   - Supabase/Next.js 배포 환경으로 전환

## 릴리스

- **v0.1.0** - 2026-06-10
   - 초기 MVP 기능 배포
   - 기능: 관리자 메뉴 수동 등록 / 사용자 주문 입력 및 취합 / 로컬스토리지 영속화
   - 관리 기능: 메뉴 순번(정렬), 품절 처리, 주문서 생성·취합

### 원격 작업

- 이 저장소는 처음 커밋 후 `main` 브랜치로 원격(https://github.com/snenim-ai/cafeOrder.git)에 푸시되었습니다.

---

참고: GitHub Release(릴리스) 페이지에 정식 릴리스 노트를 올리려면 GitHub 토큰을 사용해 API로 릴리스를 생성할 수 있습니다. 원하시면 제가 진행해드릴게요.

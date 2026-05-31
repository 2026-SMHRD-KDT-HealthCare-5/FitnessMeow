# 🐱 피트니스냥 (FitnessMeow)

> **AI 기반 운동 가이드 및 운동습관 형성·동기부여 시스템**
> 웹캠으로 운동 자세를 실시간 인식하고, 운동을 할수록 내 고양이를 키우고 방을 꾸미는 헬스케어 게이미피케이션 서비스

운동이 지루해서 작심삼일로 끝나는 문제를, **고양이 육성 + 방 꾸미기**라는 보상 루프로 풀어낸 프로젝트입니다.
스쿼트·푸쉬업·런지를 웹캠 앞에서 수행하면 MediaPipe가 자세를 판정해 횟수를 세고, 그 보상으로 코인과 경험치를 얻어 고양이를 레벨업시키고 가구를 구매해 마이룸을 꾸밀 수 있습니다.

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🏋️ **AI 운동 인식** | 웹캠 + MediaPipe Pose로 관절을 추적해 스쿼트/푸쉬업/런지 횟수를 자동 카운트하고 자세 정확도(perfect/normal)를 판정 |
| 🔥 **운동 결과 & 보상** | 운동 횟수에 따라 칼로리·코인·경험치 지급, 운동 결과 페이지에서 통계 확인 |
| 🐈 **고양이 육성** | 운동으로 쌓은 경험치로 캐릭터 레벨업(LV.1~3), 레벨에 따라 외형 변화 및 신규 고양이 해금 |
| 🏠 **마이룸 꾸미기** | PixiJS 캔버스에서 가구를 드래그·배치, 벽지/타일 테마 변경 |
| 🛒 **상점 / 인벤토리** | 코인으로 가구·배경 구매, 소유 아이템 인벤토리 관리 |
| ✅ **일일 퀘스트** | 매일 0시 초기화되는 "오늘의 할일"(밥주기·빗질·화장실) 달성 시 코인 보상 |
| 📅 **출석 & 운동 달력** | 출석 스트릭, 월별 운동 기록 달력 |
| 📖 **도감** | 해금한 고양이 컬렉션 도감 |

---

## 🛠 기술 스택

**Frontend**
- React 19 + Vite
- React Router DOM 7
- PixiJS 7 (마이룸 2D 캔버스 렌더링)
- MediaPipe Pose (웹캠 자세 인식, CDN 로드)
- Axios

**Backend**
- Node.js + Express 5
- express-session (세션 기반 인증)
- bcryptjs (비밀번호 해싱)
- express-rate-limit
- MySQL (mysql2)

**Database**
- MySQL

**배포**
- Frontend → Vercel / Backend → Render / DB → Railway

---

## 📁 프로젝트 구조

```
FitnessMeow_Dev/
├── client/                     # 프론트엔드 (React + Vite)
│   ├── public/exercises/       # 운동별 자세 판정 로직 (squats / push_up / lunges)
│   └── src/
│       ├── pages/              # 화면 단위 컴포넌트
│       │   ├── Login / Register        # 로그인·회원가입
│       │   ├── MainLobby               # 메인 로비(마이룸·퀘스트)
│       │   ├── ExerciseSelect/Setting  # 운동 선택·설정
│       │   ├── Exercise                # AI 운동 인식 화면
│       │   ├── Result                  # 운동 결과·레벨업
│       │   ├── Shop                    # 상점
│       │   ├── Collection              # 도감
│       │   ├── Profile                 # 운동 기록
│       │   └── Info                    # 내 정보
│       ├── components/         # MyRoom(PixiJS), QuestPanel, Navbar 등
│       ├── assets/             # 고양이·가구·아이콘·사운드 리소스
│       └── css/
│
├── server/                     # 백엔드 (Express)
│   └── src/
│       ├── app.js              # 앱 설정·미들웨어·라우터 등록
│       ├── server.js           # 서버 진입점
│       ├── db.js               # MySQL 연결 풀
│       ├── routes/             # 도메인별 API 라우터
│       └── utils/              # dailyQuest, levelup 등 로직
│
├── FitnessMeow.sql             # DB 스키마 (테이블 생성 스크립트)
└── 배포방법.txt                # 배포 가이드
```

---

## 🗄 데이터베이스 테이블

| 테이블 | 설명 |
|--------|------|
| `users` | 회원 정보, 보유 코인 |
| `characters` | 고양이 캐릭터(레벨·부위별 경험치·캐릭터키) |
| `workout_records` | 운동 기록(종류·횟수·칼로리·정확도) |
| `quests` / `user_quests` | 일일 퀘스트 정의 / 유저별 진행 상태 |
| `care_logs` | 돌봄(퀘스트) 수행 로그 |
| `user_items` | 유저 소유 아이템(가구·배경) |
| `coordinates` | 마이룸 가구·고양이 배치 좌표 |
| `attendances` | 출석 기록 |
| `achievements` / `badges` | 업적 / 배지 |

---

## 🔌 API 개요

| 경로 | 설명 |
|------|------|
| `/api/auth` | 회원가입·로그인·로그아웃·내 정보 |
| `/api/workouts` | 운동 기록 저장 및 EXP·코인 처리 |
| `/api/character` | 캐릭터 조회·레벨업·해금 |
| `/api/result` | 운동 결과 화면용 최신 기록 조회 |
| `/api/coordinates` | 마이룸 가구·고양이 배치 좌표 저장·조회·삭제 |
| `/api/inventory` | 소유 아이템 + 배치 좌표 통합 조회 |
| `/api/shop` | 상점 아이템 목록·구매 |
| `/api/room` | 방 벽지·타일 테마 조회·변경 |
| `/api/calendar` | 월별 운동 달력 |
| `/api/attendance` | 출석 스트릭 조회 |

---

## 🚀 시작하기 (로컬 실행)

### 1. 요구 사항
- Node.js 18+
- MySQL 8+
- 웹캠 (운동 인식 기능 사용 시)

### 2. 저장소 클론
```bash
git clone <repository-url>
cd FitnessMeow_Dev
```

### 3. 데이터베이스 준비
MySQL에서 `FitnessMeow.sql`을 실행해 테이블을 생성합니다.
```bash
mysql -u root -p < FitnessMeow.sql
```

### 4. 백엔드 실행
```bash
cd server
npm install

# server/.env 파일 생성
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=fitnessmeow
# DB_USER=root
# DB_PASSWORD=비밀번호
# SESSION_SECRET=임의의_랜덤_문자열
# CLIENT_URL=http://localhost:5173

npm run dev        # nodemon (개발)  /  npm start (운영)
# 기본 포트: 3001
```

### 5. 프론트엔드 실행
```bash
cd client
npm install

# client/.env 파일 생성 (선택)
# VITE_API_URL=http://localhost:3001

npm run dev        # http://localhost:5173
```

브라우저에서 `http://localhost:5173` 접속 → 회원가입 → 로그인 → 메인 로비 진입.

---

## 📦 배포

`배포방법.txt` 참고. 요약하면:

1. **DB (Railway)** — MySQL 인스턴스 생성 후 `FitnessMeow.sql` 실행
2. **서버 (Render)** — Root `server`, Start `node src/server.js`, 환경변수(DB·SESSION_SECRET·CLIENT_URL) 설정
3. **클라이언트 (Vercel)** — Root `client`, 환경변수 `VITE_API_URL` 설정
4. 서버의 `CLIENT_URL`을 Vercel 주소로 업데이트

> ⚠️ **배포 전 체크**
> - `server/src/app.js`의 `testRoutes`(개발용 코인/경험치) 2줄 제거 또는 주석 처리
> - `app.js`의 `cookie.secure`를 `false → true`(HTTPS 전용)로 변경
> - 클라이언트 `TestCoinButton`(개발용) 제거

---

## 👥 팀 (김린아팀)

| 이름 | 역할 |
|------|------|
| **김린아** | 팀장 / PM · 백엔드 메인 (API·DB·인증·운동/캐릭터/상점/방 로직) |
| **김태윤** | 프론트엔드 · 운동 로직 및 운동·운동설정 페이지 |
| **이정석** | 프론트엔드 · 운동 결과/캐릭터 레벨업 페이지·로그인 연동 |
| **김건영** | 프론트엔드 · 로그인/회원가입·메인·마이룸·상점 화면 |

---

## 📝 라이선스

본 프로젝트는 KDT AI활용 헬스케어 서비스 개발자과정 팀 프로젝트 결과물입니다.

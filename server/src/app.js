/**
 * app.js — Express 앱 설정 및 미들웨어·라우터 등록
 *
 * 목차:
 *   1. 모듈 임포트      — Express, CORS, 세션, 라우터 파일 로드
 *   2. 앱 인스턴스 생성  — express() 생성 및 JSON 바디 파싱 등록
 *   3. CORS 설정        — 허용 오리진·쿠키 자격증명 설정
 *   4. 세션 설정        — express-session 보안 옵션 구성
 *   5. 라우터 등록       — 각 도메인별 API 경로 마운트
 *   6. 헬스체크         — 루트 경로(/) 상태 확인 엔드포인트
 *   7. 모듈 내보내기     — server.js 에서 listen 호출용
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
//    Express 및 미들웨어, 라우터 파일을 로드
// ══════════════════════════════════════
const express = require('express');
const cors = require('cors');
const session = require('express-session');


// 도메인별 라우터 파일 임포트
const authRoutes       = require('./routes/auth.routes');
const workoutRoutes    = require('./routes/workout.routes');
const characterRoutes  = require('./routes/character.routes');
const resultRoutes     = require('./routes/result.routes');
const coordinatesRoutes = require('./routes/coordinates.routes');
const inventoryRoutes  = require('./routes/inventory.routes');
const shopRoutes       = require('./routes/shop.routes');
const calendarRoutes    = require('./routes/calendar.routes');
const attendanceRoutes  = require('./routes/attendance.routes');
const roomRoutes        = require('./routes/room.routes');
const testRoutes       = require('./routes/test.routes'); // ⚠️ 개발용 — 배포 시 제거




// ══════════════════════════════════════
// 2. 앱 인스턴스 생성
//    Express 앱 생성 및 JSON 바디 파서 등록
// ══════════════════════════════════════
const app = express();

app.use(express.json()); // ← 이거 추가

// ══════════════════════════════════════
// 3. CORS 설정
//    클라이언트 오리진(CLIENT_URL)에서 오는 요청만 허용
//    credentials: true — 쿠키 기반 세션 인증을 위해 필수
// ══════════════════════════════════════
app.use(cors({
  origin: process.env.CLIENT_URL, //허용할 주소
  credentials: true, //쿠키 허용
}));

// ══════════════════════════════════════
// 4. 세션 설정
//    express-session 을 이용한 서버 사이드 세션 구성
//    secure: NODE_ENV=production 일 때만 true (HTTPS 전용 쿠키)
// ══════════════════════════════════════
app.use(session({
  secret: process.env.SESSION_SECRET, // 세션 암호화 키
  resave: false,            // 변경 없으면 저장 안 함
  saveUninitialized: false, // 빈 세션 저장 안 함
  cookie: {
    httpOnly: true,                                          // JS 에서 쿠키 접근 차단
    secure: process.env.NODE_ENV === 'production',          // HTTPS 환경에서만 true
    sameSite: 'lax',                                        // 크로스 사이트 쿠키 차단
    maxAge: 1000 * 60 * 60 * 24,                           // 24시간
  },
}));

// ══════════════════════════════════════
// 5. 라우터 등록
//    각 도메인별 API 경로에 라우터 마운트
//    ⚠️  /api/test 는 개발 전용 — 배포 시 두 줄 모두 제거
// ══════════════════════════════════════
app.use('/api/auth',        authRoutes);       // 인증 (회원가입·로그인·로그아웃·내정보)
app.use('/api/workouts',   workoutRoutes);     // 운동 기록 저장 및 EXP/코인 처리
app.use('/api/character',  characterRoutes);   // 캐릭터 조회 및 해금
app.use('/api/result',     resultRoutes);      // 운동 결과 화면용 최신 기록 조회
app.use('/api/coordinates', coordinatesRoutes); // 방 가구 배치 좌표 저장·조회·삭제
app.use('/api/inventory',  inventoryRoutes);   // 소유 아이템 + 배치 좌표 통합 조회
app.use('/api/shop',       shopRoutes);        // 상점 아이템 목록·구매
app.use('/api/calendar',    calendarRoutes);   // 월별 운동 달력
app.use('/api/attendance',  attendanceRoutes); // 출석 스트릭 조회
app.use('/api/room',        roomRoutes);       // 방 벽지·타일 테마 조회·변경
app.use('/api/test',       testRoutes);  // ⚠️ 개발용 — 배포 시 제거

// ══════════════════════════════════════
// 6. 헬스체크
//    루트 경로(/) 로 서버 작동 여부 확인
// ══════════════════════════════════════
app.get('/', (req, res) => {
  res.json({ message: '서버 작동 중 ' });
});

// ══════════════════════════════════════
// 7. 모듈 내보내기
//    server.js 에서 app.listen() 을 호출하기 위해 내보냄
// ══════════════════════════════════════
module.exports = app;

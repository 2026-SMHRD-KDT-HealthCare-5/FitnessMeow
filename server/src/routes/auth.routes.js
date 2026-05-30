/**
 * auth.routes.js — 인증 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트         — Express, bcryptjs, express-rate-limit, DB
 *   2. HTTP 상태코드 참고   — 이 파일에서 사용하는 응답 코드 목록
 *   3. Rate Limiter        — 로그인 브루트포스 공격 방지 (5분 10회)
 *   4. 헬퍼 함수           — BMI 계산, 입력값 검증 (ID·비밀번호·이메일)
 *   5. POST /register      — 회원가입 처리 (기본 캐릭터·아이템 지급 포함)
 *   6. POST /login         — 로그인 (bcrypt 검증, 세션 재생성)
 *   7. POST /logout        — 로그아웃 (세션 파기, 쿠키 삭제)
 *   8. GET  /me            — 내 정보 조회 (오늘 돌봄 퀘스트 상태 포함)
 *   9. PATCH /me           — 키·몸무게 수정 및 BMI 재계산
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
//    bcryptjs: 비밀번호 해싱, rateLimit: 요청 횟수 제한
// ══════════════════════════════════════
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../db');

// ══════════════════════════════════════
// 2. HTTP 상태코드 참고
//    이 라우터 파일에서 사용하는 응답 코드 목록
// ══════════════════════════════════════
/**
200 → 성공
201 → 생성 성공
400 → 잘못된 요청
401 → 인증 실패
404 → 없음
409 → 충돌
500 → 서버 오류
 */

// ══════════════════════════════════════
// 3. Rate Limiter
//    로그인 엔드포인트에만 적용: 5분 안에 10회 초과 시 차단
// ══════════════════════════════════════
//  로그인 rate limit (5분에 10번)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { success: false, message: '너무 많이 시도했습니다. 5분 후 다시 해주세요.' },
});

// ══════════════════════════════════════
// 4. 헬퍼 함수
//    BMI 계산 및 회원가입 입력값 형식 검증
// ══════════════════════════════════════
//bmi 계산
function calcBmi(weight, height) {
  const h = height / 100;
  return parseFloat((weight / (h * h)).toFixed(2));
}

// 입력값 검증 함수
//아이디가 4~20자 영문/숫자 인지 검사
function validateId(id) {
  return /^[a-zA-Z0-9]{4,20}$/.test(id);
}

// 비밀번호  4자리 ~ 12자
function validatePassword(password) {
  return password.length >= 4 && password.length <= 12;
}
//이메일 검증
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length<= 100;
}

// ══════════════════════════════════════
// 5. POST /register
//    회원가입: 입력값 검증 → bcrypt 해싱 → users INSERT
//    → 기본 캐릭터(cheese_korean_shorthair Lv1) 생성
//    → 기본 아이템(wallpaper_1, tile_1) 지급
// ══════════════════════════════════════
// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { id, name, email, password, weight, height } = req.body;

    // 필수 항목 누락 여부 확인
    if (!id || !name || !email || !password || !weight || !height) {
      return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
    }

    // ✅ 6. 입력값 검증
    if (!validateId(id)) {
      return res.status(400).json({ success: false, message: '아이디는 4~20자 영문/숫자만 입력해주세요.' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: '비밀번호는 4자 이상 12 이하로 입력해주세요 .' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: '이메일 형식이 올바르지 않습니다.' });
    }

    //비밀 번호 bcrypt로 변환
    const password_hash = await bcrypt.hash(password, 10);
    //bmi 계산
    const bmi = calcBmi(parseFloat(weight), parseFloat(height));

    //회원가입 처리후
    //DB table:users에 회원정보 삽입
    const [result] = await db.query(
      `INSERT INTO users (id, name, email, password_hash, weight, height, bmi)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, password_hash, weight, height, bmi]
    );

    const user_idx = result.insertId; // 방금 생성된 user_idx

    // 기본 캐릭터 생성
    await db.query(
      `INSERT INTO characters (user_idx, character_key, level, arm_exp, chest_exp, core_exp, lower_exp)
       VALUES (?, 'cheese_korean_shorthair', '1', 0, 0, 0, 0)`,
      [user_idx]
    );

    // 기본 아이템 지급 (wallpaper_1, tile_1)
    await db.query(
      `INSERT INTO user_items (user_idx, item_keyword, purchased_at, quantity) VALUES
       (?, 'wallpaper_1', NOW(), 1),
       (?, 'tile_1',      NOW(), 1)`,
      [user_idx, user_idx]
    );

    res.status(201).json({ success: true, message: '회원가입 완료!' });

  //이미 사용중인 아이디 일때
  //프론트 나중에 수정
  } catch (err) {
    // ER_DUP_ENTRY: 아이디 또는 이메일 중복 (UNIQUE 제약 위반)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: '이미 사용 중인 아이디 또는 이메일입니다.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});


// ══════════════════════════════════════
// 6. POST /login
//    Rate Limiter 적용 → 아이디 조회 → bcrypt 비교
//    → 세션 재생성(세션 고정 공격 방지) → 세션에 유저 정보 저장
// ══════════════════════════════════════
//  로그인 (rate limit 적용)
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { id, password } = req.body;

    // 아이디·비밀번호 누락 확인
    if (!id || !password) {
      return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
    }

    // ✅ 7. SELECT * 제거 — 필요한 컬럼만 조회 (보안 최소화)
    const [rows] = await db.query(
      'SELECT user_idx, id, name, password_hash, point FROM users WHERE id = ?',
      [id]
    );
    const user = rows[0];
    //아이디 없음
    if (!user) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }
    // 비밀번호 불일치
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    // 5. 로그인시 세션 재생성 (세션 고정 공격 방지)
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ success: false, message: '서버 오류' });
      //로그인한 정보로 다시 세션 생성
      req.session.user = {
        user_idx: user.user_idx,
        id: user.id,
        name: user.name,
      };

      res.json({
        success: true,
        message: '로그인 성공!',
        data: { user_idx: user.user_idx, name: user.name, point: user.point },
      });
    });

  } catch (err) { //에러
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});


// ══════════════════════════════════════
// 7. POST /logout
//    세션 파기 → 클라이언트 쿠키(connect.sid) 삭제
// ══════════════════════════════════════
//  로그아웃
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid'); //쿠키 삭제
    res.json({ success: true, message: '로그아웃 완료' });
  });
});


// ══════════════════════════════════════
// 8. GET /me
//    로그인된 유저의 기본 정보 + 오늘의 돌봄 퀘스트 달성 여부 반환
//    care_logs 에서 오늘 날짜의 feed·groom·clean 달성 여부를 Set 으로 판별
// ══════════════════════════════════════
//  내 정보 (SELECT * 제거)
router.get('/me', async (req, res) => {
  try {
    // 세션 인증 확인
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    // 유저 기본 정보 조회 (비밀번호 해시 제외)
    const [rows] = await db.query(
      'SELECT user_idx, id, name, email, weight, height, bmi, point FROM users WHERE user_idx = ?',
      [req.session.user.user_idx]
    );

    const today  = new Date().toISOString().split('T')[0];
    const userId = req.session.user.user_idx;

    // 오늘 달성한 돌봄 퀘스트 유형 + 운동별 누적 횟수 병렬 조회
    const [[logs], [repRows]] = await Promise.all([
      db.query(
        'SELECT care_type FROM care_logs WHERE user_idx = ? AND care_date = ?',
        [userId, today],
      ),
      db.query(
        `SELECT exercise_key, COALESCE(SUM(total_reps), 0) AS reps
         FROM workout_records
         WHERE user_idx = ? AND DATE(performed_at) = CURDATE()
         GROUP BY exercise_key`,
        [userId],
      ),
    ]);

    const doneTypes = new Set(logs.map(r => r.care_type));
    const repsMap   = {};
    repRows.forEach(r => { repsMap[r.exercise_key] = Number(r.reps); });

    res.json({
      success: true,
      data: {
        ...rows[0],
        today_status: {
          feed_done:  doneTypes.has('feed'),
          groom_done: doneTypes.has('groom'),
          clean_done: doneTypes.has('clean'),
        },
        // 오늘 운동별 누적 횟수 (퀘스트 진행률 표시용)
        today_reps: {
          squat:  repsMap.squat  ?? 0,
          pushup: repsMap.pushup ?? 0,
          lunge:  repsMap.lunge  ?? 0,
        },
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});


// ══════════════════════════════════════
// 9. PATCH /me
//    키·몸무게 수정 및 BMI 재계산
//    숫자 유효성 검사 후 DB UPDATE, 갱신된 값 반환
// ══════════════════════════════════════
// 키·몸무게 수정
router.patch('/me', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { height, weight } = req.body;
  if (!height || !weight) return res.status(400).json({ message: '키와 몸무게를 입력해주세요.' });

  // 숫자 변환 후 유효값 검증
  const h = parseFloat(height);
  const w = parseFloat(weight);
  if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
    return res.status(400).json({ message: '올바른 값을 입력해주세요.' });
  }

  // BMI 재계산 (소수점 2자리)
  const bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(2));

  try {
    // 키·몸무게·BMI 업데이트
    await db.query(
      'UPDATE users SET height = ?, weight = ?, bmi = ? WHERE user_idx = ?',
      [h, w, bmi, user_idx],
    );
    res.json({ success: true, height: h, weight: w, bmi });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

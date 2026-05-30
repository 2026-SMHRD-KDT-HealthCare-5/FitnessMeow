/**
 * calendar.routes.js — 운동 달력 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트   — Express, DB
 *   2. GET /         — 특정 연월의 운동한 날짜(일) 목록 반환
 *
 * 응답 형식:
 *   { year: 2025, month: 6, activeDays: [1, 5, 12, 28] }
 *   activeDays: 해당 월에 workout_records 가 존재하는 날짜(일) 배열 (중복 제거, 오름차순)
 *
 * 프론트 활용:
 *   Calendar 컴포넌트에서 activeDays 배열을 기반으로 운동한 날짜에 마커 표시
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
// ══════════════════════════════════════
// routes/calendar.routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/calendar?year=YYYY&month=M
   해당 월에 운동한 날짜 목록 반환

   응답: { year, month, activeDays: [1, 5, 12, ...] }
   - activeDays: 운동 기록이 있는 날짜(일) 배열 (중복 제거)
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 2. GET /
//    query: year (기본값: 현재 연도), month (기본값: 현재 월)
//    workout_records.performed_at 컬럼 기준으로 해당 연·월 필터링
//    DISTINCT DAY() 로 같은 날 여러 번 운동해도 날짜는 1회만 포함
// ══════════════════════════════════════
router.get('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  // 쿼리 파라미터 파싱 (미입력 시 현재 연월 사용)
  const now   = new Date();
  const year  = parseInt(req.query.year,  10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

  try {
    // 해당 연·월에 운동 기록이 있는 날짜(일) 목록 조회 (중복 제거, 오름차순)
    const [rows] = await db.query(
      `SELECT DISTINCT DAY(performed_at) AS day
       FROM workout_records
       WHERE user_idx = ?
         AND YEAR(performed_at)  = ?
         AND MONTH(performed_at) = ?
       ORDER BY day`,
      [user_idx, year, month],
    );

    res.json({
      year,
      month,
      activeDays: rows.map(r => r.day), // 날짜(일)만 추출하여 배열로 반환
    });
  } catch (err) {
    console.error('GET /api/calendar 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

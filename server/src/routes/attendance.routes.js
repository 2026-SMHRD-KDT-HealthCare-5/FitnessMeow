/**
 * attendance.routes.js — 출석 스트릭 조회 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트        — Express, DB
 *   2. GET /streak        — 현재 연속 출석일·최고 기록·총 출석일 반환
 *
 * 출석 기록 저장 방식:
 *   운동 완료(POST /api/workouts) 시 자동 등록 (workout.routes.js 참조)
 *   이 라우터는 조회 전용 (별도 출석 체크 API 없음)
 *
 * DB 테이블: attendances
 *   컬럼: attendance_idx, user_idx, addtend_date, streak_count, reward_given
 *   ※ 오타 주의: addtend_date (attend 가 아닌 addtend)
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
// ══════════════════════════════════════
// routes/attendance.routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/attendance/streak
   현재 연속 출석일 + 최고 기록 + 총 출석일 반환

   응답: { current_streak, max_streak, total_days }
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 2. GET /streak
//    current_streak: 가장 최근 출석일의 streak_count
//                    (오늘 또는 어제 출석 기록이 없으면 0 으로 리셋)
//    max_streak:     역대 최고 streak_count
//    total_days:     전체 출석 기록 수
//
//    CURDATE() 사용 이유:
//      JS new Date()는 UTC 기준이므로 KST(+9) 환경에서 날짜 불일치 발생 가능
//      DB 서버 타임존이 KST 로 설정된 경우 CURDATE() 가 정확함
// ══════════════════════════════════════
router.get('/streak', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    // 서브쿼리: 가장 최근 출석일의 streak_count 조회
    // MAX + COUNT: 최고 기록 및 전체 출석일 수 집계
    const [[row]] = await db.query(
      `SELECT
         (SELECT streak_count FROM attendances
          WHERE user_idx = ?
          ORDER BY addtend_date DESC LIMIT 1)         AS current_streak,
         COALESCE(MAX(streak_count), 0)               AS max_streak,
         COUNT(*)                                      AS total_days
       FROM attendances
       WHERE user_idx = ?`,
      [user_idx, user_idx],
    );

    // 가장 최근 출석일이 오늘 또는 어제가 아니면 스트릭 끊긴 것
    // CURDATE()로 DB 타임존 기준 비교 (JS new Date()는 UTC라 KST와 날짜 불일치 가능)
    const [[activeCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM attendances
       WHERE user_idx = ?
         AND addtend_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)`,
      [user_idx],
    );

    // 오늘 또는 어제 출석 기록이 없으면 current_streak 을 0으로 처리
    const current_streak = activeCheck.cnt > 0 ? (row.current_streak ?? 0) : 0;

    res.json({
      current_streak,
      max_streak:  row.max_streak  ?? 0,
      total_days:  row.total_days  ?? 0,
    });
  } catch (err) {
    console.error('GET /api/attendance/streak 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

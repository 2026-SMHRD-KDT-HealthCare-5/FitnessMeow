// routes/attendance.routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/attendance/streak
   현재 연속 출석일 + 최고 기록 + 총 출석일 반환

   응답: { current_streak, max_streak, total_days }
════════════════════════════════════════════ */
router.get('/streak', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
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

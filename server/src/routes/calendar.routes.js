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
router.get('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const now   = new Date();
  const year  = parseInt(req.query.year,  10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

  try {
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
      activeDays: rows.map(r => r.day),
    });
  } catch (err) {
    console.error('GET /api/calendar 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

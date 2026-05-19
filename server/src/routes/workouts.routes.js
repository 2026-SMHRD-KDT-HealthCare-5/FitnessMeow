const express = require('express');
const mysql = require('mysql2/promise');

const router = express.Router();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// POST /api/workouts
// 운동 기록 저장
router.post('/', async (req, res) => {
  try {
    const {
      exercise_key,
      sets,
      reps,
      totalReps,
      perfect = 0,
      normal = 0,
      calories = 0,
    } = req.body;

    // TODO: 실제 user_idx는 세션/토큰에서 가져오기
    const user_idx = 1; // 임시 하드코딩

    const conn = await db.getConnection();

    // workouts 테이블에 기록 저장
    await conn.query(
      `INSERT INTO workouts (user_idx, exercise_key, sets, reps, totalReps, perfect, normal, calories, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [user_idx, exercise_key, sets, reps, totalReps, perfect, normal, calories]
    );

    conn.release();

    res.json({
      success: true,
      data: {
        exercise_key,
        sets,
        reps,
        totalReps,
        perfect,
        normal,
        calories,
      },
    });
  } catch (err) {
    console.error('[Workouts] 저장 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;

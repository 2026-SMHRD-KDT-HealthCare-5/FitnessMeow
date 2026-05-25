const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/result
   Result.jsx에 필요한 최신 운동 기록 + 현재 캐릭터
════════════════════════════════════════════ */
router.get('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [[workoutRows], [charRows]] = await Promise.all([
      db.query(
        `SELECT *, (reps * sets) AS gained_exp
         FROM workout_records
         WHERE user_idx = ?
         ORDER BY performed_at DESC
         LIMIT 1`,
        [user_idx],
      ),
      db.query(
        `SELECT * FROM characters
         WHERE user_idx = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [user_idx],
      ),
    ]);

    if (!workoutRows.length) return res.status(404).json({ message: '운동 기록이 없습니다.' });
    if (!charRows.length)    return res.status(404).json({ message: '캐릭터를 찾을 수 없습니다.' });

    const w = workoutRows[0];
    const c = charRows[0];

    res.json({
      workout: {
        exercise_key  : w.exercise_key,
        sets          : w.sets,
        reps          : w.reps,
        total_score   : w.total_score,
        calories      : w.calories,
        perfect_count : w.perfect_count,
        normal_count  : w.normal_count,
        gained_exp    : w.gained_exp,
      },
      character: {
        character_key : c.character_key,
        level         : c.level,
        arm_exp       : c.arm_exp,
        chest_exp     : c.chest_exp,
        core_exp      : c.core_exp,
        lower_exp     : c.lower_exp,
      },
    });
  } catch (err) {
    console.error('GET /api/result 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
// routes/workout.routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { CHARACTER_CONFIG, EXERCISE_PART_MAP } = require('../config/characters.cjs');
const { applyExpAndLevelUp } = require('../utils/levelup.cjs');
const { applyDailyQuest }   = require('../utils/dailyQuest.cjs');

/* ════════════════════════════════════════════
   POST /api/workouts
════════════════════════════════════════════ */
router.post('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const {
    exercise_key,
    sets,
    reps,
    total_score,
    calories,
    perfect_count,
    normal_count,
    total_reps
  } = req.body;

  // 1. 운동 키 유효성 검사
  const exp_columns = EXERCISE_PART_MAP[exercise_key];
  if (!exp_columns || exp_columns.length === 0) {
    return res.status(400).json({ message: `알 수 없는 운동 키: ${exercise_key}` });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 2. workout_records INSERT
    await conn.query(
      `INSERT INTO workout_records
         (user_idx, exercise_key, sets, reps,
          total_score, calories, perfect_count, normal_count, total_reps)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_idx, exercise_key, sets, reps,
       total_score, calories, perfect_count, normal_count, total_reps],
    );

    // 3. gained_exp: 1회당 1exp 이므로 총 횟수가 얻은 경험치
    const gained_exp = total_reps;

    // 4. 현재 캐릭터 조회 (FOR UPDATE: 동시 요청 충돌 방지)
    const [rows] = await conn.query(
      `SELECT * FROM characters
       WHERE user_idx = ?
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [user_idx],
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: '캐릭터를 찾을 수 없습니다.' });
    }

    const character    = rows[0];
    const character_key = character.character_key;

    if (!CHARACTER_CONFIG[character_key]) {
      await conn.rollback();
      return res.status(500).json({ message: `캐릭터 설정을 찾을 수 없습니다: ${character_key}` });
    }

    // 5~10. EXP 누적·레벨업·해금 (공통 유틸)
    const { level_up, character_unlocked, next_character_name, updated_character } =
      await applyExpAndLevelUp(conn, character, gained_exp, user_idx, exp_columns);

    // 9. 포인트(츄르) 적립  : 1회당 1코인 이므로 gained_exp랑 같음
    await conn.query(
      `UPDATE users SET point = point + ? WHERE user_idx = ?`,
      [gained_exp,user_idx],
    );

    // 9-1. 일일 퀘스트 자동 달성
    await applyDailyQuest(conn, user_idx, exercise_key, total_reps);

    // 9-2. 출석 기록 자동 등록 (오늘 첫 운동 시)
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [[existingAtt]] = await conn.query(
      'SELECT attendance_idx FROM attendances WHERE user_idx = ? AND addtend_date = ?',
      [user_idx, today],
    );
    if (!existingAtt) {
      const [[yesterdayAtt]] = await conn.query(
        'SELECT streak_count FROM attendances WHERE user_idx = ? AND addtend_date = ?',
        [user_idx, yesterday],
      );
      const newStreak = yesterdayAtt ? yesterdayAtt.streak_count + 1 : 1;
      await conn.query(
        `INSERT INTO attendances (user_idx, addtend_date, streak_count, reward_given)
         VALUES (?, ?, ?, 0)`,
        [user_idx, today, newStreak],
      );
    }

    await conn.commit();

    res.json({ level_up, character_unlocked, next_character_name, character: updated_character });

  } catch (err) {
    await conn.rollback();
    console.error('POST /api/workouts 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    conn.release();
  }
});

module.exports = router;
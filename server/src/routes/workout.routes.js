// routes/workout.routes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { CHARACTER_CONFIG, EXERCISE_PART_MAP } = require('../config/characters.cjs');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// POST /api/workouts
router.post('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { exercise_key, sets, reps, total_score, calories, perfect_count, normal_count } = req.body;

  try {
    // 1. workout_records INSERT
    await db.query(
      `INSERT INTO workout_records 
       (user_idx, exercise_key, sets, reps, total_score, calories, perfect_count, normal_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_idx, exercise_key, sets, reps, total_score, calories, perfect_count, normal_count]
    );

    // 2. gained_exp 계산
    const gained_exp = reps * sets;

    // 3. 부위 컬럼 판단
    const exp_columns = EXERCISE_PART_MAP[exercise_key];

    // 4. 현재 캐릭터 조회
    const [rows] = await db.query(
      `SELECT * FROM characters WHERE user_idx = ? ORDER BY created_at DESC LIMIT 1`,
      [user_idx]
    );
    const character = rows[0];

    const character_key = Object.keys(CHARACTER_CONFIG).find(
      key => CHARACTER_CONFIG[key].character_name === character.character_name
    );

    const current_level = Number(character.level);

    // 5. 각 부위 exp 누적
    for (const exp_column of exp_columns) {
      const current_exp = character[exp_column];
      const max_exp     = CHARACTER_CONFIG[character_key].max_exp[`lv${current_level}`];
      const summed_exp  = current_exp + gained_exp;

      const new_exp = current_level === 3
        ? Math.min(summed_exp, max_exp)
        : summed_exp;

      await db.query(
        `UPDATE characters SET ${exp_column} = ? WHERE character_idx = ?`,
        [new_exp, character.character_idx]
      );
    }

    // 6. 모든 부위 max 달성 여부 체크
    const [updated] = await db.query(
      `SELECT * FROM characters WHERE character_idx = ?`,
      [character.character_idx]
    );
    const updated_character = updated[0];
    const max_exp = CHARACTER_CONFIG[character_key].max_exp[`lv${current_level}`];

    const all_max =
      updated_character.arm_exp   >= max_exp &&
      updated_character.chest_exp >= max_exp &&
      updated_character.core_exp  >= max_exp &&
      updated_character.lower_exp >= max_exp;

    let level_up = false;

    // 7. 레벨업 + 이월
    if (all_max && current_level < 3) {
      await db.query(
        `UPDATE characters SET
          level     = ?,
          arm_exp   = GREATEST(arm_exp - ?, 0),
          chest_exp = GREATEST(chest_exp - ?, 0),
          core_exp  = GREATEST(core_exp - ?, 0),
          lower_exp = GREATEST(lower_exp - ?, 0)
         WHERE character_idx = ?`,
        [String(current_level + 1), max_exp, max_exp, max_exp, max_exp, character.character_idx]
      );
      level_up = true;
    }

    // 8. 캐릭터 해금 체크 (lv3 달성 시에만)
    let character_unlocked  = false;
    let next_character_name = null;

    if (level_up && current_level + 1 === 3) {
      const next_key = Object.keys(CHARACTER_CONFIG).find(key => {
        const condition = CHARACTER_CONFIG[key].unlock_condition;
        return condition?.prev_character === character_key && condition?.badge === null;
      });

      if (next_key) {
        character_unlocked  = true;
        next_character_name = CHARACTER_CONFIG[next_key].character_name;

        await db.query(
          `INSERT INTO characters (user_idx, character_name, level, arm_exp, chest_exp, core_exp, lower_exp)
           VALUES (?, ?, '1', 0, 0, 0, 0)`,
          [user_idx, next_character_name]
        );
      }
    }

    res.json({ level_up, character_unlocked, next_character_name });

  } catch (err) {
    console.error('POST /api/workouts 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// GET /api/workouts/latest
router.get('/latest', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [rows] = await db.query(
      `SELECT *, (reps * sets) AS gained_exp 
       FROM workout_records 
       WHERE user_idx = ? 
       ORDER BY performed_at DESC LIMIT 1`,
      [user_idx]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/workouts/latest 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
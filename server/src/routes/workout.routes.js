// routes/workout.routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { CHARACTER_CONFIG, EXERCISE_PART_MAP } = require('../config/characters.cjs');

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
          total_score, calories, perfect_count, normal_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_idx, exercise_key, sets, reps,
       total_score, calories, perfect_count, normal_count],
    );

    // 3. gained_exp 계산
    const gained_exp = reps * sets;

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

    const current_level = Number(character.level);
    const max_exp       = CHARACTER_CONFIG[character_key].max_exp[`lv${current_level}`];

    // 5. 부위별 EXP 누적 (단일 UPDATE로 통합)
    const setClauses = exp_columns.map(col => {
      const summed_exp = character[col] + gained_exp;
      const new_exp    = current_level === 3
        ? Math.min(summed_exp, max_exp)
        : summed_exp;
      return { col, new_exp };
    });

    const setSQL    = setClauses.map(({ col }) => `${col} = ?`).join(', ');
    const setValues = setClauses.map(({ new_exp }) => new_exp);

    await conn.query(
      `UPDATE characters SET ${setSQL} WHERE character_idx = ?`,
      [...setValues, character.character_idx],
    );

    // 6. 업데이트된 캐릭터 재조회
    const [updatedRows] = await conn.query(
      `SELECT * FROM characters WHERE character_idx = ?`,
      [character.character_idx],
    );
    const updated_character = updatedRows[0];

    // 7. 모든 부위 max 달성 여부 체크
    const all_max =
      updated_character.arm_exp   >= max_exp &&
      updated_character.chest_exp >= max_exp &&
      updated_character.core_exp  >= max_exp &&
      updated_character.lower_exp >= max_exp;

    // 8. 레벨업 + EXP 이월
    let level_up = false;

    if (all_max && current_level < 3) {
      await conn.query(
        `UPDATE characters SET
           level     = ?,
           arm_exp   = GREATEST(arm_exp   - ?, 0),
           chest_exp = GREATEST(chest_exp - ?, 0),
           core_exp  = GREATEST(core_exp  - ?, 0),
           lower_exp = GREATEST(lower_exp - ?, 0)
         WHERE character_idx = ?`,
        [String(current_level + 1),
         max_exp, max_exp, max_exp, max_exp,
         character.character_idx],
      );
      level_up = true;
    }

    // 9. 포인트(츄르) 적립
    await conn.query(
      `UPDATE users SET point = point + ? WHERE user_idx = ?`,
      [gained_exp, user_idx],
    );

    // 10. 새 캐릭터 종 해금 체크 (LV 3 달성 시)
    let character_unlocked  = false;
    let next_character_name = null;

    if (level_up && current_level + 1 === 3) {
      const next_key = Object.keys(CHARACTER_CONFIG).find(key => {
        const condition = CHARACTER_CONFIG[key].unlock_condition;
        return condition?.prev_character === character_key && condition?.badge == null;
      });

      if (next_key) {
        character_unlocked  = true;
        next_character_name = CHARACTER_CONFIG[next_key].character_name; // 한국어 표시명 (프론트 출력용)

        await conn.query(
          `INSERT INTO characters
             (user_idx, character_key, level, arm_exp, chest_exp, core_exp, lower_exp)
           VALUES (?, ?, '1', 0, 0, 0, 0)`,
          [user_idx, next_key], // config key 저장
        );
      }
    }

    await conn.commit();

    res.json({ level_up, character_unlocked, next_character_name });

  } catch (err) {
    await conn.rollback();
    console.error('POST /api/workouts 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    conn.release();
  }
});

/* ════════════════════════════════════════════
   GET /api/workouts/latest
   //가장 최근 운동 기록 반환 -> 경험치량으로 계산
════════════════════════════════════════════ */
router.get('/latest', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [rows] = await db.query(
      `SELECT *, (reps * sets) AS gained_exp
       FROM workout_records
       WHERE user_idx = ?
       ORDER BY performed_at DESC
       LIMIT 1`,
      [user_idx],
    );

    if (!rows.length) {
      return res.status(404).json({ message: '운동 기록이 없습니다.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/workouts/latest 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
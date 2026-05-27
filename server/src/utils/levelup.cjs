/**
 * utils/levelup.cjs — 캐릭터 경험치·레벨업·해금 공통 유틸
 *
 * workout.routes.js 와 test.routes.js 에서 동일한 로직을 공유하기 위해 분리.
 *
 * applyExpAndLevelUp(conn, character, gained_exp, user_idx, exp_columns)
 *   - 부위별 EXP 누적
 *   - 전 부위 max 달성 시 레벨업 + EXP 이월
 *   - Lv3 달성 시 다음 캐릭터 해금 INSERT
 *   - 반환: { level_up, character_unlocked, next_character_name, updated_character }
 */

const { CHARACTER_CONFIG } = require('../config/characters.cjs');

const ALL_EXP_COLS = ['arm_exp', 'chest_exp', 'core_exp', 'lower_exp'];

/**
 * @param {object}   conn         - DB 커넥션 또는 풀 (.query 메서드 보유)
 * @param {object}   character    - characters 테이블 row
 * @param {number}   gained_exp   - 추가할 경험치
 * @param {number}   user_idx     - 해금 INSERT 용 유저 idx
 * @param {string[]} exp_columns  - 경험치를 더할 부위 컬럼 (기본: 4개 전부)
 */
async function applyExpAndLevelUp(
  conn,
  character,
  gained_exp,
  user_idx,
  exp_columns = ALL_EXP_COLS,
) {
  const { character_idx, character_key } = character;
  const current_level = Number(character.level);
  const config  = CHARACTER_CONFIG[character_key];
  if (!config) throw new Error(`캐릭터 설정 없음: ${character_key}`);

  const max_exp = config.max_exp[`lv${current_level}`];

  /* ── 1. 부위별 EXP 누적 ─────────────────────────────────────────── */
  const setClauses = exp_columns.map(col => {
    const summed = character[col] + gained_exp;
    const capped = current_level === 3 ? Math.min(summed, max_exp) : summed;
    return { col, val: capped };
  });

  await conn.query(
    `UPDATE characters SET ${setClauses.map(c => `${c.col} = ?`).join(', ')} WHERE character_idx = ?`,
    [...setClauses.map(c => c.val), character_idx],
  );

  /* ── 2. 업데이트 후 재조회 ──────────────────────────────────────── */
  const [updatedRows] = await conn.query(
    'SELECT * FROM characters WHERE character_idx = ?',
    [character_idx],
  );
  const updated = updatedRows[0];

  /* ── 3. 전 부위 max 달성 여부 ───────────────────────────────────── */
  const all_max = ALL_EXP_COLS.every(col => updated[col] >= max_exp);

  /* ── 4. 레벨업 + EXP 이월 ───────────────────────────────────────── */
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
      [String(current_level + 1), max_exp, max_exp, max_exp, max_exp, character_idx],
    );
    level_up = true;
  }

  /* ── 5. Lv3 달성 시 다음 캐릭터 해금 ───────────────────────────── */
  let character_unlocked  = false;
  let next_character_name = null;

  if (current_level === 3 && all_max) {
    const next_key = Object.keys(CHARACTER_CONFIG).find(key => {
      const cond = CHARACTER_CONFIG[key].unlock_condition;
      return cond?.prev_character === character_key && cond?.badge == null;
    });

    if (next_key) {
      const [[existing]] = await conn.query(
        'SELECT character_idx FROM characters WHERE user_idx = ? AND character_key = ?',
        [user_idx, next_key],
      );
      if (!existing) {
        await conn.query(
          `INSERT INTO characters
             (user_idx, character_key, level, arm_exp, chest_exp, core_exp, lower_exp)
           VALUES (?, ?, '1', 0, 0, 0, 0)`,
          [user_idx, next_key],
        );
        character_unlocked  = true;
        next_character_name = CHARACTER_CONFIG[next_key].character_name;
      }
    }
  }

  /* ── 6. 최신 캐릭터 재조회 후 반환 ─────────────────────────────── */
  const [finalRows] = await conn.query(
    'SELECT * FROM characters WHERE character_idx = ?',
    [character_idx],
  );
  const final_character = finalRows[0];
  const new_level_key   = `lv${final_character.level}`;

  return {
    level_up,
    character_unlocked,
    next_character_name,
    updated_character: {
      ...final_character,
      max_exp:        config.max_exp[new_level_key] ?? 30,
      character_name: config.character_name,
    },
  };
}

module.exports = { applyExpAndLevelUp };

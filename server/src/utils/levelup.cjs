/**
 * levelup.cjs — 캐릭터 경험치·레벨업·해금 공통 유틸
 *
 * 목차:
 *   1. EXP 컬럼 목록    — 4개 부위 경험치 컬럼명 상수
 *   2. applyExpAndLevelUp — EXP 누적 → 레벨업 → 다음 캐릭터 해금 처리 함수
 *   3. 모듈 내보내기     — applyExpAndLevelUp
 *
 * 호출처:
 *   - server/src/routes/workout.routes.js  (POST /api/workouts 트랜잭션 내)
 *   - server/src/routes/test.routes.js     (POST /api/test/add-exp)
 *
 * DB 테이블:
 *   characters        — 유저별 캐릭터 EXP·레벨
 *   character_masters — 캐릭터 이름·레벨별 max_exp·해금 선행 키
 */

// ══════════════════════════════════════
// 1. EXP 컬럼 목록
//    캐릭터 테이블의 4개 부위 경험치 컬럼명 (전체 적용 시 기본값으로 사용)
// ══════════════════════════════════════
const ALL_EXP_COLS = ['arm_exp', 'chest_exp', 'core_exp', 'lower_exp'];

// ══════════════════════════════════════
// 2. applyExpAndLevelUp
//    단일 함수에서 아래 6단계를 순서대로 처리:
//      1) character_masters 에서 max_exp 조회
//      2) 부위별 EXP 누적 (Lv3 에서는 max_exp 초과 금지)
//      3) 업데이트 후 캐릭터 재조회
//      4) 전 부위 max_exp 달성 여부 확인
//      5) 레벨업 + EXP 이월 처리
//      6) Lv3 달성 시 다음 캐릭터 해금
//      7) 최신 캐릭터 재조회 후 반환
// ══════════════════════════════════════
async function applyExpAndLevelUp(
  conn,
  character,
  gained_exp,
  user_idx,
  exp_columns = ALL_EXP_COLS,  // 운동 종류에 따라 일부 컬럼만 전달 가능
) {
  const { character_idx, character_key } = character;
  const current_level = Number(character.level);

  // character_masters 에서 max_exp + 이름 조회
  const [[master]] = await conn.query(
    `SELECT character_name, lv1_max_exp, lv2_max_exp, lv3_max_exp
     FROM character_masters
     WHERE character_key = ?`,
    [character_key],
  );
  if (!master) throw new Error(`캐릭터 마스터 없음: ${character_key}`);

  // 현재 레벨에 해당하는 max_exp 값 선택 (예: lv1_max_exp)
  const max_exp = master[`lv${current_level}_max_exp`];

  /* ── 1. 부위별 EXP 누적 ── */
  // Lv3 은 최대 레벨이므로 max_exp 초과하지 않도록 캡 처리
  const setClauses = exp_columns.map(col => {
    const summed = character[col] + gained_exp;
    const capped = current_level === 3 ? Math.min(summed, max_exp) : summed;
    return { col, val: capped };
  });

  // 운동 부위에 해당하는 컬럼만 UPDATE (exp_columns 로 동적 생성)
  await conn.query(
    `UPDATE characters SET ${setClauses.map(c => `${c.col} = ?`).join(', ')} WHERE character_idx = ?`,
    [...setClauses.map(c => c.val), character_idx],
  );

  /* ── 2. 업데이트 후 재조회 ── */
  const [updatedRows] = await conn.query(
    'SELECT * FROM characters WHERE character_idx = ?',
    [character_idx],
  );
  const updated = updatedRows[0];

  /* ── 3. 전 부위 max 달성 여부 ── */
  // 4개 부위 모두 max_exp 이상이어야 레벨업 조건 충족
  const all_max = ALL_EXP_COLS.every(col => updated[col] >= max_exp);

  /* ── 4. 레벨업 + EXP 이월 ── */
  let level_up = false;
  if (all_max && current_level < 3) {
    // 레벨 +1, 각 부위 EXP 에서 max_exp 차감 (이월, 최소 0 보장)
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

  /* ── 5. Lv3 달성 시 다음 캐릭터 해금 ── */
  let character_unlocked  = false;
  let next_character_name = null;

  if (current_level === 3 && all_max) {
    // character_masters.unlock_prev_key 로 해금 대상 찾기
    const [[nextMaster]] = await conn.query(
      'SELECT character_key, character_name FROM character_masters WHERE unlock_prev_key = ?',
      [character_key],
    );
    if (nextMaster) {
      // 이미 해금된 캐릭터가 있으면 중복 INSERT 방지
      const [[existing]] = await conn.query(
        'SELECT character_idx FROM characters WHERE user_idx = ? AND character_key = ?',
        [user_idx, nextMaster.character_key],
      );
      if (!existing) {
        // 새 캐릭터를 Lv1·EXP 0 으로 생성
        await conn.query(
          `INSERT INTO characters
             (user_idx, character_key, level, arm_exp, chest_exp, core_exp, lower_exp)
           VALUES (?, ?, '1', 0, 0, 0, 0)`,
          [user_idx, nextMaster.character_key],
        );
        character_unlocked  = true;
        next_character_name = nextMaster.character_name;
      }
    }
  }

  /* ── 6. 최신 캐릭터 재조회 후 반환 ── */
  const [finalRows] = await conn.query(
    'SELECT * FROM characters WHERE character_idx = ?',
    [character_idx],
  );
  const final_character = finalRows[0];
  // 최종 레벨 기준 max_exp 키 (예: 레벨업 후 lv2_max_exp)
  const new_level_key   = `lv${final_character.level}_max_exp`;

  return {
    level_up,
    character_unlocked,
    next_character_name,
    updated_character: {
      ...final_character,
      max_exp:        master[new_level_key] ?? 30,  // 마스터 데이터 없으면 기본값 30
      character_name: master.character_name,
    },
  };
}

// ══════════════════════════════════════
// 3. 모듈 내보내기
//    applyExpAndLevelUp — workout.routes.js 및 test.routes.js 에서 사용
// ══════════════════════════════════════
module.exports = { applyExpAndLevelUp };

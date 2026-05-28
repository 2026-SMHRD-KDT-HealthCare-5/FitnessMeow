// utils/dailyQuest.cjs
// 일일 퀘스트 자동 달성 로직 (운동 완료 시 호출)

const CARE_QUEST_MAP = {
  squat:  { care_type: 'feed',  required_reps: 15 },
  pushup: { care_type: 'groom', required_reps: 10 },
  lunge:  { care_type: 'clean', required_reps: 15 },
};

/**
 * 운동 완료 후 일일 퀘스트 달성 여부 확인 및 처리
 * @param {object} conn  - DB 커넥션 (트랜잭션 내에서 호출)
 * @param {number} user_idx
 * @param {string} exercise_key
 * @param {number} total_reps  - 오늘 인정된 총 횟수
 * @returns {{ quest_done: boolean, care_type?: string }}
 */
async function applyDailyQuest(conn, user_idx, exercise_key, total_reps) {
  const quest = CARE_QUEST_MAP[exercise_key];
  if (!quest || total_reps < quest.required_reps) return { quest_done: false };

  const today = new Date().toISOString().split('T')[0];

  const [[existing]] = await conn.query(
    'SELECT care_idx FROM care_logs WHERE user_idx = ? AND care_type = ? AND care_date = ?',
    [user_idx, quest.care_type, today],
  );
  if (existing) return { quest_done: false, already_done: true };

  await conn.query(
    'INSERT INTO care_logs (user_idx, care_type, care_date, reward_point) VALUES (?, ?, ?, ?)',
    [user_idx, quest.care_type, today, 50],
  );
  await conn.query(
    'UPDATE users SET point = point + 50 WHERE user_idx = ?',
    [user_idx],
  );

  return { quest_done: true, care_type: quest.care_type };
}

module.exports = { CARE_QUEST_MAP, applyDailyQuest };

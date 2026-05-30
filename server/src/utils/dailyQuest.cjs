/**
 * dailyQuest.cjs — 일일 퀘스트 자동 달성 유틸
 *
 * 목차:
 *   1. 퀘스트 매핑 테이블   — 운동 키 → care_type·최소 횟수 매핑
 *   2. applyDailyQuest      — 퀘스트 달성 조건 확인 및 보상 지급 함수
 *   3. 모듈 내보내기         — CARE_QUEST_MAP, applyDailyQuest
 *
 * 호출 시점: POST /api/workouts 트랜잭션 내부
 * 처리 순서: 운동 키·횟수 조건 체크 → care_logs INSERT → 코인 +50
 * DB 테이블: care_logs (care_type: 'feed' | 'groom' | 'clean')
 */

// ══════════════════════════════════════
// 1. 퀘스트 매핑 테이블
//    운동 키(exercise_key) → care_type + 달성에 필요한 최소 횟수(required_reps)
//    squat  → 밥 주기(feed):  15회 이상
//    pushup → 빗질(groom):   10회 이상
//    lunge  → 청소(clean):   15회 이상
// ══════════════════════════════════════
const CARE_QUEST_MAP = {
  squat:  { care_type: 'feed',  required_reps: 15 },
  pushup: { care_type: 'groom', required_reps: 10 },
  lunge:  { care_type: 'clean', required_reps: 15 },
};

// ══════════════════════════════════════
// 2. applyDailyQuest
//    운동 완료 후 일일 퀘스트 달성 여부를 확인하고 보상(+50 코인)을 지급
//    반드시 트랜잭션 내에서 호출해야 함 (conn 은 BEGIN 된 커넥션)
// ══════════════════════════════════════
/**
 * 운동 완료 후 일일 퀘스트 달성 여부 확인 및 처리
 * @param {object} conn  - DB 커넥션 (트랜잭션 내에서 호출)
 * @param {number} user_idx
 * @param {string} exercise_key
 * @param {number} total_reps  - 오늘 인정된 총 횟수
 * @returns {{ quest_done: boolean, care_type?: string }}
 */
async function applyDailyQuest(conn, user_idx, exercise_key) {
  const quest = CARE_QUEST_MAP[exercise_key];
  if (!quest) return { quest_done: false };

  // 오늘 해당 운동의 누적 total_reps 합산 (현재 트랜잭션의 INSERT 포함)
  const [[row]] = await conn.query(
    `SELECT COALESCE(SUM(total_reps), 0) AS cumulative_reps
     FROM workout_records
     WHERE user_idx = ? AND exercise_key = ? AND DATE(performed_at) = CURDATE()`,
    [user_idx, exercise_key],
  );
  if (row.cumulative_reps < quest.required_reps) return { quest_done: false };

  // 오늘 날짜를 'YYYY-MM-DD' 형식으로 획득 (JS UTC 기준)
  const today = new Date().toISOString().split('T')[0];

  // 오늘 이미 동일 care_type 퀘스트를 완료했는지 확인 (중복 보상 방지)
  const [[existing]] = await conn.query(
    'SELECT care_idx FROM care_logs WHERE user_idx = ? AND care_type = ? AND care_date = ?',
    [user_idx, quest.care_type, today],
  );
  if (existing) return { quest_done: false, already_done: true };

  // 퀘스트 달성 기록 저장 (care_logs INSERT)
  await conn.query(
    'INSERT INTO care_logs (user_idx, care_type, care_date, reward_point) VALUES (?, ?, ?, ?)',
    [user_idx, quest.care_type, today, 50],
  );

  // 달성 보상: 코인 +50 지급
  await conn.query(
    'UPDATE users SET point = point + 50 WHERE user_idx = ?',
    [user_idx],
  );

  return { quest_done: true, care_type: quest.care_type };
}

// ══════════════════════════════════════
// 3. 모듈 내보내기
//    CARE_QUEST_MAP — 퀘스트 조건 참조용 (테스트·디버그에서 활용)
//    applyDailyQuest — workout.routes.js 트랜잭션 내에서 호출
// ══════════════════════════════════════
module.exports = { CARE_QUEST_MAP, applyDailyQuest };

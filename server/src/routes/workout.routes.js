/**
 * workout.routes.js — 운동 기록 저장 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트            — Express, DB, 유틸 함수
 *   2. 운동-EXP 부위 매핑 상수  — 운동 키 → 경험치 적용 부위 컬럼 매핑
 *   3. POST /                  — 운동 기록 저장 (트랜잭션: EXP·코인·퀘스트·출석 일괄 처리)
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
//    levelup.cjs: EXP 누적·레벨업·해금 유틸
//    dailyQuest.cjs: 일일 퀘스트 달성 처리 유틸
// ══════════════════════════════════════
// routes/workout.routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ══════════════════════════════════════
// 2. 운동-EXP 부위 매핑 상수
//    운동 키 → 해당 운동이 경험치를 적용할 캐릭터 부위 컬럼 목록
//    pushup: 가슴·팔·코어  /  squat·lunge: 하체·코어
// ══════════════════════════════════════
const EXERCISE_PART_MAP = {
  pushup: ['chest_exp', 'arm_exp', 'core_exp'],
  squat:  ['lower_exp', 'core_exp'],
  lunge:  ['lower_exp', 'core_exp'],
};

// EXP 누적·레벨업·해금 공통 유틸 (utils/levelup.cjs)
const { applyExpAndLevelUp } = require('../utils/levelup.cjs');
// 일일 퀘스트 달성 처리 유틸 (utils/dailyQuest.cjs)
const { applyDailyQuest }   = require('../utils/dailyQuest.cjs');

/* ════════════════════════════════════════════
   POST /api/workouts
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 3. POST /
//    운동 결과를 받아 아래 순서로 트랜잭션 처리:
//      1) 운동 키 유효성 검사 (EXERCISE_PART_MAP 에 없으면 400)
//      2) workout_records INSERT
//      3) gained_exp = total_reps (1회 = 1 EXP)
//      4) 현재 캐릭터 조회 (FOR UPDATE — 동시 요청 충돌 방지)
//      5~10) EXP 누적·레벨업·해금 (applyExpAndLevelUp)
//      11) 포인트(코인) 적립: gained_exp 만큼 (+1코인/1회)
//      12) 일일 퀘스트 자동 달성 (applyDailyQuest)
//      13) 출석 기록 자동 등록 (오늘 첫 운동 시 streak 계산)
// ══════════════════════════════════════
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

  // 트랜잭션용 개별 커넥션 획득
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 2. workout_records INSERT — 운동 결과 기록 저장
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

    // 5~10. EXP 누적·레벨업·해금 (공통 유틸)
    const { level_up, character_unlocked, next_character_name, updated_character } =
      await applyExpAndLevelUp(conn, character, gained_exp, user_idx, exp_columns);

    // 9. 포인트(츄르) 적립  : 1회당 1코인 이므로 gained_exp랑 같음
    await conn.query(
      `UPDATE users SET point = point + ? WHERE user_idx = ?`,
      [gained_exp, user_idx],
    );

    // 9-1. 일일 퀘스트 자동 달성
    await applyDailyQuest(conn, user_idx, exercise_key);

    // 9-2. 출석 기록 자동 등록 (오늘 첫 운동 시)
    // CURDATE()로 DB 타임존 기준 날짜 사용
    const [[existingAtt]] = await conn.query(
      'SELECT attendance_idx FROM attendances WHERE user_idx = ? AND addtend_date = CURDATE()',
      [user_idx],
    );

    if (!existingAtt) {
      // 어제 출석 기록 조회 →  없으면 1부터 시작
      const [[yesterdayAtt]] = await conn.query(
        `SELECT streak_count FROM attendances
         WHERE user_idx = ? AND addtend_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`,
        [user_idx],
      );
       // 어제 출석 기록 조회 → 있으면 streak +1
      const newStreak = yesterdayAtt ? yesterdayAtt.streak_count + 1 : 1;
      await conn.query(
        `INSERT INTO attendances (user_idx, addtend_date, streak_count, reward_given)
         VALUES (?, CURDATE(), ?, 0)`,
        [user_idx, newStreak],
      );
    }

    await conn.commit();

    // 트랜잭션 성공 — 레벨업·해금·최신 캐릭터 정보 반환
    res.json({ level_up, character_unlocked, next_character_name, character: updated_character });

  } catch (err) {
    await conn.rollback();
    console.error('POST /api/workouts 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    conn.release(); // 반드시 풀에 커넥션 반환
  }
});

module.exports = router;

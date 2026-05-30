/**
 * result.routes.js — 운동 결과 조회 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트   — Express, DB
 *   2. GET /         — 최신 운동 기록 + 현재 캐릭터 정보 통합 반환
 *
 * 역할:
 *   - 운동 완료 직후 결과 화면(Result.jsx)에 필요한 데이터를 단일 API 로 제공
 *   - 최신 workout_records 1건 + 가장 최근 생성된 characters 1건을 병렬 조회
 *
 * 응답 형식:
 *   {
 *     workout:   { exercise_key, sets, reps, total_score, calories,
 *                  perfect_count, normal_count, gained_exp },
 *     character: { character_key, level, arm_exp, chest_exp, core_exp, lower_exp }
 *   }
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
// ══════════════════════════════════════
const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/result
   Result.jsx에 필요한 최신 운동 기록 + 현재 캐릭터
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 2. GET /
//    Promise.all 로 운동 기록·캐릭터 쿼리를 병렬 실행 (응답 속도 최적화)
//    total_reps 를 gained_exp 로 alias — 결과 화면에서 획득 EXP 표시용
// ══════════════════════════════════════
router.get('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    // 최신 운동 기록과 현재 캐릭터를 병렬로 조회 (Promise.all)
    const [[workoutRows], [charRows]] = await Promise.all([
      db.query(
        `SELECT exercise_key, sets, reps, total_score, calories,
                perfect_count, normal_count, total_reps AS gained_exp
         FROM workout_records
         WHERE user_idx = ?
         ORDER BY performed_at DESC
         LIMIT 1`,
        [user_idx],
      ),
      db.query(
        `SELECT c.*, cm.character_name,
                CASE c.level
                  WHEN '1' THEN cm.lv1_max_exp
                  WHEN '2' THEN cm.lv2_max_exp
                  WHEN '3' THEN cm.lv3_max_exp
                END AS max_exp
         FROM characters c
         LEFT JOIN character_masters cm ON cm.character_key = c.character_key
         WHERE c.user_idx = ?
         ORDER BY c.created_at DESC
         LIMIT 1`,
        [user_idx],
      ),
    ]);

    // 운동 기록 또는 캐릭터가 없으면 404 반환
    if (!workoutRows.length) return res.status(404).json({ message: '운동 기록이 없습니다.' });
    if (!charRows.length)    return res.status(404).json({ message: '캐릭터를 찾을 수 없습니다.' });

    const w = workoutRows[0];  // 최신 운동 기록
    const c = charRows[0];     // 현재 캐릭터

    // 필요한 필드만 선별하여 응답 (SELECT * 결과에서 명시적으로 추출)
    res.json({
      workout: {
        exercise_key  : w.exercise_key,
        sets          : w.sets,
        reps          : w.reps,
        total_score   : w.total_score,
        calories      : w.calories,
        perfect_count : w.perfect_count,
        normal_count  : w.normal_count,
        gained_exp    : w.gained_exp,  // total_reps alias — 획득 EXP 표시용
      },
      character: {
        character_key  : c.character_key,
        level          : c.level,
        arm_exp        : c.arm_exp,
        chest_exp      : c.chest_exp,
        core_exp       : c.core_exp,
        lower_exp      : c.lower_exp,
        character_name : c.character_name,
        max_exp        : c.max_exp ?? 30,
      },
    });
  } catch (err) {
    console.error('GET /api/result 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

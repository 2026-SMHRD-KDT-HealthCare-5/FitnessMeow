/**
 * test.routes.js — 개발·테스트 전용 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트              — Express, DB, levelup 유틸
 *   2. POST /add-coins          — 코인 즉시 증가 (기본 500, 최대 100,000)
 *   3. POST /add-care-points    — 돌봄포인트 즉시 증가 (기본 5, 최대 999)
 *   4. POST /add-exp            — 경험치 즉시 증가 + 레벨업 자동 처리 (기본 5, 최대 99)
 *   5. POST /fix-unlock         — Lv3 캐릭터 다음 해금 수동 복구
 *
 * ⚠️  경고: 이 파일은 개발 편의를 위한 임시 라우터입니다.
 *          배포(프로덕션) 빌드 시 반드시 제거하거나 비활성화해야 합니다.
 *          활성화 상태로 배포하면 누구나 코인·돌봄포인트·경험치를 무제한 획득할 수 있습니다.
 *
 * 엔드포인트:
 *   POST /api/test/add-coins       — 코인 즉시 증가
 *   POST /api/test/add-care-points — 돌봄포인트 즉시 증가
 *   POST /api/test/add-exp         — 경험치 즉시 증가 (레벨업 자동 처리)
 *
 * 배포 전 제거 방법:
 *   1. app.js 에서 testRoutes require 및 app.use('/api/test', ...) 두 줄 삭제
 *   2. 이 파일 자체를 삭제
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
//    applyExpAndLevelUp: EXP 누적·레벨업·해금 공통 유틸 (levelup.cjs)
// ══════════════════════════════════════
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { applyExpAndLevelUp } = require('../utils/levelup.cjs');

/* ════════════════════════════════════════════════════════════════
   POST /api/test/add-coins
   코인(point) 증가

   body: { amount?: number }  — 기본값 500, 최대 100,000
   응답: { success, added, coins }
════════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════
// 2. POST /add-coins
//    유저 코인(point) 즉시 증가
//    amount 미입력 시 500 지급, 최대 100,000 제한
// ══════════════════════════════════════
router.post('/add-coins', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  // 최대 100,000 코인으로 제한 (어뷰징 방지)
  const amount = Math.min(Number(req.body.amount) || 500, 100_000);

  try {
    // 코인 증가
    await db.query(
      'UPDATE users SET point = point + ? WHERE user_idx = ?',
      [amount, user_idx],
    );
    // 최신 코인 잔액 반환
    const [[user]] = await db.query(
      'SELECT point FROM users WHERE user_idx = ?',
      [user_idx],
    );
    res.json({ success: true, added: amount, coins: user.point });
  } catch (err) {
    console.error('POST /api/test/add-coins 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════════════════════════
   POST /api/test/add-care-points
   돌봄포인트(care_point) 증가

   body: { amount?: number }  — 기본값 5, 최대 999
   응답: { success, added, care_point }
════════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════
// 3. POST /add-care-points
//    유저 돌봄포인트(care_point) 즉시 증가
//    amount 미입력 시 5 지급, 최대 999 제한
// ══════════════════════════════════════
router.post('/add-care-points', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  // 최대 999 포인트로 제한
  const amount = Math.min(Number(req.body.amount) || 5, 999);

  try {
    // 돌봄포인트 증가
    await db.query(
      'UPDATE users SET care_point = care_point + ? WHERE user_idx = ?',
      [amount, user_idx],
    );
    // 최신 돌봄포인트 잔액 반환
    const [[user]] = await db.query(
      'SELECT care_point FROM users WHERE user_idx = ?',
      [user_idx],
    );
    res.json({ success: true, added: amount, care_point: user.care_point });
  } catch (err) {
    console.error('POST /api/test/add-care-points 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════════════════════════
   POST /api/test/add-exp
   캐릭터 경험치 즉시 증가 (레벨업 자동 처리 포함)

   body: { amount?: number }  — 기본값 5, 최대 99
   응답: { success, added, leveled_up, character }

   동작 상세:
     1. 유저의 현재 캐릭터(level, 4개 부위 exp) 조회
     2. 4개 부위 모두에 amount 만큼 경험치 추가
     3. 평균 경험치 계산: (arm + chest + core + lower) / 4
     4. 평균 >= max_exp(현재 레벨 기준) 이고 level < 3 이면 레벨업
        - 레벨 1 증가 (ENUM '1'→'2'→'3')
        - 4개 부위 exp 모두 0으로 초기화
     5. DB 업데이트 후 최신 캐릭터 데이터 반환

   레벨별 max_exp (CHARACTER_CONFIG 기준):
     치즈코리안숏헤어: lv1=30, lv2=45, lv3=60
     러시안블루:      lv1=45, lv2=60, lv3=75
     먼치킨:          lv1=60, lv2=75, lv3=90

   Lv3은 최대 레벨이므로 경험치만 쌓이고 레벨업 없음
════════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════
// 4. POST /add-exp
//    캐릭터 경험치 즉시 증가 + 레벨업 자동 처리
//    4개 부위 모두에 동일한 amount 적용 (균등 분배)
//    applyExpAndLevelUp 에 db(풀) 전달 — 트랜잭션 없이 단독 실행
// ══════════════════════════════════════
router.post('/add-exp', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  // 1회 최대 99 — 너무 많이 추가하면 테스트 의미가 없음
  const amount = Math.min(Number(req.body.amount) || 5, 99);

  try {
    // ── Step 1: 현재 캐릭터 데이터 조회 ─────────────────────────────────
    const [[char]] = await db.query(
      `SELECT character_idx, character_key, level,
              arm_exp, chest_exp, core_exp, lower_exp
       FROM characters
       WHERE user_idx = ?
       ORDER BY created_at DESC LIMIT 1`,
      [user_idx],
    );
    if (!char) {
      return res.status(404).json({ message: '캐릭터 없음' });
    }

    // ── Step 2~4: EXP 누적·레벨업·해금 (공통 유틸) ─────────────────────
    // db(풀)을 conn 자리에 전달 — 내부적으로 conn.query 를 호출하므로 풀 사용 가능
    const { level_up, character_unlocked, next_character_name, updated_character } =
      await applyExpAndLevelUp(db, char, amount, user_idx);

    res.json({
      success:            true,
      added:              amount,
      leveled_up:         level_up,
      character_unlocked,
      next_character_name,
      character:          updated_character,
    });

  } catch (err) {
    console.error('POST /api/test/add-exp 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════════════════════════
   POST /api/test/fix-unlock
   현재 캐릭터가 Lv.3인데 다음 캐릭터가 해금 안 된 경우 수동 복구
════════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════
// 5. POST /fix-unlock
//    Lv3 캐릭터의 다음 캐릭터 해금 누락 시 수동 복구
//    이미 해금된 경우 / 다음 캐릭터가 없는 경우 → unlocked: false 반환
// ══════════════════════════════════════
router.post('/fix-unlock', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    // 현재 캐릭터(가장 최근 생성) 조회
    const [[char]] = await db.query(
      `SELECT character_key, level FROM characters
       WHERE user_idx = ? ORDER BY created_at DESC LIMIT 1`,
      [user_idx],
    );
    if (!char) return res.status(404).json({ message: '캐릭터 없음' });
    // Lv3 미달 시 해금 불필요
    if (parseInt(char.level) < 3) return res.json({ message: '아직 Lv.3 아님', unlocked: false });

    // unlock_prev_key 로 해금 가능한 다음 캐릭터 탐색
    const [[nextMaster]] = await db.query(
      'SELECT character_key, character_name FROM character_masters WHERE unlock_prev_key = ?',
      [char.character_key],
    );
    if (!nextMaster) return res.json({ message: '해금할 다음 캐릭터 없음', unlocked: false });

    // 이미 해금된 경우 중복 INSERT 방지
    const [[existing]] = await db.query(
      'SELECT character_idx FROM characters WHERE user_idx = ? AND character_key = ?',
      [user_idx, nextMaster.character_key],
    );
    if (existing) return res.json({ message: '이미 해금됨', unlocked: false });

    // 다음 캐릭터를 Lv1·EXP 0 으로 생성
    await db.query(
      `INSERT INTO characters (user_idx, character_key, level, arm_exp, chest_exp, core_exp, lower_exp)
       VALUES (?, ?, '1', 0, 0, 0, 0)`,
      [user_idx, nextMaster.character_key],
    );
    res.json({ unlocked: true, next_character: nextMaster.character_name });
  } catch (err) {
    console.error('POST /api/test/fix-unlock 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

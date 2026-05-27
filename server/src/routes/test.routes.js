/**
 * test.routes.js — 개발·테스트 전용 API 라우터
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

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { CHARACTER_CONFIG } = require('../config/characters.cjs');
const { applyExpAndLevelUp } = require('../utils/levelup.cjs');

/* ════════════════════════════════════════════════════════════════
   POST /api/test/add-coins
   코인(point) 증가

   body: { amount?: number }  — 기본값 500, 최대 100,000
   응답: { success, added, coins }
════════════════════════════════════════════════════════════════ */
router.post('/add-coins', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const amount = Math.min(Number(req.body.amount) || 500, 100_000);

  try {
    await db.query(
      'UPDATE users SET point = point + ? WHERE user_idx = ?',
      [amount, user_idx],
    );
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
router.post('/add-care-points', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const amount = Math.min(Number(req.body.amount) || 5, 999);

  try {
    await db.query(
      'UPDATE users SET care_point = care_point + ? WHERE user_idx = ?',
      [amount, user_idx],
    );
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
router.post('/fix-unlock', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [[char]] = await db.query(
      `SELECT character_key, level FROM characters
       WHERE user_idx = ? ORDER BY created_at DESC LIMIT 1`,
      [user_idx],
    );
    if (!char) return res.status(404).json({ message: '캐릭터 없음' });
    if (parseInt(char.level) < 3) return res.json({ message: '아직 Lv.3 아님', unlocked: false });

    const next_key = Object.keys(CHARACTER_CONFIG).find(key => {
      const cond = CHARACTER_CONFIG[key].unlock_condition;
      return cond?.prev_character === char.character_key && cond?.badge == null;
    });
    if (!next_key) return res.json({ message: '해금할 다음 캐릭터 없음', unlocked: false });

    const [[existing]] = await db.query(
      'SELECT character_idx FROM characters WHERE user_idx = ? AND character_key = ?',
      [user_idx, next_key],
    );
    if (existing) return res.json({ message: '이미 해금됨', unlocked: false });

    await db.query(
      `INSERT INTO characters (user_idx, character_key, level, arm_exp, chest_exp, core_exp, lower_exp)
       VALUES (?, ?, '1', 0, 0, 0, 0)`,
      [user_idx, next_key],
    );
    res.json({ unlocked: true, next_character: CHARACTER_CONFIG[next_key].character_name });
  } catch (err) {
    console.error('POST /api/test/fix-unlock 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

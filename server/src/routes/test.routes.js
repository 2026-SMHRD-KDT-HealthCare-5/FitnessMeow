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

    const currentLevel = parseInt(char.level); // ENUM '1'→1, '2'→2, '3'→3

    // ── Step 2: 경험치 추가 ──────────────────────────────────────────────
    const newArm   = char.arm_exp   + amount;
    const newChest = char.chest_exp + amount;
    const newCore  = char.core_exp  + amount;
    const newLower = char.lower_exp + amount;

    // ── Step 3: 평균 계산 + 레벨업 조건 확인 ────────────────────────────
    const avgExp = (newArm + newChest + newCore + newLower) / 4;

    // CHARACTER_CONFIG 에서 현재 레벨의 max_exp 조회
    const config  = CHARACTER_CONFIG[char.character_key];
    const maxExp  = config?.max_exp?.[`lv${currentLevel}`] ?? 30;

    // 레벨업 조건: 평균 >= max_exp 이고 최대 레벨(3)이 아닐 때
    const canLevelUp = avgExp >= maxExp && currentLevel < 3;
    let leveled_up   = false;

    let finalArm   = newArm;
    let finalChest = newChest;
    let finalCore  = newCore;
    let finalLower = newLower;
    let finalLevel = currentLevel;

    if (canLevelUp) {
      finalLevel = currentLevel + 1;
      // 레벨업 시 모든 부위 경험치 초기화 (초과분은 버림 — 단순화)
      finalArm = finalChest = finalCore = finalLower = 0;
      leveled_up = true;
    }

    // ── Step 4: DB 업데이트 ──────────────────────────────────────────────
    await db.query(
      `UPDATE characters
       SET arm_exp = ?, chest_exp = ?, core_exp = ?, lower_exp = ?, level = ?
       WHERE character_idx = ?`,
      [finalArm, finalChest, finalCore, finalLower, String(finalLevel), char.character_idx],
    );

    // ── Step 5: 업데이트된 캐릭터 데이터 구성 후 반환 ────────────────────
    const newLevelKey = `lv${finalLevel}`;
    const newMaxExp   = config?.max_exp?.[newLevelKey] ?? 30;

    res.json({
      success:   true,
      added:     amount,
      leveled_up,              // true 면 프론트에서 레벨업 연출 가능
      character: {
        character_key:  char.character_key,
        level:          String(finalLevel),
        arm_exp:        finalArm,
        chest_exp:      finalChest,
        core_exp:       finalCore,
        lower_exp:      finalLower,
        max_exp:        newMaxExp,
        character_name: config?.character_name ?? char.character_key,
      },
    });

  } catch (err) {
    console.error('POST /api/test/add-exp 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

/**
 * shop.routes.js — 상점 API 라우터
 *
 * 역할:
 *   - 전체 상점 아이템 목록 조회 (config 기반, DB 조회 불필요)
 *   - 아이템 구매: 인증 → 중복 보유 확인 → 코인 확인 → 코인 차감 → 아이템 등록
 *
 * 연관 DB 테이블:
 *   users      — point (코인) 보유 및 차감
 *   user_items — 구매 완료 아이템 기록 (user_idx, item_keyword, purchased_at, quantity)
 *
 * 중복 구매 방지 정책:
 *   - 이미 user_items 에 해당 item_keyword 가 존재하면 400 에러 반환
 *   - quantity++ 방식을 사용하지 않음 (각 아이템은 1개만 소유 가능)
 *   - 프론트에서 1차 방어 (handleCardClick early return) + 서버에서 2차 방어
 *
 * 트랜잭션 사용 이유:
 *   - 코인 차감과 아이템 등록이 반드시 함께 성공하거나 함께 실패해야 함
 *   - FOR UPDATE 락: 동시에 같은 유저가 여러 요청을 보낼 때 레이스 컨디션 방지
 */

const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { SHOP_ITEMS, PRICE_MAP } = require('../config/shopitems.cjs');

/* ════════════════════════════════════════════
   GET /api/shop/items
   전체 상점 아이템 목록 반환

   - config 파일 기반으로 즉시 응답 (DB 조회 없음)
   - 프론트에서도 직접 import해 쓰지만, 서버 API로도 제공해 두어
     외부 툴이나 관리자 대시보드에서도 목록 조회 가능하게 함
════════════════════════════════════════════ */
router.get('/items', (req, res) => {
  res.json(SHOP_ITEMS);
});

/* ════════════════════════════════════════════
   POST /api/shop/purchase
   아이템 구매 처리

   body: { item_keyword }

   처리 순서:
     1. 세션으로 로그인 확인
     2. item_keyword 존재 여부 + 가격 조회 (PRICE_MAP 사용)
     3. DB 트랜잭션 시작
     4. 유저 코인 조회 + 행 잠금 (FOR UPDATE)
     5. 이미 보유 중인지 확인 → 보유 시 400 반환 (중복 구매 차단)
     6. 코인 부족 확인 → 부족 시 400 반환
     7. 코인 차감 (users.point -= price)
     8. user_items 에 새 행 INSERT (quantity: 1)
     9. 커밋 후 최신 코인 잔액 반환 (프론트 상태 즉시 갱신용)

   성공 응답: { success: true, coins: number, item_keyword, price_paid }
════════════════════════════════════════════ */
router.post('/purchase', async (req, res) => {

  // ── 인증 확인 ────────────────────────────────────────────────────────────
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { item_keyword } = req.body;
  if (!item_keyword) {
    return res.status(400).json({ message: 'item_keyword 필요' });
  }

  // ── 아이템 가격 조회 — config에 없는 아이템이면 즉시 거절 ─────────────────
  // PRICE_MAP: { "cattower_1": 500, "toy_1": 300, ... }
  const price = PRICE_MAP[item_keyword];
  if (price == null) {
    return res.status(400).json({ message: '존재하지 않는 아이템입니다.' });
  }

  // ── DB 커넥션 획득 후 트랜잭션 시작 ──────────────────────────────────────
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Step 1: 코인 조회 + 행 잠금 (동시 요청 레이스 컨디션 방지)
    const [[user]] = await conn.query(
      'SELECT point FROM users WHERE user_idx = ? FOR UPDATE',
      [user_idx],
    );
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    // Step 2: 이미 보유 중인지 확인
    // - user_items 에 (user_idx, item_keyword) 조합이 이미 있으면 중복 구매 거절
    // - quantity 증가 방식을 쓰지 않는 이유: 이 앱에서 각 가구는 1개만 소유 가능
    const [[alreadyOwned]] = await conn.query(
      'SELECT user_item_idx FROM user_items WHERE user_idx = ? AND item_keyword = ?',
      [user_idx, item_keyword],
    );
    if (alreadyOwned) {
      await conn.rollback();
      return res.status(400).json({ message: '이미 보유한 아이템입니다.' });
    }

    // Step 3: 코인 부족 확인
    if (user.point < price) {
      await conn.rollback();
      return res.status(400).json({
        message: `코인이 부족합니다. (필요: ${price}, 보유: ${user.point})`,
      });
    }

    // Step 4: 코인 차감
    await conn.query(
      'UPDATE users SET point = point - ? WHERE user_idx = ?',
      [price, user_idx],
    );

    // Step 5: 아이템 소유 목록 등록 (quantity 항상 1 — 중복 구매 불가이므로)
    await conn.query(
      `INSERT INTO user_items (user_idx, item_keyword, purchased_at, quantity)
       VALUES (?, ?, NOW(), 1)`,
      [user_idx, item_keyword],
    );

    // 모든 작업 성공 → 커밋
    await conn.commit();

    // 커밋 후 최신 코인 잔액 조회 (프론트 coins 상태를 서버 기준으로 정확히 갱신하기 위해)
    const [[updated]] = await db.query(
      'SELECT point FROM users WHERE user_idx = ?',
      [user_idx],
    );

    res.json({
      success:    true,
      coins:      updated.point,  // 프론트 coins 상태 즉시 갱신에 사용
      item_keyword,
      price_paid: price,
    });

  } catch (err) {
    // 예외 발생 시 롤백 → 코인 차감과 아이템 등록 모두 취소
    await conn.rollback();
    console.error('POST /api/shop/purchase 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    // 성공·실패 관계없이 반드시 커넥션 반환 (커넥션 풀 고갈 방지)
    conn.release();
  }
});

module.exports = router;

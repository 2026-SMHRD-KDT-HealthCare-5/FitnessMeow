/**
 * shop.routes.js — 상점 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트          — Express, DB
 *   2. GET  /items          — 판매 중인 아이템 목록 조회 (price > 0)
 *   3. POST /purchase        — 아이템 구매 (트랜잭션: 코인 차감 + user_items INSERT)
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
// ══════════════════════════════════════
// routes/shop.routes.js — 상점 API

const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/shop/items
   판매 중인 아이템 목록 (price > 0)

   price = 0 인 아이템은 기본 지급 아이템이므로 상점에서 제외
   category, price 순으로 정렬하여 프론트 그룹핑 용이하게 반환
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 2. GET /items
//    price > 0 인 아이템만 category·price 순으로 반환
//    price = 0 은 기본 지급 아이템이므로 제외
// ══════════════════════════════════════
router.get('/items', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT item_keyword, item_name, category, price, icon_name, size_w, size_h
       FROM items
       WHERE price > 0
       ORDER BY category, price`,
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/shop/items 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════
   POST /api/shop/purchase
   아이템 구매

   body: { item_keyword }
   처리 순서:
     1. 세션 인증
     2. items 테이블에서 가격 조회 (없으면 400)
     3. 트랜잭션: 코인 조회(FOR UPDATE) → 중복 확인 → 코인 확인 → 차감 → INSERT
     4. 최신 코인 잔액 반환
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 3. POST /purchase
//    아이템 구매 처리 (트랜잭션으로 원자성 보장)
//    FOR UPDATE 로 코인 행 잠금 → 동시 구매 시 이중 차감 방지
// ══════════════════════════════════════
router.post('/purchase', async (req, res) => {
  // 세션 인증: 로그인하지 않은 요청 차단
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { item_keyword } = req.body;
  if (!item_keyword) return res.status(400).json({ message: 'item_keyword 필요' });

  // 가격 조회 — DB에 없는 아이템은 즉시 거절
  const [[item]] = await db.query(
    'SELECT price FROM items WHERE item_keyword = ?',
    [item_keyword],
  );
  if (!item) return res.status(400).json({ message: '존재하지 않는 아이템입니다.' });

  const price = item.price;

  // 트랜잭션용 개별 커넥션 획득
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 코인 조회 + 행 잠금 (동시 요청 시 선점 처리)
    const [[user]] = await conn.query(
      'SELECT point FROM users WHERE user_idx = ? FOR UPDATE',
      [user_idx],
    );
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    // 중복 구매 확인 (동일 아이템 재구매 방지)
    const [[alreadyOwned]] = await conn.query(
      'SELECT user_item_idx FROM user_items WHERE user_idx = ? AND item_keyword = ?',
      [user_idx, item_keyword],
    );
    if (alreadyOwned) {
      await conn.rollback();
      return res.status(400).json({ message: '이미 보유한 아이템입니다.' });
    }

    // 코인 부족 확인
    if (user.point < price) {
      await conn.rollback();
      return res.status(400).json({
        message: `코인이 부족합니다. (필요: ${price}, 보유: ${user.point})`,
      });
    }

    // 코인 차감
    await conn.query(
      'UPDATE users SET point = point - ? WHERE user_idx = ?',
      [price, user_idx],
    );

    // 아이템 등록 (user_items INSERT)
    await conn.query(
      `INSERT INTO user_items (user_idx, item_keyword, purchased_at, quantity)
       VALUES (?, ?, NOW(), 1)`,
      [user_idx, item_keyword],
    );

    await conn.commit();

    // 커밋 후 최신 코인 잔액 반환 (풀 커넥션으로 재조회)
    const [[updated]] = await db.query(
      'SELECT point FROM users WHERE user_idx = ?',
      [user_idx],
    );

    res.json({ success: true, coins: updated.point, item_keyword, price_paid: price });

  } catch (err) {
    await conn.rollback();
    console.error('POST /api/shop/purchase 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    conn.release(); // 반드시 풀에 커넥션 반환
  }
});

module.exports = router;

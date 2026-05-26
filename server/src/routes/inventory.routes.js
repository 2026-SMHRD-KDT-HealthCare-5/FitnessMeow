/**
 * inventory.routes.js — 인벤토리 API 라우터
 *
 * 역할:
 *   - 유저가 상점에서 구매한 아이템 목록과 방 배치 좌표를 함께 반환
 *   - 프론트의 두 가지 상태(ownedItems, placedFurniture)를 단일 API 호출로 초기화
 *
 * DB 테이블:
 *   user_items  — 구매 아이템 목록 (item_keyword, quantity)
 *   coordinates — 방에 배치된 가구 좌표 (pos_x, pos_y)
 *
 * 응답 형식:
 *   [
 *     { item_keyword: "cattower_1", quantity: 1, x_pos: 320, y_pos: 240 }, // 배치 중
 *     { item_keyword: "bed_1",      quantity: 1, x_pos: null, y_pos: null } // 미배치
 *   ]
 *
 * LEFT JOIN 사용 이유:
 *   - user_items 에 있지만 coordinates 에 없는 아이템(미배치 가구)도 반환해야 함
 *   - INNER JOIN 이면 배치 안 된 가구가 응답에서 빠져버림
 *
 * 프론트 활용 방법:
 *   - x_pos/y_pos 가 null 인 항목 → ownedItems 에만 추가 (인벤토리 패널 표시용)
 *   - x_pos/y_pos 가 null 이 아닌 항목 → placedFurniture 에도 추가 (캔버스 렌더링용)
 *   → MainLobby.jsx fetchInventory 함수에서 filter 로 분리
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/inventory
   유저 소유 아이템 + 방 배치 좌표 통합 반환

   응답 예시:
   [
     { item_keyword: "cattower_1", quantity: 1, x_pos: 320, y_pos: 240 },
     { item_keyword: "toy_1",      quantity: 1, x_pos: null, y_pos: null }
   ]
════════════════════════════════════════════ */
router.get('/', async (req, res) => {
  // 세션에서 로그인 유저 식별
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [rows] = await db.query(
      `SELECT
         ui.item_keyword,              -- 아이템 고유 키 (예: "cattower_1")
         ui.quantity,                  -- 보유 수량 (현재 정책상 항상 1)
         c.pos_x AS x_pos,            -- 배치 X 좌표 (미배치면 NULL)
         c.pos_y AS y_pos             -- 배치 Y 좌표 (미배치면 NULL)
       FROM user_items ui
       -- 배치 좌표가 없는 아이템도 포함하기 위해 LEFT JOIN 사용
       LEFT JOIN coordinates c
         ON  c.user_idx     = ui.user_idx
         AND c.item_keyword = ui.item_keyword
       WHERE ui.user_idx = ?`,
      [user_idx],
    );

    res.json(rows);

  } catch (err) {
    console.error('GET /api/inventory 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

/**
 * coordinates.routes.js — 가구 배치 좌표 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트        — Express, DB
 *   2. GET  /cats        — 배치된 고양이 좌표 목록 반환
 *   3. GET  /            — 배치된 가구 좌표 목록 반환
 *   4. POST /            — 좌표 저장 (없으면 INSERT, 있으면 UPDATE)
 *   5. DELETE /:item_keyword — 배치 해제 (좌표 행 삭제)
 *
 * 역할:
 *   - 유저 방(MyRoom)에 배치된 가구의 좌표를 저장·조회·삭제
 *   - PixiJS 캔버스에서 드래그로 가구를 옮기거나, 인벤토리에서 배치/해제할 때 호출됨
 *
 * DB 테이블: coordinates
 *   컬럼: coord_idx (PK), user_idx (FK), item_keyword, pos_x, pos_y
 *
 * ⚠️  네이밍 주의:
 *   - DB 컬럼: pos_x, pos_y
 *   - API 요청/응답: x_pos, y_pos  (프론트 placedFurniture 배열 형식과 맞춤)
 *   - SELECT 시 SQL alias 로 변환: pos_x AS x_pos, pos_y AS y_pos
 *
 * UNIQUE 제약 없음:
 *   - coordinates 테이블에 (user_idx, item_keyword) 복합 유니크 제약이 없음
 *   - 따라서 ON DUPLICATE KEY UPDATE 를 쓸 수 없음
 *   - 대신 SELECT → 존재하면 UPDATE, 없으면 INSERT 방식 사용
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
// ══════════════════════════════════════
const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/coordinates
   유저 방에 배치된 가구 좌표 목록 반환

   응답 예시:
   [
     { item_keyword: "cattower_1", x_pos: 320, y_pos: 240 },
     { item_keyword: "bed_1",      x_pos: 150, y_pos: 350 }
   ]

   * 현재는 /api/inventory 에서 user_items JOIN coordinates 로 통합 제공하므로
     이 엔드포인트는 직접 호출되지 않을 수 있음 (하지만 별도 조회가 필요한 경우 사용)
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 2. GET /cats
//    item_keyword 가 'cat_' 로 시작하는 행만 반환 — 방에 배치된 고양이 좌표
//    고양이는 user_items 에 없으므로 inventory API 대신 이 엔드포인트로 조회
// ══════════════════════════════════════
router.get('/cats', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [rows] = await db.query(
      `SELECT item_keyword AS cat_key,
              pos_x  AS x_pos,
              pos_y  AS y_pos,
              z_order
       FROM coordinates
       WHERE user_idx = ? AND item_keyword LIKE 'cat\\_%'`,
      [user_idx],
    );
    // cat_key → character_key + level 분리 (cat_{character_key}_lv{level})
    const result = rows.map(r => {
      const withoutPrefix = r.cat_key.replace(/^cat_/, '');           // 'cheese_..._lv2'
      const lvMatch       = withoutPrefix.match(/_lv(\d+)$/);        // match '_lv2'
      const level         = lvMatch ? Number(lvMatch[1]) : 1;
      const character_key = withoutPrefix.replace(/_lv\d+$/, '');    // 'cheese_...'
      return { cat_key: r.cat_key, character_key, level, x_pos: r.x_pos, y_pos: r.y_pos, z_order: r.z_order ?? 10 };
    });
    res.json(result);
  } catch (err) {
    console.error('GET /api/coordinates/cats 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ══════════════════════════════════════
// 3. GET /
//    유저 방에 배치된 가구 좌표 목록 반환
//    pos_x/pos_y → x_pos/y_pos alias (프론트 형식 일치)
//    ※ /api/inventory 로 통합 조회 가능하므로 직접 호출 빈도 낮을 수 있음
// ══════════════════════════════════════
router.get('/', async (req, res) => {
  // 세션에서 로그인 유저 식별
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    // pos_x/pos_y → x_pos/y_pos 로 alias (프론트 placedFurniture 형식에 맞춤)
    const [rows] = await db.query(
      `SELECT item_keyword,
              pos_x AS x_pos,
              pos_y AS y_pos
       FROM coordinates
       WHERE user_idx = ?`,
      [user_idx],
    );
    res.json(rows);

  } catch (err) {
    console.error('GET /api/coordinates 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════
   POST /api/coordinates
   가구 좌표 저장 (없으면 INSERT, 있으면 UPDATE)

   body: { item_keyword, x_pos, y_pos }

   호출 시점:
     - PixiJS 캔버스에서 가구를 드래그로 이동 완료했을 때 (handleFurnitureMove)
     - 인벤토리 패널에서 가구를 처음 배치할 때 (handleToggleFurniture)

   UNIQUE 제약이 없어서 ON DUPLICATE KEY UPDATE 불가
   → SELECT 로 기존 행 확인 후 UPDATE 또는 INSERT 분기 처리
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 3. POST /
//    가구 좌표 저장 (upsert 패턴)
//    기존 행 SELECT → UPDATE or INSERT 분기
//    x_pos, y_pos 는 0이 유효값이므로 != null 로 체크
// ══════════════════════════════════════
router.post('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { item_keyword, x_pos, y_pos } = req.body;

  // 필수 파라미터 확인 (x_pos, y_pos 는 0이 유효하므로 != null 로 체크)
  if (!item_keyword || x_pos == null || y_pos == null) {
    return res.status(400).json({ message: '필수 파라미터 누락 (item_keyword, x_pos, y_pos)' });
  }

  try {
    // 기존 좌표 행이 있는지 확인
    const [[existing]] = await db.query(
      'SELECT coord_idx FROM coordinates WHERE user_idx = ? AND item_keyword = ?',
      [user_idx, item_keyword],
    );

    if (existing) {
      // 이미 배치된 가구 → 좌표만 업데이트 (드래그 이동)
      await db.query(
        'UPDATE coordinates SET pos_x = ?, pos_y = ? WHERE coord_idx = ?',
        [x_pos, y_pos, existing.coord_idx],
      );
    } else {
      // 새로 배치하는 가구 → 행 삽입
      await db.query(
        'INSERT INTO coordinates (user_idx, item_keyword, pos_x, pos_y) VALUES (?, ?, ?, ?)',
        [user_idx, item_keyword, x_pos, y_pos],
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error('POST /api/coordinates 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════
   PATCH /api/coordinates/z-order
   여러 아이템의 z_order 일괄 업데이트

   body: [{ item_keyword, z_order }, ...]
════════════════════════════════════════════ */
router.patch('/z-order', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items 배열 필요' });
  }

  try {
    await Promise.all(
      items.map(({ item_keyword, z_order }) =>
        db.query(
          'UPDATE coordinates SET z_order = ? WHERE user_idx = ? AND item_keyword = ?',
          [z_order, user_idx, item_keyword],
        ),
      ),
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/coordinates/z-order 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════
   DELETE /api/coordinates/:item_keyword
   가구를 방에서 제거 (좌표 행 삭제)

   호출 시점:
     - 인벤토리 패널에서 배치 중인 가구를 다시 클릭해 "해제"할 때 (handleToggleFurniture)
     - 가구를 제거하면 MyRoom 캔버스에서도 스프라이트가 사라짐 (placedFurniture 상태 갱신으로 자동 처리)
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 4. DELETE /:item_keyword
//    해당 유저의 특정 가구 좌표 행 삭제 (다른 유저 데이터 영향 없음)
//    삭제 후 프론트에서 placedFurniture 상태를 갱신하여 캔버스에서 스프라이트 제거
// ══════════════════════════════════════
router.delete('/:item_keyword', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { item_keyword } = req.params;

  try {
    // 해당 유저의 해당 가구 좌표 행만 삭제 (다른 유저 데이터 영향 없음)
    await db.query(
      'DELETE FROM coordinates WHERE user_idx = ? AND item_keyword = ?',
      [user_idx, item_keyword],
    );
    res.json({ success: true });

  } catch (err) {
    console.error('DELETE /api/coordinates 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

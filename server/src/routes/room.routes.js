/**
 * room.routes.js — 방 배경 테마 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트        — Express, DB
 *   2. GET  /theme        — 현재 선택된 벽지·타일 키 반환
 *   3. PATCH /theme       — 벽지 또는 타일 변경 (보유 확인 후 적용)
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
// ══════════════════════════════════════
// routes/room.routes.js — 방 배경 테마 (벽지·타일) 조회 및 변경

const express = require('express');
const router  = express.Router();
const db      = require('../db');

/* ════════════════════════════════════════════
   GET /api/room/theme
   현재 선택된 벽지·타일 키 반환
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 2. GET /theme
//    users 테이블의 wallpaper_key·tile_key 반환
//    값이 없으면 기본값(wallpaper_1, tile_1) 사용
// ══════════════════════════════════════
router.get('/theme', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    // users 테이블에서 현재 선택된 테마 키 조회
    const [[row]] = await db.query(
      'SELECT wallpaper_key, tile_key FROM users WHERE user_idx = ?',
      [user_idx],
    );
    res.json({
      wallpaper_key: row?.wallpaper_key ?? 'wallpaper_1',  // 기본 벽지
      tile_key:      row?.tile_key      ?? 'tile_1',        // 기본 타일
    });
  } catch (err) {
    console.error('GET /api/room/theme 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════
   PATCH /api/room/theme
   벽지 또는 타일 변경 — user_items 보유 확인 후 적용
════════════════════════════════════════════ */

// ══════════════════════════════════════
// 3. PATCH /theme
//    body 에 wallpaper_key 또는 tile_key (둘 중 하나 이상 필수)
//    변경 전 user_items 에서 보유 여부 확인 (미보유 시 403)
//    동적 SET 절 생성으로 한 번의 쿼리로 한쪽 또는 양쪽 동시 변경 가능
// ══════════════════════════════════════
router.patch('/theme', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { wallpaper_key, tile_key } = req.body;
  // 벽지·타일 중 최소 하나는 있어야 함
  if (!wallpaper_key && !tile_key) {
    return res.status(400).json({ message: 'wallpaper_key 또는 tile_key 필요' });
  }

  try {
    // 벽지 변경 요청 시 보유 여부 확인
    if (wallpaper_key) {
      const [[owned]] = await db.query(
        'SELECT user_item_idx FROM user_items WHERE user_idx = ? AND item_keyword = ?',
        [user_idx, wallpaper_key],
      );
      if (!owned) return res.status(403).json({ message: '보유하지 않은 아이템입니다.' });
    }
    // 타일 변경 요청 시 보유 여부 확인
    if (tile_key) {
      const [[owned]] = await db.query(
        'SELECT user_item_idx FROM user_items WHERE user_idx = ? AND item_keyword = ?',
        [user_idx, tile_key],
      );
      if (!owned) return res.status(403).json({ message: '보유하지 않은 아이템입니다.' });
    }

    // 동적 SET 절 생성: 전달된 키만 업데이트
    const fields = [];
    const values = [];
    if (wallpaper_key) { fields.push('wallpaper_key = ?'); values.push(wallpaper_key); }
    if (tile_key)      { fields.push('tile_key = ?');      values.push(tile_key); }
    values.push(user_idx);

    // 한 번의 쿼리로 벽지·타일 한쪽 또는 양쪽 동시 업데이트
    await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_idx = ?`,
      values,
    );

    res.json({ success: true, wallpaper_key, tile_key });
  } catch (err) {
    console.error('PATCH /api/room/theme 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

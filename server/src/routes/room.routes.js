// routes/room.routes.js — 방 배경 테마 (벽지·타일) 조회 및 변경

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// 기본 제공 아이템 — 구매 없이 누구나 적용 가능
const DEFAULT_BG_KEYS = ['wallpaper_1', 'tile_1'];

/* ════════════════════════════════════════════
   GET /api/room/theme
   현재 선택된 벽지·타일 키 반환
════════════════════════════════════════════ */
router.get('/theme', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [[row]] = await db.query(
      'SELECT wallpaper_key, tile_key FROM users WHERE user_idx = ?',
      [user_idx],
    );
    res.json({
      wallpaper_key: row?.wallpaper_key ?? 'wallpaper_cream',
      tile_key:      row?.tile_key      ?? 'tile_wood',
    });
  } catch (err) {
    console.error('GET /api/room/theme 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════
   PATCH /api/room/theme
   벽지 또는 타일 변경

   body: { wallpaper_key? } | { tile_key? }
   - 기본 아이템(wallpaper_cream, tile_wood)은 소유 확인 생략
   - 그 외 아이템은 user_items 보유 여부 확인
════════════════════════════════════════════ */
router.patch('/theme', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { wallpaper_key, tile_key } = req.body;
  if (!wallpaper_key && !tile_key) {
    return res.status(400).json({ message: 'wallpaper_key 또는 tile_key 필요' });
  }

  try {
    // 기본 아이템이 아닌 경우 소유 확인
    if (wallpaper_key && !DEFAULT_BG_KEYS.includes(wallpaper_key)) {
      const [[owned]] = await db.query(
        'SELECT user_item_idx FROM user_items WHERE user_idx = ? AND item_keyword = ?',
        [user_idx, wallpaper_key],
      );
      if (!owned) return res.status(403).json({ message: '보유하지 않은 아이템입니다.' });
    }
    if (tile_key && !DEFAULT_BG_KEYS.includes(tile_key)) {
      const [[owned]] = await db.query(
        'SELECT user_item_idx FROM user_items WHERE user_idx = ? AND item_keyword = ?',
        [user_idx, tile_key],
      );
      if (!owned) return res.status(403).json({ message: '보유하지 않은 아이템입니다.' });
    }

    // 변경할 필드만 동적으로 UPDATE
    const fields = [];
    const values = [];
    if (wallpaper_key) { fields.push('wallpaper_key = ?'); values.push(wallpaper_key); }
    if (tile_key)      { fields.push('tile_key = ?');      values.push(tile_key); }
    values.push(user_idx);

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

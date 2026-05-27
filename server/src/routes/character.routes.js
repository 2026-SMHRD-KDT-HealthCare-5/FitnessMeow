// routes/character.routes.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { CHARACTER_CONFIG } = require('../config/characters.cjs');

router.get('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [rows] = await db.query(
      `SELECT character_key, level, arm_exp, chest_exp, core_exp, lower_exp
       FROM characters
       WHERE user_idx = ?
       ORDER BY created_at DESC LIMIT 1`,
      [user_idx],
    );

    if (!rows.length) return res.status(404).json({ message: '캐릭터 없음' });

    const char     = rows[0];
    const config   = CHARACTER_CONFIG[char.character_key];
    const levelKey = `lv${char.level}`;

    // ── Lv3 자동 해금 체크 ───────────────────────────────────────────
    // 현재 캐릭터가 Lv3인데 다음 캐릭터가 없으면 자동 생성
    if (Number(char.level) === 3) {
      const next_key = Object.keys(CHARACTER_CONFIG).find(key => {
        const cond = CHARACTER_CONFIG[key].unlock_condition;
        return cond?.prev_character === char.character_key && cond?.badge == null;
      });
      if (next_key) {
        const [[existing]] = await db.query(
          'SELECT character_idx FROM characters WHERE user_idx = ? AND character_key = ?',
          [user_idx, next_key],
        );
        if (!existing) {
          await db.query(
            `INSERT INTO characters
               (user_idx, character_key, level, arm_exp, chest_exp, core_exp, lower_exp)
             VALUES (?, ?, '1', 0, 0, 0, 0)`,
            [user_idx, next_key],
          );
        }
      }
    }
    // ────────────────────────────────────────────────────────────────

    res.json({
      ...char,
      max_exp:        config?.max_exp?.[levelKey] ?? 30,
      character_name: config?.character_name      ?? char.character_key,
    });
  } catch (err) {
    console.error('GET /api/character 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
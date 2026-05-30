/**
 * character.routes.js — 캐릭터 조회 API 라우터
 *
 * 목차:
 *   1. 모듈 임포트        — Express, DB
 *   2. GET /all           — 해금된 모든 캐릭터 목록 반환
 *   3. GET /              — 현재(최신) 캐릭터 상세 정보 반환
 */

// ══════════════════════════════════════
// 1. 모듈 임포트
// ══════════════════════════════════════
// routes/character.routes.js

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ══════════════════════════════════════
// 2. GET /all
//    유저가 보유한 모든 캐릭터 목록 반환
//    character_masters 와 LEFT JOIN 하여 캐릭터 이름 포함
//    생성일 오름차순 정렬 (첫 번째 캐릭터가 맨 앞)
// ══════════════════════════════════════
/* ── GET /api/character/all — 해금된 모든 고양이 목록 ── */
router.get('/all', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });
  try {
    const [rows] = await db.query(
      `SELECT c.character_key, c.level, cm.character_name
       FROM characters c
       LEFT JOIN character_masters cm ON cm.character_key = c.character_key
       WHERE c.user_idx = ?
       ORDER BY c.created_at ASC`,
      [user_idx],
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/character/all 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ══════════════════════════════════════
// 3. GET /
//    현재 활성 캐릭터(가장 최근 생성) 상세 정보 반환
//    character_masters 에서 이름 + 레벨별 max_exp 조회
// ══════════════════════════════════════
/* ── GET /api/character — 현재(최신) 캐릭터 ── */
router.get('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    // 가장 최근에 생성된 캐릭터를 현재 캐릭터로 사용
    const [rows] = await db.query(
      `SELECT character_key, level, arm_exp, chest_exp, core_exp, lower_exp
       FROM characters
       WHERE user_idx = ?
       ORDER BY created_at DESC LIMIT 1`,
      [user_idx],
    );

    if (!rows.length) return res.status(404).json({ message: '캐릭터 없음' });

    const char = rows[0];

    // character_masters 에서 이름 + max_exp 조회
    const [[master]] = await db.query(
      `SELECT character_name, lv1_max_exp, lv2_max_exp, lv3_max_exp
       FROM character_masters
       WHERE character_key = ?`,
      [char.character_key],
    );

    // 현재 레벨에 해당하는 max_exp 키 선택 (예: lv2_max_exp)
    const levelKey = `lv${char.level}_max_exp`;

    res.json({
      ...char,
      max_exp:        master?.[levelKey]     ?? 30,
      character_name: master?.character_name ?? char.character_key,
    });
  } catch (err) {
    console.error('GET /api/character 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

// routes/care.routes.js
// 돌봄 시스템: 돌봄포인트 조회 / 돌봄 행동 수행
const express = require('express');
const router  = express.Router();
const db      = require('../db');

const VALID_TYPES  = new Set(['feed', 'groom', 'clean']);
const COIN_REWARD  = 50;

function todayDate() {
  return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

/* ════════════════════════════════════════════
   GET /api/care/status
   오늘 돌봄 현황 + 보유 돌봄포인트 반환
════════════════════════════════════════════ */
router.get('/status', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const today = todayDate();

    // 보유 돌봄포인트 + 코인
    const [[user]] = await db.query(
      'SELECT care_point, point FROM users WHERE user_idx = ?',
      [user_idx],
    );

    // 오늘 완료한 돌봄 종류 목록
    const [logs] = await db.query(
      'SELECT care_type FROM care_logs WHERE user_idx = ? AND care_date = ?',
      [user_idx, today],
    );

    const doneTypes = new Set(logs.map(r => r.care_type));

    res.json({
      care_point:   user?.care_point ?? 0,
      coins:        user?.point      ?? 0,
      today_status: {
        feed_done:  doneTypes.has('feed'),
        groom_done: doneTypes.has('groom'),
        clean_done: doneTypes.has('clean'),
      },
    });
  } catch (err) {
    console.error('GET /api/care/status 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

/* ════════════════════════════════════════════
   POST /api/care/action
   돌봄 행동 수행 (feed / groom / clean)
   body: { action_type: 'feed' | 'groom' | 'clean' }
════════════════════════════════════════════ */
router.post('/action', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  const { action_type } = req.body;
  if (!VALID_TYPES.has(action_type)) {
    return res.status(400).json({ message: '유효하지 않은 돌봄 행동' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const today = todayDate();

    // 보유 포인트 확인 (락)
    const [[user]] = await conn.query(
      'SELECT care_point FROM users WHERE user_idx = ? FOR UPDATE',
      [user_idx],
    );
    if (!user || user.care_point < 1) {
      await conn.rollback();
      return res.status(400).json({ message: '돌봄포인트가 부족합니다.' });
    }

    // 오늘 이미 수행했는지 확인
    const [[existing]] = await conn.query(
      'SELECT care_idx FROM care_logs WHERE user_idx = ? AND care_type = ? AND care_date = ?',
      [user_idx, action_type, today],
    );
    if (existing) {
      await conn.rollback();
      return res.status(400).json({ message: '오늘 이미 수행한 돌봄입니다.' });
    }

    // 돌봄포인트 차감 + 코인 지급
    await conn.query(
      'UPDATE users SET care_point = care_point - 1, point = point + ? WHERE user_idx = ?',
      [COIN_REWARD, user_idx],
    );

    // 돌봄 로그 기록
    await conn.query(
      'INSERT INTO care_logs (user_idx, care_type, care_date, reward_point) VALUES (?, ?, ?, ?)',
      [user_idx, action_type, today, COIN_REWARD],
    );

    await conn.commit();

    // 최신 값 반환
    const [[updated]] = await db.query(
      'SELECT care_point, point FROM users WHERE user_idx = ?',
      [user_idx],
    );

    res.json({
      success:      true,
      care_point:   updated.care_point,
      coins:        updated.point,
      coin_earned:  COIN_REWARD,
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/care/action 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    conn.release();
  }
});

module.exports = router;

// routes/character.routes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

router.get('/', async (req, res) => {
  const user_idx = req.session.user?.user_idx;
  if (!user_idx) return res.status(401).json({ message: '로그인 필요' });

  try {
    const [rows] = await db.query(
      `SELECT character_name, level, arm_exp, chest_exp, core_exp, lower_exp
       FROM characters 
       WHERE user_idx = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [user_idx]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/character 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const router = express.Router();

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '1234',
  database: 'LocalFM',
});

function calcBmi(weight, height) {
  const h = height / 100;
  return parseFloat((weight / (h * h)).toFixed(2));
}

// ✅ 회원가입
router.post('/register', async (req, res) => {
  try {
    const { id, name, email, password, weight, height } = req.body;

    if (!id || !name || !email || !password || !weight || !height) {
      return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const bmi = calcBmi(parseFloat(weight), parseFloat(height));

    await db.query(
      `INSERT INTO users (id, name, email, password_hash, weight, height, bmi)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, password_hash, weight, height, bmi]
    );

    res.status(201).json({ success: true, message: '회원가입 완료!' });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: '이미 사용 중인 아이디 또는 이메일입니다.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 로그인
router.post('/login', async (req, res) => {
  try {
    const { id, password } = req.body;

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }

    req.session.user = {
      user_idx: user.user_idx,
      id: user.id,
      name: user.name,
    };

    res.json({
      success: true,
      message: '로그인 성공!',
      data: { user_idx: user.user_idx, name: user.name, point: user.point },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 로그아웃
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: '로그아웃 완료' });
  });
});

// ✅ 내 정보
router.get('/me', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const [rows] = await db.query(
      'SELECT user_idx, id, name, email, weight, height, bmi, point FROM users WHERE user_idx = ?',
      [req.session.user.user_idx]
    );

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
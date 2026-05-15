const express = require('express');
const cors = require('cors');
const session = require('express-session');

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
}));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: '서버 작동 중 ' });
});

module.exports = app;
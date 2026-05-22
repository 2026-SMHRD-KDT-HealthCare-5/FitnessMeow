const express = require('express');
const cors = require('cors');
const session = require('express-session');


const authRoutes = require('./routes/auth.routes');
const workoutRoutes= require('./routes/workout.routes');
const characterRoutes=require('./routes/character.routes');
const resultRoutes = require('./routes/result.routes');




const app = express();

app.use(express.json()); // ← 이거 추가

app.use(cors({
  origin: process.env.CLIENT_URL, //허용할 주소
  credentials: true, //쿠키 허용
}));

app.use(session({
  secret: process.env.SESSION_SECRET, //세션 암호와키
  resave: false,// 변경 없으면 저장 x
  saveUninitialized: false, // 빈 세션 저장x
  cookie: {
    httpOnly: true, //js 에서 쿠키 접근 차단
    secure: false, //https만 허용 (개발중이라서 false 해놓음, 배포할때는 true로 바꿀것)
    sameSite: 'lax', // 다른 사이트에서 쿠키 사용 차단
    maxAge: 1000 * 60 * 60 * 24, //24시간
  },
}));

app.use('/api/auth', authRoutes); //라우터 연결
app.use('/api/workouts', workoutRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/result', resultRoutes);


app.get('/', (req, res) => {
  res.json({ message: '서버 작동 중 ' });
});

module.exports = app;
require('dotenv').config();
console.log(process.env.DB_HOST);
console.log(process.env.DB_USER);
console.log(process.env.DB_NAME);
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ 서버 실행: http://localhost:${PORT}`);
});
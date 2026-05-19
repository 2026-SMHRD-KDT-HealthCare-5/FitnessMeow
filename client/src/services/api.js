import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",   // 백엔드 서버 주소
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,              // express-session 쿠키 전달용 (필수!)
});

export default api;
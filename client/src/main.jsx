import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// 세션 만료(401) 시 자동으로 로그인 페이지로 이동
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // 이미 로그인 페이지면 리디렉션 루프 방지
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(err);
  }
);

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
     <App />
  </BrowserRouter>
)
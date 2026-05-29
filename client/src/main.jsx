/**
 * main.jsx — 앱 진입점 (Entry Point)
 *
 * 목차:
 *   1. axios 인터셉터 — 401 응답 시 자동 로그인 페이지 리다이렉트
 *   2. 앱 마운트      — BrowserRouter로 감싼 App 컴포넌트를 #root에 렌더
 *
 * 역할:
 *   - React DOM 마운트 (createRoot)
 *   - BrowserRouter로 라우팅 컨텍스트 제공
 *   - axios 전역 인터셉터로 세션 만료 자동 처리
 *
 * 비고:
 *   StrictMode는 개발 모드에서 사이드 이펙트를 두 번 실행하여
 *   잠재적 문제를 조기 발견하도록 돕는 React 내장 도구
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'

// ══════════════════════════════════════
// 1. axios 인터셉터
//    모든 axios 응답을 가로채 401 세션 만료 시 자동으로 /login 이동
// ══════════════════════════════════════

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

// ══════════════════════════════════════
// 2. 앱 마운트
//    BrowserRouter로 감싼 App을 #root DOM 노드에 렌더
// ══════════════════════════════════════

// HTML의 <div id="root"> 에 React 앱 마운트
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
     <App />
  </BrowserRouter>
)

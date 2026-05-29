/**
 * Login.jsx — 로그인 페이지
 *
 * 목차:
 *   1. 상수 및 임포트   — API URL 환경변수 설정
 *   2. 상태 선언        — 아이디·비밀번호 입력값, 에러 메시지
 *   3. 로그인 핸들러    — POST /api/auth/login 호출 후 메인 로비로 이동
 *   4. 렌더             — 로고·입력 폼·로그인 버튼·회원가입 링크·비밀번호 찾기
 */

import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/Login.css";
import logoimg from "../assets/logo.png";
import { Link } from 'react-router-dom';

// ══════════════════════════════════════
// 1. 상수 및 임포트
//    서버 주소: .env 에 VITE_API_URL 이 있으면 사용, 없으면 로컬 3001포트
// ══════════════════════════════════════

// API 서버 기본 주소
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const Login = () => {
  // ══════════════════════════════════════
  // 2. 상태 선언
  //    입력 폼 값 및 서버 에러 메시지 관리
  // ══════════════════════════════════════

  const [id, setId] = useState('');           // 아이디 입력값
  const [password, setPassword] = useState(''); // 비밀번호 입력값
  const [error, setError] = useState('');       // 로그인 실패 시 에러 메시지
  const navigate = useNavigate();

  // ══════════════════════════════════════
  // 3. 로그인 핸들러
  //    POST /api/auth/login 호출 → 성공 시 메인 로비로 이동, 실패 시 에러 표시
  // ══════════════════════════════════════

  // 로그인 버튼 클릭 시 실행 — fetch로 세션 쿠키 포함 로그인 요청
  async function handleLogin() {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      // 로그인 성공 후 메인 페이지로 이동
       navigate('/mainlobby');

    } catch (err) {
      setError('서버에 연결할 수 없어요.');
    }
  }

  // ══════════════════════════════════════
  // 4. 렌더
  //    로고 → 에러 메시지 → 입력 필드 → 로그인 버튼 → 회원가입 링크 → 비밀번호 찾기
  // ══════════════════════════════════════
  return (
    <div className="container">
      <div className="overlay"></div>
      <div className="login-card">
        {/* 앱 로고 이미지 */}
        <img src={logoimg} alt="Logo" className="logo" />
        {/* <h1>피트니스냥</h1> */}
        <p className="sub-text">운동하고 고양이를 키워보세요 🐾</p>

        {/* 서버 에러 메시지 (로그인 실패 시 표시) */}
         {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* 아이디 입력 필드 */}
        <input type="text"
        placeholder="아이디 입력"
        value={id}
        onChange={(e)=>setId(e.target.value)}
        />
        {/* 비밀번호 입력 필드 */}
        <input type="password"
         placeholder="비밀번호 입력"
         value={password}
         onChange={(e)=>setPassword(e.target.value)}
         />

        {/* 로그인 버튼 */}
        <button className="login-btn" onClick={handleLogin}>로그인</button>

        {/* 또는 구분선 추가 */}
        <div className="divider">
          <span>-----------------------------또는-----------------------------</span>
        </div>

        {/* 큰 회원가입 버튼 추가 */}
        <Link to="/register" className="signup-btn">회원가입</Link>

        {/* 하단 메뉴 수정 (비밀번호 찾기 등) */}
        <div className="bottom-menu">
          <span>비밀번호 찾기</span>
        </div>
      </div>
    </div>
  );
}

export default Login;

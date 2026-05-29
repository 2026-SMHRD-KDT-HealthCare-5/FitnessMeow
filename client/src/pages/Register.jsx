/**
 * Register.jsx — 회원가입 페이지
 *
 * 목차:
 *   1. 상수 및 임포트   — API URL 환경변수 설정
 *   2. 상태 선언        — 폼 필드(아이디·비밀번호·이름·이메일·체중·키) 및 에러 메시지
 *   3. 입력 핸들러      — 폼 필드 일괄 관리 (name 속성 기반 동적 업데이트)
 *   4. 회원가입 핸들러  — 비밀번호 확인 검증 → POST /api/auth/register → 로그인 페이지 이동
 *   5. 렌더             — 로고·입력 필드 7개·에러 메시지·가입 버튼·로그인 링크
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../css/Register.css";
import logoImg from "../assets/logo.png";

// ══════════════════════════════════════
// 1. 상수 및 임포트
//    서버 주소: .env 에 VITE_API_URL 이 있으면 사용, 없으면 로컬 3001포트
// ══════════════════════════════════════

// API 서버 기본 주소
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const Register = () => {
  const navigate = useNavigate();

// ══════════════════════════════════════
// 2. 상태 선언
//    회원가입 폼 필드 전체를 하나의 객체로 관리
// ══════════════════════════════════════

// 폼 입력값 — 아이디·비밀번호·비밀번호확인·이름·이메일·체중·키
const [form,setForm]= useState({
  id:'',
  password:'',
  passwordCheck:'',
  name:'',
  email:'',
  weight:'',
  height:''
});

// 서버 응답 또는 클라이언트 검증 실패 시 에러 메시지
const [error,setError]= useState('');

  // ══════════════════════════════════════
  // 3. 입력 핸들러
  //    input name 속성을 키로 사용하여 form 객체를 동적으로 업데이트
  // ══════════════════════════════════════

  // name 속성 기반으로 해당 필드만 업데이트 (e.target.name → form key)
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ══════════════════════════════════════
  // 4. 회원가입 핸들러
  //    클라이언트 검증 → POST /api/auth/register → 성공 시 /login 이동
  // ══════════════════════════════════════

  // 비밀번호 일치 여부 확인 후 서버에 회원가입 요청
  async function handleRegister() {
    setError('');

    // 비밀번호 일치 검증 (클라이언트 사이드)
    if (form.password !== form.passwordCheck) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          email: form.email,
          password: form.password,
          weight: form.weight,
          height: form.height,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      // 회원가입 성공 — 알림 후 로그인 페이지로 리다이렉트
      alert('회원가입 완료! 로그인해주세요 🐱');
      navigate('/login');

    } catch (err) {
      setError('서버에 연결할 수 없습니다.');
    }
  }

  // ══════════════════════════════════════
  // 5. 렌더
  //    로고 → 입력 필드 7개 → 에러 메시지 → 가입 버튼 → 로그인 링크
  // ══════════════════════════════════════
  return (
    <div className="container">
      <div className="overlay"></div>

      <div className="register-card">
        {/* 앱 로고 이미지 */}
        <img src={logoImg} className="logo" alt="Logo" />

        {/* 회원가입 입력 필드 — 아이디·비밀번호·비밀번호확인·이름·이메일·체중·키 */}
        <input type="text" name="id" placeholder="아이디 입력" value={form.id} onChange={handleChange} />
        <input type="password" name="password" placeholder="비밀번호 입력" value={form.password} onChange={handleChange} />
        <input type="password" name="passwordCheck" placeholder="비밀번호 확인" value={form.passwordCheck} onChange={handleChange} />
        <input type="text" name="name" placeholder="사용자 이름 입력" value={form.name} onChange={handleChange} />
        <input type="email" name="email" placeholder="이메일 주소 입력" value={form.email} onChange={handleChange} />
        <input type="number" name="weight" placeholder="체중 입력 (kg)" value={form.weight} onChange={handleChange} />
        <input type="number" name="height" placeholder="키 입력 (cm)" value={form.height} onChange={handleChange} />

        {/* 에러 메시지 (검증 실패 또는 서버 응답 오류) */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {/* 가입 완료 버튼 */}
        <button className="login-btn" onClick={handleRegister}>가입 완료</button>

        {/* 하단 메뉴 */}
        <div className="bottom-menu">
          <span>이미 계정이 있으신가요? <Link to="/login">로그인하기</Link></span>
        </div>
      </div>
    </div>
  );
}

export default Register;

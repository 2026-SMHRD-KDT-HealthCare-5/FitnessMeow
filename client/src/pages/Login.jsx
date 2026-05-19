import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../css/Login.css";
import logoimg from "../assets/logo.png";



const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
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


  return (
    <div className="container">
      <div className="overlay"></div>
      <div className="login-card">
        <img src={logoimg} alt="Logo" className="logo" />
        {/* <h1>피트니스냥</h1> */}
        <p className="sub-text">운동하고 고양이를 키워보세요 🐾</p>

         {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <input type="text" 
        placeholder="아이디 입력"
        value={id}
        onChange={(e)=>setId(e.target.value)}
        />
        <input type="password"
         placeholder="비밀번호 입력"
         value={password}
         onChange={(e)=>setPassword(e.target.value)}
         />
        
        {/* 로그인 버튼 */}
        <button className="login-btn" onClick={handleLogin}>로그인</button>

        {/* 또는 구분선 추가 */}
        <div className="divider">
          <span>------------------------------또는------------------------------</span>
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
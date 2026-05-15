import React from 'react';
import "./css/Login.css";
import logoimg from "./assets/logo.png";

const Login = () => {
  return (
    <div className="container">
      <div className="overlay"></div>
      <div className="login-card">
        <img src={logoimg} alt="Logo" className="logo" />
        {/* <h1>피트니스냥</h1> */}
        <p className="sub-text">운동하고 고양이를 키워보세요 🐾</p>
        
        <input type="text" placeholder="아이디 입력" />
        <input type="password" placeholder="비밀번호 입력" />
        
        {/* 로그인 버튼 */}
        <button className="login-btn">로그인</button>

        {/* 또는 구분선 추가 */}
        <div className="divider">
          <span>------------------------------또는------------------------------</span>
        </div>

        {/* 큰 회원가입 버튼 추가 */}
        <button className="signup-btn">회원가입</button>

        {/* 하단 메뉴 수정 (비밀번호 찾기 등) */}
        <div className="bottom-menu">
          <span>비밀번호 찾기</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
import React  from 'react';
import "../css/Register.css";
import logoImg from "../assets/logo.png"; 

const Register = () => {
  return (
    <div className="container">
      <div className="overlay"></div>
      
      <div className="register-card">
        <img src={logoImg} className="logo" alt="Logo" />
        <p className="sub-text">운동하고 고양이를 키워보세요 🐾</p>
        
        {/* 1. 아이디 입력 문구 */}
        <input type="text" placeholder="아이디 입력" />
        
        {/* 2. 비밀번호 및 비밀번호 확인 */}
        <input type="password" placeholder="비밀번호 입력" />
        <input type="password" placeholder="비밀번호 확인" />
        
        {/* 3. 사용자 이름 입력 */}
        <input type="text" placeholder="사용자 이름 입력" />
        
        {/* 4. 이메일 주소 입력 */}
        <input type="email" placeholder="이메일 주소 입력" />
        
        {/* 가입 완료 버튼 */}
        <button className="login-btn">가입 완료</button>

        {/* 하단 메뉴 */}
        <div className="bottom-menu">
          <span>이미 계정이 있으신가요? <b>로그인하기</b></span>
        </div>
      </div>
    </div>
  );
}

export default Register;

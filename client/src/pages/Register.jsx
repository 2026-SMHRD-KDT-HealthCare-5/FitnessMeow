import React  from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/Register.css";
import logoImg from "../assets/logo.png"; 
import { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {

const [form,setForm]= useState({
  id:'',
  password:'',
  passwordCheck:'',
  name:'',
  email:'',
  weight:'',
  height:''
});

const [error,setError]= useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister() {
    setError('');

    if (form.password !== form.passwordCheck) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
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

      alert('회원가입 완료! 로그인해주세요 🐱');
      window.location.href = '/login';

    } catch (err) {
      setError('서버에 연결할 수 없습니다.');
    }
  }

  return (
    <div className="container">
      <div className="overlay"></div>
      
      <div className="register-card">
        <img src={logoImg} className="logo" alt="Logo" />
  
        
        <input type="text" name="id" placeholder="아이디 입력" value={form.id} onChange={handleChange} />
        <input type="password" name="password" placeholder="비밀번호 입력" value={form.password} onChange={handleChange} />
        <input type="password" name="passwordCheck" placeholder="비밀번호 확인" value={form.passwordCheck} onChange={handleChange} />
        <input type="text" name="name" placeholder="사용자 이름 입력" value={form.name} onChange={handleChange} />
        <input type="email" name="email" placeholder="이메일 주소 입력" value={form.email} onChange={handleChange} />
        <input type="number" name="weight" placeholder="체중 입력 (kg)" value={form.weight} onChange={handleChange} />
        <input type="number" name="height" placeholder="키 입력 (cm)" value={form.height} onChange={handleChange} />

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
import React from 'react';
import { NavLink } from 'react-router-dom'; // 👈 라우터 링크 기능을 불러옵니다.
import './Navbar.css';

const Navbar = () => {
  return (
    <div className="footer-nav">
    
      <NavLink to="/home" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <span>🏠</span>
        <p>홈</p>
      </NavLink>
      
      <NavLink to="/exercise" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <span>🏋️‍♂️</span>
        <p>운동</p>
      </NavLink>
      
      <NavLink to="/shop" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <span>🛍️</span>
        <p>상점</p>
      </NavLink>
      
      <NavLink to="/dictionary" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <span>📖</span>
        <p>도감</p>
      </NavLink>
      
      <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
        <span>👤</span>
        <p>내 정보</p>
      </NavLink>
    </div>
  );
};

export default Navbar;
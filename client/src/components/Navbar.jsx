import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Navbar.css';

//수정사항 : 기존 코드 setCurrentTab 방식은 상태만 바꿈, URL변경/뒤로 가기/새로고침 유지 불가 -> router /navigate로 변경 

const navItems = [
  { key: "home",       path: "/mainlobby",  icon: "🏠",  label: "홈" },
  { key: "shop",       path: "/shop",        icon: "🛍️", label: "꾸미기" },
  { key: "exercise",   path: "/exercise",    icon: "🏋️‍♂️", label: "운동" },
  { key: "collection", path: "/collection",  icon: "📖", label: "도감" },
  { key: "info",       path: "/info",        icon: "👤", label: "내 정보" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="footer-nav">
      {navItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
        >
          <span aria-hidden="true">{item.icon}</span>
          <p>{item.label}</p>
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
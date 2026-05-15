import React from 'react';

const Navbar = () => {
  return (
    <div className="footer-nav">
      <div className="nav-item"><span>🏠</span><p>홈</p></div>
      <div className="nav-item active"><span>🏋️‍♂️</span><p>운동</p></div>
      <div className="nav-item"><span>🛍️</span><p>상점</p></div>
      <div className="nav-item"><span>📖</span><p>도감</p></div>
      <div className="nav-item"><span>👤</span><p>내 정보</p></div>
    </div>
  );
};

export default Navbar;
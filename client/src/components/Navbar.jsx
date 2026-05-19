import React from 'react';
import '../css/Navbar.css'; // 👈 팀원분이 만든 CSS 스타일 그대로 유지

// 부모(MainLobby)한테 탭 상태를 받아옵니다.
const Navbar = ({ currentTab, setCurrentTab }) => {
  return (
    <div className="footer-nav">
    
      {/* 1. 홈 */}
      <div 
        className={`nav-item ${currentTab === "home" ? "active" : ""}`}
        onClick={() => setCurrentTab("home")}
      >
        <span>🏠</span>
        <p>홈</p>
      </div>
      
      {/* 2. 운동 */}
      <div 
        className={`nav-item ${currentTab === "exercise" ? "active" : ""}`}
        onClick={() => setCurrentTab("exercise")}
      >
        <span>🏋️‍♂️</span>
        <p>운동</p>
      </div>
      
      {/* 3. 꾸미기 */}
      <div 
        className={`nav-item ${currentTab === "shop" ? "active" : ""}`}
        onClick={() => setCurrentTab("shop")}
      >
        <span>🛍️</span>
        <p>꾸미기</p>
      </div>
      
      {/* 4. 도감 */}
      <div 
        className={`nav-item ${currentTab === "dogam" ? "active" : ""}`}
        onClick={() => setCurrentTab("dogam")}
      >
        <span>📖</span>
        <p>도감</p>
      </div>
      
      {/* 5. 내 정보 */}
      <div 
        className={`nav-item ${currentTab === "info" ? "active" : ""}`}
        onClick={() => setCurrentTab("info")}
      >
        <span>👤</span>
        <p>내 정보</p>
      </div>
      
    </div>
  );
};

export default Navbar;
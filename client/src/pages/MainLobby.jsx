import React, { useState } from "react";
import MyRoom from "../components/MyRoom.jsx"; // 💡 마이룸 경로 (components 폴더)
import ExerciseSelect from "./ExerciseSelect.jsx"; // 💡 운동선택 경로 (pages 폴더)
import "../App.css"; // 💡 설정하신 CSS 경로에 맞게 유지 (App.css 또는 css/App.css 등)

const MainLobby = () => {
  // 현재 선택된 탭 상태 관리 (기본값: 홈)
  const [currentTab, setCurrentTab] = useState("home");

  return (
    <div className="app-layout">
      
      {/* 🔄 1. 상단 메인 콘텐츠 영역 */}
      <div className="main-content">
        {currentTab === "home" && <MyRoom currentTab={currentTab} />}
        {currentTab === "exercise" && <ExerciseSelect />}
        
        {/* 추후 페이지들이 추가되면 아래 주석을 풀고 연결해주시면 됩니다 */}
        {/* {currentTab === "shop" && <Shop />} */}
        {/* {currentTab === "dogam" && <Dogam />} */}
        {/* {currentTab === "info" && <MyInfo />} */}
      </div>

      {/* 📱 2. 하단 고정 네비게이션 바 (5개 항목 완벽 복구) */}
      <footer className="footer-nav">
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

        {/* 4. 도감  */}
        <div 
          className={`nav-item ${currentTab === "dogam" ? "active" : ""}`} 
          onClick={() => setCurrentTab("dogam")}
        >
          <span>📖</span>
          <p>도감</p>
        </div>

        {/* 5. 내 정보  */}
        <div 
          className={`nav-item ${currentTab === "info" ? "active" : ""}`} 
          onClick={() => setCurrentTab("info")}
        >
          <span>👤</span>
          <p>내 정보</p>
        </div>
      </footer>

    </div>
  );
};

export default MainLobby;
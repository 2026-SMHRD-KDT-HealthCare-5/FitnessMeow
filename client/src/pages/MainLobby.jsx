import React, { useState } from "react";
import MyRoom from "../components/MyRoom.jsx"; 
import ExerciseSelect from "./ExerciseSelect.jsx"; 
// ⭐️ 1. 컴포넌트 폴더에 있는 진짜 네비게이션 바 가져오기 (파일명에 맞게 수정하세요!)
import Navbar from "../components/Navbar.jsx"; 
import "../App.css"; 

const MainLobby = () => {
  const [currentTab, setCurrentTab] = useState("home");

  return (
    <div className="app-layout">
      
      {/* 🔄 1. 상단 메인 콘텐츠 영역 */}
      <div className="main-content">
        {currentTab === "home" && <MyRoom currentTab={currentTab} />}
        {currentTab === "exercise" && <ExerciseSelect />}
        
        {/* {currentTab === "shop" && <Shop />} */}
        {currentTab === "dogam" && <Dogam />}
        {currentTab === "info" && <MyInfo />}
      </div>

      {/* 📱 2. 지저분한 HTML 다 지우고, 진짜 컴포넌트 한 줄로 조립하기 */}
      {/* 💡 탭 상태(currentTab)와 상태변경함수(setCurrentTab)를 넘겨줍니다. */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

    </div>
  );
};

export default MainLobby;
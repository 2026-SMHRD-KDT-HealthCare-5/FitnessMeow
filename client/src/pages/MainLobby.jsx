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
        
        {/* ⭐️ 홈("home")이거나 꾸미기("shop") 일 때 마이룸을 보여줍니다. */}
        {/* 이제 Shop 컴포넌트는 MyRoom 내부에서 아름답게 띄워줄 겁니다. */}
        {(currentTab === "home" || currentTab === "shop") && (
          <MyRoom currentTab={currentTab} />
        )}
        
        {/* ❌ [원인 제거] 아래에 있던 중복 {currentTab === "shop" && <Shop />} 줄을 삭제했습니다! */}
        
        {/* 운동 선택 화면 */}
        {currentTab === "exercise" && <ExerciseSelect />}
        
        {/* 추후 구현할 도감 및 내 정보 (에러 방지용 임시 텍스트 처리 등 필요시 확인) */}
        {currentTab === "dogam" && <div>도감 페이지 준비 중</div>}
        {currentTab === "info" && <div>내 정보 페이지 준비 중</div>}
      </div>

      {/* 📱 2. 하단 고정 네비게이션 바 */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

    </div>
  );
};

export default MainLobby;
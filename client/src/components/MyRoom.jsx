import React, { useState } from "react";
import Quest from "../components/Quest"; // 💡 분리한 퀘스트 컴포넌트 불러오기
import "../css/MyRoom.css";// 💡 마이룸 스타일을 위한 CSS 파일 (경로는 설정하신 대로 유지)
import catImg from "../assets/eximage.png"; // 방 안의 고양이
import profileCatImg from "../assets/eximage.png"; // 💡 프로필용 고양이 이미지 (원하는 이미지로 변경 가능)
import roomBg from "../assets/room-bg.png"; 

const MyRoom = ({ currentTab }) => {
  const [userCoins, setUserCoins] = useState(1099); // 화폐 상태
  const [catName, setCatName] = useState("치즈");   // 💡 고양이 이름 상태

  return (
    <div className="my-room-container">
      
      {/* 1. 👑 상단 헤더 영역 영역 (전면 수정) */}
      <div className="room-top-header">
        
        {/* 👈 왼쪽: 고양이 프로필 이미지 + 이름 */}
        <div className="profile-section">
          <img src={profileCatImg} alt="고양이 프로필" className="profile-avatar" />
          <span className="profile-name">{catName}</span>
        </div>

        {/* 👉 오른쪽: 게임 화폐만 깔끔하게 노출 (설정 버튼 삭제) */}
        <div className="header-right">
          <div className="currency-box">🍊 츄르 {userCoins}</div>
        </div>
      </div>

      {/* 2. 🏠 메인 마이룸 액자 상자 */}
      <div className="room-aspect-box">
        <img src={roomBg} alt="마이룸 배경" className="room-background-img" />
        <img src={catImg} alt="메인 고양이" className="room-main-cat" />

        {/* 💡 3. 방 바로 아래(안쪽 최상단)에 퀘스트창 컴포넌트 장착! */}
        {currentTab === "home" && <Quest />}
      </div>

      {/* 5. 이 아래에 전체 메인 하단 네비게이션바가 들어오므로 구조 유지됨 */}
    </div>
  );
};

export default MyRoom;
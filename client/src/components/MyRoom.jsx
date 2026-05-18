import React, { useState } from "react";
import Quest from "./Quest.jsx"; // 같은 폴더 안
import "../css/MyRoom.css"; 
import catImg from "../assets/eximage.png"; 
import profileCatImg from "../assets/eximage.png"; 
import roomBg from "../assets/room-bg.png"; 

const MyRoom = ({ currentTab }) => {
  // 💡 초기 자금을 0원 혹은 원하는 기본 금액으로 세팅하세요!
  const [userCoins, setUserCoins] = useState(0); 
  const [catName, setCatName] = useState("치즈");   

  // 💡 퀘스트 완료 시 돈을 불려주는 고마운 함수
  const handleReward = (amount) => {
    setUserCoins((prev) => prev + amount);
  };

  return (
    <div className="my-room-container">
      <div className="responsive-content">
        
        {/* 1. 상단 헤더 영역 */}
        <div className="room-top-header">
          <div className="profile-section">
            <img src={profileCatImg} alt="고양이 프로필" className="profile-avatar" />
            <span className="profile-name">{catName}</span>
          </div>

          <div className="header-right">
            {/* 💡 실시간으로 변하는 돈이 찍힙니다 */}
            <div className="currency-box">🍊 츄르 {userCoins}</div>
          </div>
        </div>

        {/* 2. 메인 마이룸 액자 상자 */}
        <div className="room-aspect-box">
          <img src={roomBg} alt="마이룸 배경" className="room-background-img" />
          <img src={catImg} alt="메인 고양이" className="room-main-cat" />

          {/* 💡 중요: Quest 컴포넌트에 handleReward 함수를 팩스로 던져줍니다! */}
          {currentTab === "home" && <Quest onReward={handleReward} />}
        </div>

      </div>
    </div>
  );
};

export default MyRoom;
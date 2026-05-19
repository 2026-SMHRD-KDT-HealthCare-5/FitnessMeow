import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Quest from "./Quest.jsx"; // 같은 폴더 안
import "../css/MyRoom.css"; 
import catImg from "../assets/eximage.png"; 
import profileCatImg from "../assets/eximage.png"; 
import roomBg from "../assets/room-bg.png"; 

const MyRoom = () => {

  const [userCoins, setUserCoins] = useState(0); 
  const [catName, setCatName] = useState("치즈");   
  const location = useLocation();

  // 퀘스트 완료 테스트용
  const handleReward = (amount) => {
    setUserCoins((prev) => prev + amount);
  };

  return (
    <div className="my-room-container">
      <div className="responsive-content">
        
        {/* 1. 상단 헤더 영역 */}
        <div className="room-top-header">

          {/*프로필: 나중에 사용자가 원하는 프로필로 수정 가능 */}
          <div className="profile-section">
            <img src={profileCatImg} alt="고양이 프로필" className="profile-avatar" />
            <span className="profile-name">{catName}</span>
          </div>


         {/*화폐 */}
          <div className="header-right">
            <div className="currency-box"> 🍊츄르 {userCoins}</div>
          </div>
        </div>

        {/* 2. 메인 마이룸 액자 상자 */}
        <div className="room-aspect-box">
          <img src={roomBg} alt="마이룸 배경" className="room-background-img" />
          <img src={catImg} alt="메인 고양이" className="room-main-cat" />

          {/*경로*/}
          {location.pathname === "/mainlobby" && <Quest onReward={handleReward} />}
        </div>

      </div>
    </div>
  );
};

export default MyRoom;
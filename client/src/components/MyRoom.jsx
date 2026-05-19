import React, { useState, useRef } from "react";
import Quest from "./Quest.jsx"; 
import Shop from "./Shop.jsx";   
import { useLocation } from "react-router-dom";
import "../css/MyRoom.css"; 
import catImg from "../assets/eximage.png"; 
import profileCatImg from "../assets/eximage.png"; 
import roomBg from "../assets/room-bg.png"; 
import coinImg from "../assets/coin.png"; 
import Navbar from "./Navbar.jsx";

// 🌟 가구 이미지 임포트 (Shop에서 MyRoom으로 이동)
import catTowerImg from '../assets/cattower.png';
import ball1Img from '../assets/ball1.png';
import ball2Img from '../assets/ball2.png';
import ball3Img from '../assets/ball3.png';
// import assets from '../assets/assets.js';
// const { catTowerImg, ball1Img, ball2Img, ball3Img } = assets;

const MyRoom = ({ initialTab = "home" }) => {

  //----------------------------------------------------------------

const [equippedItems, setEquippedItems] = useState([]);
  
  // 🌟 [추가] 탭을 이동해도 구매 내역이 유지되도록 상점 아이템 상태를 부모가 관리합니다.
  const [shopItems, setShopItems] = useState({
    가구: [
      { id: 101, name: '원목 캣타워', price: 1500, img: catTowerImg, unlocked: false, equipped: false },
      { id: 102, name: '바스락 공 1', price: 500, img: ball1Img, unlocked: false, equipped: false },
      { id: 103, name: '바스락 공 2', price: 800, img: ball2Img, unlocked: false, equipped: false },
      { id: 104, name: '바스락 공 3', price: 2000, img: ball3Img, unlocked: false, equipped: false },
    ],
    고양이: [
      { id: 201, name: '치즈 삼색이', price: 0, img: '🐈', unlocked: true, equipped: true }, 
      { id: 202, name: '품격 고등어', price: 1000, img: '🟤', unlocked: false, equipped: false },
      { id: 203, name: '둠칫 턱시도', price: 3000, img: '🐈‍⬛', unlocked: false, equipped: false }, 
      { id: 204, name: '우아한 샴', price: 5000, img: '🐱', unlocked: false, equipped: false },
    ]
  });
  //---------------------------------------------------------------------------------
  
  const dragItemIdx = useRef(null);
  const roomRef = useRef(null);

  const [userCoins, setUserCoins] = useState(0); 
  const [catName, setCatName] = useState("치즈");   
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(initialTab);

  // 퀘스트 완료 테스트용
  const handleReward = (amount) => {
    setUserCoins((prev) => prev + amount);
  };

  // 드래그 시작
  const handleDragStart = (e, index) => {
    dragItemIdx.current = index;
  };

  // 드래그 중 (방 내부 좌표 기억)
  const handleRoomMouseMove = (e) => {
    if (dragItemIdx.current === null || !roomRef.current) return;

    const rect = roomRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(x, 95));
    y = Math.max(0, Math.min(y, 95));

    setEquippedItems(prev => prev.map((item, idx) => 
      idx === dragItemIdx.current ? { ...item, x, y } : item
    ));
  };

  // 드래그 끝
  const handleDragEnd = () => {
    dragItemIdx.current = null;
  };

  return (
    <div className="my-room-container">
      <div className="responsive-content">
        <Navbar />
        <div className="room-top-header">

          {/*프로필: 나중에 사용자가 원하는 프로필로 수정 가능 */}
          <div className="profile-section">
            <img src={profileCatImg} alt="고양이 프로필" className="profile-avatar" />
            <span className="profile-name">{catName}</span>
          </div>
          <div className="header-right">
            <div className="currency-box">
              <img src={coinImg} alt="coin" className="currency-img" />
              <span className="currency-label">츄르코인</span>
              <span className="currency-amount">{userCoins.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div 
          className="room-aspect-box" 
          ref={roomRef}
          onMouseMove={handleRoomMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          <img src={roomBg} alt="마이룸 배경" className="room-background-img" />
          <img src={catImg} alt="메인 고양이" className="room-main-cat" />

          {/* 배치된 가구들 렌더링 */}
          {equippedItems.map((item, index) => (
            <img 
              key={item.id} 
              src={item.img} 
              alt={item.name} 
              className={`placed-item item-id-${item.id}`} 
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                cursor: 'grab'
              }}
              onMouseDown={(e) => handleDragStart(e, index)}
              draggable="false"
            />
          ))}

          {currentTab === "home" && <Quest onReward={handleReward} />}
        </div>

        {/* 🌟 Shop에 대장 상태인 shopItems와 setShopItems를 통째로 내려줍니다 */}
        {currentTab === "shop" && (
          <Shop 
            userCoins={userCoins} 
            setUserCoins={setUserCoins} 
            shopItems={shopItems}
            setShopItems={setShopItems}
            setEquippedItems={setEquippedItems} 
          />
        )}

      </div>
    </div>
  );
};

export default MyRoom;
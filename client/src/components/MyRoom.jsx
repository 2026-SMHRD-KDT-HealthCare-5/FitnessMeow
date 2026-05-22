import React, { useState, useRef, useEffect } from "react";
import Quest from "./Quest.jsx"; 
import Inventory from "./Inventory.jsx"; 
import { useLocation } from "react-router-dom";
import "../css/MyRoom.css"; 
import catImg from "../assets/eximage.png";
import profileCatImg from "../assets/eximage.png"; 
import roomBg from "../assets/room-bg.png"; 
import coinImg from "../assets/coin.png"; 
import Navbar from "./Navbar.jsx";

// 🌟 가구 이미지 임포트
import catTowerImg from '../assets/Cattower/cattower.png';
import ball1Img from '../assets/Toy/ball1.png';
import ball2Img from '../assets/Toy/ball2.png';
import ball3Img from '../assets/Toy/ball3.png';

const MyRoom = ({ initialTab = "home" }) => {

  // 💡 [초기값 수정] 처음 방에 들어왔을 때 '치즈 삼색이(id: 201)'가 기본 배치되어 있도록 세팅합니다.
const [equippedItems, setEquippedItems] = useState(() => {
  const saved = localStorage.getItem('equippedItems');
  return saved ? JSON.parse(saved) : [
    { id: 201, name: '치즈 삼색이', price: 0, img: '🐈', unlocked: true, equipped: true, x: 42, y: 55, isCat: true }
  ];
});
  
  const [inventoryItems, setInventoryItems] = useState({
    가구: [
      { id: 101, name: '원목 캣타워', price: 1500, img: catTowerImg, unlocked: false, equipped: false },
      { id: 102, name: '바스락 공 1', price: 500, img: ball1Img, unlocked: false, equipped: false },
      { id: 103, name: '바스락 공 2', price: 800, img: ball2Img, unlocked: false, equipped: false },
      { id: 104, name: '바스락 공 3', price: 2000, img: ball3Img, unlocked: false, equipped: false },
    ],
    고양이: [
      // 💡 인벤토리 아이템을 다룰 때 고양이 종류는 'isCat: true' 표시를 달아 구별해 줍니다.
      { id: 201, name: '치즈 삼색이', price: 0, img: '🐈', unlocked: true, equipped: true, isCat: true }, 
      { id: 202, name: '품격 고등어', price: 1000, img: '🟤', unlocked: false, equipped: false, isCat: true },
      { id: 203, name: '둠칫 턱시도', price: 3000, img: '🐈‍⬛', unlocked: false, equipped: false, isCat: true }, 
      { id: 204, name: '우아한 샴', price: 5000, img: '🐱', unlocked: false, gubernatorial: false, equipped: false, isCat: true },
    ]
  });
  
  const dragItemIdx = useRef(null);
  const roomRef = useRef(null);

  const [userCoins, setUserCoins] = useState(0); 
  const [catName, setCatName] = useState("치즈");   
  const location = useLocation();
  const [currentTab, setCurrentTab] = useState(initialTab);

  useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
  localStorage.setItem('equippedItems', JSON.stringify(equippedItems)); //임시용 나중에 백엔드 연결 시 삭제 해주기(coordinates 테이블에 저장(?))
}, [equippedItems]);

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
          {/*프로필*/}
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
          
          {/* ❌ 기존의 고정되어 있던 <img src={catImg} className="room-main-cat" /> 태그는 삭제되었습니다! */}

          {/* 배치된 가구 및 고양이들 렌더링 구역 */}
          {equippedItems.map((item, index) => {
            // 💡 만약 아이템이 고양이(isCat)라면, 기존 고양이 스타일(room-main-cat)을 상속하고 실제 고양이 도트 이미지를 뿌려줍니다.
            if (item.isCat) {
              return (
                <img 
                  key={item.id} 
                  src={catImg} // 💡 나중에 고양이 종류별 이미지가 생기면 item.img대신 각각 매칭 가능
                  alt={item.name} 
                  className="room-main-cat placed-item" 
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    cursor: 'grab',
                    position: 'absolute' // CSS 충돌 우려 대비 방어막
                  }}
                  onMouseDown={(e) => handleDragStart(e, index)}
                  draggable="false"
                />
              );
            }

            // 일반 가구 아이템 렌더링
            return (
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
            );
          })}

          {currentTab === "home" && <Quest onReward={handleReward} />}
          <button
            onClick={() => setCurrentTab(currentTab === "inventory" ? "home" : "inventory")}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 10,
              background: "rgba(255,251,244,0.95)",
              border: "none",
              borderRadius: "12px",
              padding: "8px 12px",
              fontSize: "18px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >🎒
          </button>
        </div>

        {currentTab === "inventory" && (
          <Inventory 
            userCoins={userCoins} 
            setUserCoins={setUserCoins} 
            inventoryItems={inventoryItems}
            setInventoryItems={setInventoryItems}
            setEquippedItems={setEquippedItems} 
          />
        )}

      </div>
    </div>
  );
};

export default MyRoom;
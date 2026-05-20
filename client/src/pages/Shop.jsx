import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Navbar from '../components/Navbar.jsx';   
import '../css/Shop.css';
import coinImg from '../assets/coin.png'; 

// 🌟 순수 가구 에셋 이미지 임포트 (원상 복구)
import catTowerImg from '../assets/cattower.png';
import ball1Img from '../assets/ball1.png';
import ball2Img from '../assets/ball2.png';
import ball3Img from '../assets/ball3.png';

// 🌟 [수정] 실제 고양이 이미지 에셋 임포트 (이름만 wood인 귀한 고양이들)
import woodCat1Img from '../assets/wood---1.png';
import woodCat2Img from '../assets/wood---2.png';

const Shop = ({ userCoins, setUserCoins, setInventoryItems }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('가구');

  const INITIAL_ITEMS = {
    가구: [
      { id: 101, name: '원목 캣타워', price: 1500, img: catTowerImg },
      { id: 102, name: '털뭉치 1', price: 500, img: ball1Img },
      { id: 103, name: '털뭉치 2', price: 800, img: ball2Img },
      { id: 104, name: '털뭉치 3', price: 2000, img: ball3Img },
    ],
    고양이: [
      // 💡 이름은 wood지만 실제로는 고양이 에셋! 'isCat: true' 속성을 확실하게 달아줍니다.
      { id: 202, name: 'wood 고양이 1', price: 100, img: woodCat1Img, isCat: true }, 
      { id: 203, name: 'wood 고양이 2', price: 300, img: woodCat2Img, isCat: true }, 
    ]
  };

  const handleBuyItem = (item) => {
    if (userCoins < item.price) {
      alert('❌ 츄르코인이 부족합니다! 운동을 더 하고 오세요.');
      return;
    }

    if (window.confirm(`🎉 ${item.name}을(를) ${item.price} 츄르에 구매하시겠습니까?`)) {
      setUserCoins(prev => prev - item.price);
      
      setInventoryItems(prev => {
        const categoryList = prev[activeCategory] || [];
        const itemExist = categoryList.some(i => i.id === item.id);
        
        if (itemExist) {
          return {
            ...prev,
            [activeCategory]: categoryList.map(i => 
              i.id === item.id ? { ...i, unlocked: true } : i
            )
          };
        } else {
          return {
            ...prev,
            [activeCategory]: [
              ...categoryList,
              { 
                id: item.id, 
                name: item.name, 
                price: item.price, 
                img: item.img, 
                unlocked: true, 
                equipped: false,
                ...(item.isCat && { isCat: true }) // 💡 고양이 탭에서 구매 시 인벤토리에서도 고양이 성질 유지!
              }
            ]
          };
        }
      });

      alert(`🎁 ${item.name} 구매 완료! 보관함에서 확인해 보세요.`);
    }
  };

  return (
    <div className="new-shop-page">
      {/* 상단 헤더 */}
      <div className="new-shop-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2>상점</h2>
        <div className="user-chur-box">
          <img src={coinImg} alt="coin" className="chur-icon" />
          <span>츄르 {userCoins ? userCoins.toLocaleString() : 0}</span>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="new-shop-tabs">
        {['가구', '고양이'].map((tab) => (
          <button 
            key={tab} 
            className={`tab-item ${activeCategory === tab ? 'active' : ''}`}
            onClick={() => setActiveCategory(tab)}
          >
            {tab === '가구' ? '🪑 가구' : '🐱 고양이'}
          </button>
        ))}
      </div>

      {/* 2열 그리드 아이템 리스트 */}
      <div className="new-shop-content">
        {INITIAL_ITEMS[activeCategory] && INITIAL_ITEMS[activeCategory].length > 0 ? (
          <div className="item-grid-layout">
            {INITIAL_ITEMS[activeCategory].map((item) => (
              <div key={item.id} className="new-shop-card" onClick={() => handleBuyItem(item)}>
                <div className="shop-img-wrapper">
                  <img src={item.img} alt={item.name} className="shop-item-png" />
                </div>
                <p className="shop-item-title">{item.name}</p>
                <div className="shop-price-tag">
                  <img src={coinImg} alt="coin" className="card-coin-icon" />
                  <span>{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-category">아직 준비 중인 상품입니다 🐾</div>
        )}
      </div>

      {/* 하단 고정 네비게이션 바 */}
      <Navbar />
    </div>
  );
};

export default Shop;
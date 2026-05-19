import React, { useState } from 'react';
import '../css/Shop.css';
import coinImg from '../assets/coin.png';

const Shop = ({ userCoins, setUserCoins, shopItems, setShopItems, setEquippedItems }) => {
  const [category, setCategory] = useState('가구'); 

  // 🌟 가구 배치 동기화 헬퍼 함수 (부모의 기존 드래그 위치 x, y 보존형)
  const syncEquippedItems = (updatedFurniture) => {
    if (!setEquippedItems) return;
    const activeItems = updatedFurniture.filter(item => item.equipped);
    
    setEquippedItems(prev => {
      return activeItems.map(item => {
        // 기존에 이미 방에 배치되어 좌표값(x, y)이 있던 애들은 그 위치 그대로 보존!
        const exist = prev.find(p => p.id === item.id);
        return exist ? exist : { ...item, x: 50, y: 50 }; // 새로 배치하면 정중앙(50, 50)
      });
    });
  };

  const handleItemClick = (currentCategory, targetItem) => {
    if (!targetItem.unlocked) {
      if (userCoins >= targetItem.price) {
        // 1. 코인 차감
        setUserCoins(prev => prev - targetItem.price);
        
        // 2. 부모의 상점 데이터 갱신
        const updatedCategoryItems = shopItems[currentCategory].map(item => 
          item.id === targetItem.id ? { ...item, unlocked: true, equipped: true } : item
        );
        
        setShopItems(prev => ({ ...prev, [currentCategory]: updatedCategoryItems }));
        alert(`🎉 ${targetItem.name}을(를) 구매하여 배치했습니다!`);
        
        if (currentCategory === '가구') syncEquippedItems(updatedCategoryItems);
      } else {
        alert('❌ 츄르코인이 부족합니다! 운동을 더 하고 오세요.');
      }
      return;
    }

    // 이미 구매한 아이템 토글 (배치 <-> 해제)
    const updatedCategoryItems = shopItems[currentCategory].map(item => {
      if (item.id === targetItem.id) {
        return { ...item, equipped: !item.equipped };
      }
      if (currentCategory === '고양이' && item.equipped) {
        return { ...item, equipped: false };
      }
      return item;
    });

    setShopItems(prev => ({ ...prev, [currentCategory]: updatedCategoryItems }));
    if (currentCategory === '가구') syncEquippedItems(updatedCategoryItems);
  };

  return (
    <div className="shop-fixed-container">
      <div className="shop-categories">
        <button className={category === '가구' ? 'active' : ''} onClick={() => setCategory('가구')}>🪑 가구</button>
        <button className={category === '고양이' ? 'active' : ''} onClick={() => setCategory('고양이')}>🐱 고양이 선택</button>
      </div>

      <div className="shop-item-list">
        {shopItems[category].map((item) => (
          <div 
            key={item.id} 
            className={`shop-item-card ${item.equipped ? 'equipped' : ''}`}
            onClick={() => handleItemClick(category, item)}
          >
            <div className="item-icon">
              {category === '가구' ? (
                <img src={item.img} alt={item.name} className="shop-item-png" />
              ) : (
                item.img
              )}
            </div>
            <p className="item-name">{item.name}</p>
            <div className={`item-price ${item.unlocked ? 'unlocked-badge' : ''}`}>
              {!item.unlocked && (
                <>
                  <img src={coinImg} alt="coin" className="currency-img" />
                  <span>{item.price.toLocaleString()}</span>
                </>
              )}
              {item.unlocked && item.equipped && <span>배치됨</span>}
              {item.unlocked && !item.equipped && <span>배치하기</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
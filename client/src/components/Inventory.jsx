import React, { useState } from 'react';
import '../css/Inventory.css'; 

const Inventory = ({ inventoryItems, setInventoryItems, setEquippedItems }) => {
  const [category, setCategory] = useState('가구'); 

  // 💡 가구 및 고양이 상태 통합 동기화 헬퍼 함수
  const syncEquippedItems = (updatedItems, currentCategory) => {
    if (!setEquippedItems) return;
    
    // 현재 탭 카테고리(가구 혹은 고양이)에서 활성화(equipped)된 것들만 추려냅니다.
    const activeItems = updatedItems.filter(item => item.equipped);
    
    setEquippedItems(prev => {
      // 다른 카테고리의 배치된 아이템들은 보존하기 위해 필터링 처리
      const otherCategoryItems = prev.filter(p => {
        if (currentCategory === '가구') return p.isCat; // 가구 탭 작업 중이면 고양이 데이터 지키기
        if (currentCategory === '고양이') return !p.isCat; // 고양이 탭 작업 중이면 가구 데이터 지키기
        return true;
      });

      // 현재 조작 중인 카테고리의 활성화된 아이템들 좌표 매핑
      const newlyMappedItems = activeItems.map(item => {
        const exist = prev.find(p => p.id === item.id);
        return exist ? exist : { ...item, x: 45, y: 50 }; // 처음 방에 소환되면 중앙 부근 배치
      });

      return [...otherCategoryItems, ...newlyMappedItems];
    });
  };

  const handleItemClick = (currentCategory, targetItem) => {
    const updatedCategoryItems = inventoryItems[currentCategory].map(item => {
      if (item.id === targetItem.id) {
        return { ...item, equipped: !item.equipped };
      }
      return item;
    });

    setInventoryItems(prev => ({ ...prev, [currentCategory]: updatedCategoryItems }));
    syncEquippedItems(updatedCategoryItems, currentCategory); // 카테고리 정보 같이 전송
  };

  return (
    <div className="inventory-fixed-container">
      <div className="inventory-categories">
        <button className={category === '가구' ? 'active' : ''} onClick={() => setCategory('가구')}>🪑 가구</button>
        <button className={category === '고양이' ? 'active' : ''} onClick={() => setCategory('고양이')}>🐱 고양이 선택</button>
      </div>

      <div className="inventory-item-list">
        {inventoryItems[category].filter(item => item.unlocked).map((item) => (
          <div 
            key={item.id} 
            className={`inventory-item-card ${item.equipped ? 'equipped' : ''}`}
            onClick={() => handleItemClick(category, item)}
          >
            <div className="item-icon">
              {category === '가구' ? (
                <img src={item.img} alt={item.name} className="inventory-item-png" />
              ) : (
                item.img
              )}
            </div>
            <p className="item-name">{item.name}</p>
            <div className={`item-price ${item.unlocked ? 'unlocked-badge' : ''}`}>
              {item.equipped ? <span>✅ 배치 완료</span> : <span>📦 배치하기</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
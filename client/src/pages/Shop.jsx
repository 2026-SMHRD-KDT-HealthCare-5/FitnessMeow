import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '..//css/Shop.css';
import Navbar from '../components/Navbar.jsx';
import UserCoin from '../components/UserCoin.jsx';
import ShopItemCard from '../components/ShopItemCard.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import ToastMessage from '../components/ToastMessage.jsx';
import { shopApi } from '../services/shopApi.js';

import cattowerImg from '../assets/cattower.png';
import ball1Img from '../assets/ball1.png';
import ball2Img from '../assets/ball2.png';
import ball3Img from '../assets/ball3.png';

  const SHOP_ITEMS = {
  벽지 : [],
  타일 : [],
  가구: [
    { id: 101, name: '원목 캣타워', price: 1500, img: cattowerImg },
    { id: 102, name: '털뭉치 1',   price: 500,  img: ball1Img },
    { id: 103, name: '털뭉치 2',   price: 800,  img: ball2Img },
    { id: 104, name: '털뭉치 3',   price: 2000, img: ball3Img },
  ]
};

const Shop = () => {
  const navigate = useNavigate();

  const [coins, setCoins] = useState(9999);
  const [activeTab, setActiveTab] = useState('가구');
  const [ownedItemIds, setOwnedItemIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [toast, setToast] = useState(null);



// 카드 클릭 핸들러
const handleCardClick = (item) => {
  if (coins < item.price) {
    setToast({ message: `츄르가 부족해요! 현재 ${coins.toLocaleString()}츄르 보유 중 🐾`, type: 'error' });
    return;
  }
  setSelectedItem(item);
  setIsModalOpen(true);
};

// 모달 닫기
const handleCancel = () => {
  setIsModalOpen(false);
  setSelectedItem(null);
};
// Toast 닫기
const handleToastClose = () => {
  setToast(null);
};

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h2>상점</h2>
        <UserCoin coins={coins} />
      </div>

      <div className="shop-tabs">
        {Object.keys(SHOP_ITEMS).map((tab) => (
          <button
            key={tab}
            className={`shop-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
           >
            {tab}
           </button>
          ))}
      </div>

      <div className="shop-grid">
       {SHOP_ITEMS[activeTab].map((item) => (
         <ShopItemCard
           key={item.id}
           item={item}
           isOwned={ownedItemIds.includes(item.id)}
           onCardClick={handleCardClick}
         />
       ))}
      </div>

      {isModalOpen && (
        <PurchaseModal
          item={selectedItem}
          isPurchasing={isPurchasing}
          onConfirm={() => {}}
          onCancel={handleCancel}
        />
      )}

      <ToastMessage toast={toast} onClose={handleToastClose} />
      <Navbar />
    </div>
  );
};


export default Shop;
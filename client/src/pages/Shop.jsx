import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '..//css/Shop.css';
import Navbar from '../components/Navbar.jsx';
import UserCoin from '../components/UserCoin.jsx';
import ShopItemCard from '../components/ShopItemCard.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import ToastMessage from '../components/ToastMessage.jsx';
import axios from 'axios';

import cattowerImg from '../assets/cattower.png';
import ball1Img from '../assets/ball1.png';
import ball2Img from '../assets/ball2.png';
import ball3Img from '../assets/ball3.png';


const Shop = () => {
  const navigate = useNavigate();
  const [shopItems, setShopItems] = useState({ 벽지: [], 타일: [], 가구: [] });


  const [coins, setCoins] = useState(9999);
  const [activeTab, setActiveTab] = useState('가구');
  const [ownedItems, setOwnedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => {
  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/shop/items');
      const grouped = { 벽지: [], 타일: [], 가구: [] };
      response.data.forEach(item => {
        if (grouped[item.category]) {
          grouped[item.category].push(item);
        }
      });
      setShopItems(grouped);

      const ownedResponse = await axios.get('/api/users/items');
      setOwnedItems(ownedResponse.data.map(item => ({
      keyword: item.item_keyword,
      quantity: item.quantity
    }))); 
    } catch (error) {
      console.error('아이템 목록 불러오기 실패', error);
    }
  };
  fetchItems();
}, []);



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

const handleConfirm = async () => {
  setIsPurchasing(true);
  try {
    await axios.post('/api/shop/purchase', {
      item_keyword: selectedItem.item_keyword
    });
    setOwnedItems(prev => {
      const existing = prev.find(o => o.keyword === selectedItem.item_keyword);
      if (existing) {
        return prev.map(o => o.keyword === selectedItem.item_keyword
          ? { ...o, quantity: o.quantity + 1 }
          : o
        );
      }
      return [...prev, { keyword: selectedItem.item_keyword, quantity: 1 }];
    });
    setCoins(prev => prev - selectedItem.price);
    setIsModalOpen(false);
    setToast({ message: '구매 완료! 🐾', type: 'success' });
  } catch (error) {
    setToast({ message: '구매에 실패했어요 😿', type: 'error' });
  } finally {
    setIsPurchasing(false);
    setSelectedItem(null);
  }
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
        {Object.keys(shopItems).map((tab) => (
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
       {shopItems[activeTab].map((item) => (
         <ShopItemCard
           key={item.id}
           item={item}
           isOwned={ownedItems.some(o => o.keyword === item.item_keyword)}
           quantity={ownedItems.find(o => o.keyword === item.item_keyword)?.quantity}
           onCardClick={handleCardClick}
         />
       ))}
      </div>

      {isModalOpen && (
        <PurchaseModal
          item={selectedItem}
          isPurchasing={isPurchasing}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <ToastMessage toast={toast} onClose={handleToastClose} />
      <Navbar />
    </div>
  );
};


export default Shop;
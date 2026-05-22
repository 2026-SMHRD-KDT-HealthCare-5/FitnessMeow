import React from 'react';
import coinImg from '../assets/coin.png';

const ShopItemCard = ({ item, isOwned, quantity, onCardClick }) => {
  return (
    <div 
      className={`shop-item-card ${isOwned ? 'owned' : ''}`}
      onClick={() => onCardClick(item)}
    >
      <div className="shop-item-img-wrapper">
        <img src={item.img} alt={item.name} />
        {isOwned && <div className="owned-badge">x{quantity}</div>}
      </div>
      <p className="shop-item-name">{item.name}</p>
      <div className="shop-item-price">
        <img src={coinImg} alt="coin" />
        <span>{item.price}</span>
      </div>
    </div>
  );
};

export default ShopItemCard;
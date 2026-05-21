import React from 'react';
import coinImg from '../assets/coin.png';

const PurchaseModal = ({ item, isPurchasing, onConfirm, onCancel }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <img src={item.img} alt={item.name} />
        <p>{item.name}</p>
        <div className="modal-price">
          <img src={coinImg} alt="coin" />
          <span>츄르 {item.price}로 구매하시겠어요?</span>
        </div>
        <div className="modal-buttons">
          <button onClick={onCancel} disabled={isPurchasing}>
            아니요
          </button>
          <button onClick={onConfirm} disabled={isPurchasing}>
            {isPurchasing ? <span className="spinner" /> : '예'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
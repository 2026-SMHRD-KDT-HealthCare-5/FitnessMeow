/**
 * PurchaseModal.jsx — 아이템 구매 확인 모달
 *
 * 목차:
 *   1. 컴포넌트   — 구매 확인 다이얼로그 렌더링
 */

import React from 'react';
import coinImg from '../assets/coin.png';

// ══════════════════════════════════════
// 1. 컴포넌트
//    아이템 이미지·이름·가격을 표시하고 "예 / 아니요" 버튼을 제공하는 모달.
//    isPurchasing 이 true 이면 확인 버튼에 스피너를 렌더링하고 두 버튼을 모두 비활성화한다.
//
//    Props:
//      item         — { img, name, price }  구매 대상 아이템 정보
//      isPurchasing — boolean  API 호출 진행 중 여부
//      onConfirm    — () => void  "예" 버튼 클릭 핸들러
//      onCancel     — () => void  "아니요" 버튼 클릭 핸들러
// ══════════════════════════════════════
const PurchaseModal = ({ item, isPurchasing, onConfirm, onCancel }) => {
  return (
    // 모달 배경 (반투명 오버레이)
    <div className="modal-backdrop">
      <div className="modal-box">
        {/* 아이템 이미지 */}
        <img src={item.img} alt={item.name} />

        {/* 아이템 이름 */}
        <p>{item.name}</p>

        {/* 코인 아이콘 + 구매 확인 메시지 */}
        <div className="modal-price">
          <img src={coinImg} alt="coin" />
          <span>츄르 {item.price}로 구매하시겠어요?</span>
        </div>

        {/* 취소 / 확인 버튼 — isPurchasing 중에는 두 버튼 모두 비활성화 */}
        <div className="modal-buttons">
          <button onClick={onCancel} disabled={isPurchasing}>
            아니요
          </button>
          <button onClick={onConfirm} disabled={isPurchasing}>
            {/* API 호출 중이면 스피너, 완료되면 "예" 텍스트 */}
            {isPurchasing ? <span className="spinner" /> : '예'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;

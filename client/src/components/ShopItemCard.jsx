/**
 * ShopItemCard.jsx — 상점 아이템 카드 컴포넌트
 *
 * 목차:
 *   1. 컴포넌트   — 아이템 이미지·이름·가격(또는 보유 완료) 렌더링
 *
 * 역할:
 *   - 상점 그리드 안에서 각 아이템을 카드 형태로 표시
 *   - 보유 여부에 따라 두 가지 상태를 시각적으로 구분:
 *       미보유: 코인 아이콘 + 가격, hover 시 살짝 올라가는 효과, pointer 커서
 *       보유 중: 이미지에 어두운 오버레이 + "보유 중" 텍스트, 가격 대신 "보유 완료 ✓", default 커서
 *
 * Props:
 *   item        — { id, item_keyword, name, img, price, ... }
 *                   img 가 null 이면 이모지(🪑)로 대체
 *   isOwned     — boolean  이미 보유 중인지 여부 (부모 Shop.jsx 에서 ownedItems 기반 계산)
 *   onCardClick — (item) => void  카드 클릭 시 호출 (부모에서 보유·코인 재확인 후 모달 오픈)
 *
 * 참고:
 *   - isOwned 가 true 이면 onCardClick 은 부모(Shop.jsx)의 handleCardClick 에서 early return 처리
 *     → 이 컴포넌트는 클릭 이벤트를 항상 전달하고, 필터링은 부모가 담당
 *   - CSS 스타일은 Shop.css 의 .shop-item-card, .owned-overlay, .owned-price-text 에서 관리
 */

import React from 'react';
import coinImg from '../assets/coin.png';

// ══════════════════════════════════════
// 1. 컴포넌트
//    isOwned 에 따라 'owned' CSS 클래스를 토글하고
//    이미지 영역에 보유 중 오버레이를 조건부 렌더링한다.
// ══════════════════════════════════════
const ShopItemCard = ({ item, isOwned, onCardClick }) => {
  return (
    <div
      className={`shop-item-card ${isOwned ? 'owned' : ''}`}
      onClick={() => onCardClick(item)}
      // CSS: .shop-item-card.owned { cursor: default } 로 보유 중 아이템은 클릭 불가 암시
    >

      {/* ── 이미지 영역 ── */}
      <div className="shop-item-img-wrapper">
        {item.img
          ? <img src={item.img} alt={item.name} />
          : <span className="shop-item-no-img">🪑</span>   /* 이미지 없는 아이템(벽지 등) 대체 표시 */
        }

        {/* 보유 중 오버레이: isOwned=true 일 때만 이미지 위에 반투명 레이어 표시 */}
        {isOwned && (
          <div className="owned-overlay">
            <span>보유 중</span>
          </div>
        )}
      </div>

      {/* ── 아이템 이름 ── */}
      <p className="shop-item-name">{item.name}</p>

      {/* ── 가격 또는 보유 완료 표시 ── */}
      <div className="shop-item-price">
        {isOwned ? (
          /* 보유 중인 아이템: 초록색 "보유 완료 ✓" */
          <span className="owned-price-text">보유 완료 ✓</span>
        ) : (
          /* 미보유 아이템: 코인 아이콘 + 가격 숫자 */
          <>
            <img src={coinImg} alt="coin" />
            <span>{item.price.toLocaleString()}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopItemCard;

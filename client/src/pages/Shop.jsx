/**
 * Shop.jsx — 상점 페이지
 *
 * 전체 화면 구성 (위 → 아래):
 *   ① shop-header  : "상점" 제목 + 보유 코인 표시 (UserCoin 컴포넌트)
 *   ② shop-tabs    : 가구 / 벽지 / 타일 탭 전환
 *   ③ shop-grid    : 탭별 아이템 카드 그리드 (ShopItemCard 목록)
 *   ④ PurchaseModal: 구매 확인 모달 (아이템 클릭 시 표시)
 *   ⑤ ToastMessage : 성공/실패 토스트 알림
 *   ⑥ Navbar       : 하단 탭 바
 *
 * 이미지 로딩:
 *   - Vite의 import.meta.glob 으로 빌드 타임에 가구 이미지를 모두 번들링
 *   - 런타임에 파일명(icon_name) → URL 맵으로 조회 (IMG_BY_NAME)
 *   - 벽지·타일은 이미지 없이 이름과 가격만 표시 (추후 추가 예정)
 *
 * 상태(state):
 *   coins        — 유저가 현재 보유한 코인 (로드 시 /api/care/status 에서 조회)
 *   activeTab    — 현재 선택된 탭 ('가구' | '벽지' | '타일')
 *   ownedItems   — 구매한 아이템 목록 [{ keyword }] (/api/inventory 에서 조회)
 *   selectedItem — 구매 확인 모달에 표시할 아이템 (카드 클릭 시 설정)
 *   isModalOpen  — 구매 확인 모달 표시 여부
 *   isPurchasing — 구매 API 호출 중 여부 (버튼 중복 클릭 방지)
 *   toast        — 토스트 알림 내용 { message, type } | null
 *
 * API 연동:
 *   GET  /api/care/status  — 코인 조회
 *   GET  /api/inventory    — 보유 아이템 조회
 *   POST /api/shop/purchase — 아이템 구매 (서버에서 중복 구매 차단)
 *
 * 중복 구매 방지 (2중 방어):
 *   1차: handleCardClick 에서 ownedItems 확인 → 보유 중이면 early return (모달도 안 뜸)
 *   2차: 서버 POST /api/shop/purchase 에서 user_items 확인 → 보유 중이면 400 에러 반환
 */

import React, { useState, useEffect } from 'react';
import '../css/Shop.css';
import Navbar        from '../components/Navbar.jsx';
import UserCoin      from '../components/UserCoin.jsx';
import ShopItemCard  from '../components/ShopItemCard.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import ToastMessage  from '../components/ToastMessage.jsx';
import axios         from 'axios';
import { SHOP_ITEMS } from '../config/shopitems.js';

// 서버 주소: .env 에 VITE_API_URL 이 있으면 사용, 없으면 로컬 3001포트
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/* ── 이미지 번들 (Vite glob import) ──────────────────────────────────────────
   빌드 시점에 assets 폴더의 모든 가구 PNG를 미리 로드해 URL 맵으로 만들어 둠.
   런타임에 파일명(icon_name) 으로 즉시 URL 조회 가능.
─────────────────────────────────────────────────────────────────────────── */
const ALL_IMGS = import.meta.glob(
  '../assets/{Cattower,Toy,Bed}/**/*.png',
  { eager: true, import: 'default' },
);

// "cattower1.png" → "http://localhost:5173/assets/cattower1-xxx.png" 형태의 맵
const IMG_BY_NAME = {};
Object.entries(ALL_IMGS).forEach(([path, url]) => {
  IMG_BY_NAME[path.split('/').pop()] = url;
});

/* ── 탭별 아이템 그룹핑 ────────────────────────────────────────────────────────
   SHOP_ITEMS 에서 category 별로 분류한 뒤, 표시용 필드(id, name, img)를 추가
   - 가구: 침대·캣타워·장난감 카테고리 통합
   - 벽지: 현재 아이템 있으면 포함 (현재는 빈 배열)
   - 타일: 준비 중 (빈 배열)
─────────────────────────────────────────────────────────────────────────── */
const FURNITURE_CATS = new Set(['침대', '캣타워', '장난감']);

const GROUPED = {
  '가구': SHOP_ITEMS
    .filter(i => FURNITURE_CATS.has(i.category))
    .map(i => ({
      ...i,
      id:   i.item_keyword,            // React key 용
      name: i.item_name,               // 카드 표시 이름
      img:  IMG_BY_NAME[i.icon_name] ?? null, // 이미지 URL (없으면 이모지 대체)
    })),
  '벽지': SHOP_ITEMS
    .filter(i => i.category === '벽지')
    .map(i => ({ ...i, id: i.item_keyword, name: i.item_name, img: null })),
  '타일': [], // 추후 추가 예정
};

const TABS = ['가구', '벽지', '타일'];

/* ══════════════════════════════════════════════════════════════
   Shop 컴포넌트
══════════════════════════════════════════════════════════════ */
const Shop = () => {
  const [coins,        setCoins]        = useState(0);      // 현재 보유 코인
  const [activeTab,    setActiveTab]    = useState('가구'); // 선택된 탭
  const [ownedItems,   setOwnedItems]   = useState([]);     // 보유 아이템 [{ keyword }]
  const [selectedItem, setSelectedItem] = useState(null);   // 구매 확인할 아이템
  const [isModalOpen,  setIsModalOpen]  = useState(false);  // 구매 모달 표시 여부
  const [isPurchasing, setIsPurchasing] = useState(false);  // API 호출 중 여부
  const [toast,        setToast]        = useState(null);   // 토스트 알림

  // ── 초기 데이터 로드 ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserData = async () => {
      // 코인 조회
      try {
        const careRes = await axios.get(`${API}/api/care/status`, { withCredentials: true });
        setCoins(careRes.data.coins ?? 0);
      } catch { /* 오류 시 기본값 0 유지 */ }

      // 보유 아이템 조회 — ownedItems 로 "이미 구매한 아이템" 판단에 사용
      try {
        const invRes = await axios.get(`${API}/api/inventory`, { withCredentials: true });
        setOwnedItems((invRes.data ?? []).map(i => ({ keyword: i.item_keyword })));
      } catch { /* 오류 시 빈 배열 유지 */ }
    };
    fetchUserData();
  }, []);

  // ── 아이템 카드 클릭 핸들러 ────────────────────────────────────────────────
  /**
   * 1차 중복 구매 방지: 이미 보유한 아이템이면 즉시 return (모달 안 뜸)
   * 코인 부족이면 에러 토스트 표시
   * 구매 가능하면 모달 오픈
   */
  const handleCardClick = (item) => {
    // 이미 보유 중인 아이템은 아무 반응 없음
    if (ownedItems.some(o => o.keyword === item.item_keyword)) return;

    // 코인 부족 시 토스트 알림
    if (coins < item.price) {
      setToast({ message: `코인이 부족해요! 현재 ${coins.toLocaleString()} 보유 중 🐾`, type: 'error' });
      return;
    }

    // 구매 확인 모달 오픈
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // ── 모달 취소 핸들러 ────────────────────────────────────────────────────────
  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // ── 구매 확인 핸들러 ────────────────────────────────────────────────────────
  /**
   * 서버에 구매 요청 → 성공 시 ownedItems 에 추가 + 코인 감소 (서버 응답값 사용)
   * 서버에서 이미 보유 시 400 에러 반환 → 에러 토스트 표시
   */
  const handleConfirm = async () => {
    setIsPurchasing(true); // 버튼 비활성화 (중복 클릭 방지)
    try {
      const res = await axios.post(
        `${API}/api/shop/purchase`,
        { item_keyword: selectedItem.item_keyword },
        { withCredentials: true },
      );

      // 구매 성공: ownedItems 에 새 아이템 추가 (단순 추가 — 중복 불가이므로 기존 항목 업데이트 불필요)
      setOwnedItems(prev => [...prev, { keyword: selectedItem.item_keyword }]);

      // 코인: 서버 응답의 실제 잔액 사용 (프론트 계산값보다 정확)
      setCoins(res.data.coins);

      setIsModalOpen(false);
      setToast({ message: '구매 완료! 🐾', type: 'success' });

    } catch (err) {
      // 서버 에러 메시지 있으면 그대로 표시, 없으면 기본 메시지
      const msg = err.response?.data?.message ?? '구매에 실패했어요 😿';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsPurchasing(false);
      setSelectedItem(null);
    }
  };

  // ── 토스트 닫기 ─────────────────────────────────────────────────────────────
  const handleToastClose = () => setToast(null);

  // 현재 탭의 아이템 목록 (GROUPED 객체에서 조회)
  const currentItems = GROUPED[activeTab] ?? [];

  // ── 렌더 ──────────────────────────────────────────────────────────────────
  return (
    <div className="shop-page">

      {/* ── ① 상단 헤더: 제목 + 코인 표시 ── */}
      <div className="shop-header">
        <h2>상점</h2>
        <UserCoin coins={coins} />
      </div>

      {/* ── ② 탭 전환: 가구 / 벽지 / 타일 ── */}
      <div className="shop-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`shop-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── ③ 아이템 그리드 ── */}
      <div className="shop-grid">
        {currentItems.length === 0 ? (
          <p className="shop-empty">준비 중입니다 🐱</p>
        ) : (
          currentItems.map(item => (
            <ShopItemCard
              key={item.id}
              item={item}
              isOwned={ownedItems.some(o => o.keyword === item.item_keyword)}
              onCardClick={handleCardClick}
            />
          ))
        )}
      </div>

      {/* ── ④ 구매 확인 모달 ── */}
      {isModalOpen && selectedItem && (
        <PurchaseModal
          item={selectedItem}
          isPurchasing={isPurchasing}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* ── ⑤ 토스트 알림 ── */}
      <ToastMessage toast={toast} onClose={handleToastClose} />

      {/* ── ⑥ 하단 탭 바 ── */}
      <Navbar />
    </div>
  );
};

export default Shop;

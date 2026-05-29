/**
 * Shop.jsx — 상점 페이지
 *
 * 목차:
 *   1. 이미지 매핑       — Vite glob으로 에셋 이미지를 파일명 기준 URL 맵으로 로드
 *   2. 상수 정의         — 카테고리 레이블·탭 목록
 *   3. 상태 및 초기 로드 — 코인·소유 아이템·전체 아이템 3개 API 병렬 조회
 *   4. 카드 클릭 처리    — 소유 여부 및 코인 검사 후 구매 모달 오픈
 *   5. 구매 확인 처리    — POST /api/shop/purchase 호출 후 코인·소유 목록 갱신
 *   6. 렌더             — 탭 필터 → ShopItemCard 그리드 → PurchaseModal → Toast
 */

import React, { useState, useEffect } from 'react';
import '../css/Shop.css';
import Navbar        from '../components/Navbar.jsx';
import UserCoin      from '../components/UserCoin.jsx';
import ShopItemCard  from '../components/ShopItemCard.jsx';
import PurchaseModal from '../components/PurchaseModal.jsx';
import ToastMessage  from '../components/ToastMessage.jsx';
import axios         from 'axios';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// ══════════════════════════════════════
// 1. 이미지 매핑
//    빌드 타임에 에셋 폴더의 PNG를 모두 로드하여 파일명 → URL 맵 생성
// ══════════════════════════════════════

// 가구·벽지·타일 폴더의 모든 PNG를 URL 맵으로 로드
const ALL_IMGS = import.meta.glob(
  '../assets/{furniture,wallpaper,tile}/**/*.png',
  { eager: true, import: 'default' },
);
// 파일명(icon_name)만 키로 추출하여 빠른 조회용 맵 생성
const IMG_BY_NAME = {};
Object.entries(ALL_IMGS).forEach(([path, url]) => {
  IMG_BY_NAME[path.split('/').pop()] = url;
});

// ══════════════════════════════════════
// 2. 상수 정의
//    UI 표시용 카테고리 레이블 및 탭 순서
// ══════════════════════════════════════

// 카테고리 키 → 한글 레이블 변환 맵
const CATEGORY_LABELS = {
  furniture: '가구',
  wallpaper: '벽지',
  tile:      '타일',
};

// 탭 순서 (CATEGORY_LABELS 키와 일치)
const TABS = ['furniture', 'wallpaper', 'tile'];

/* ══════════════════════════════════════════════════════════════
   Shop 컴포넌트
══════════════════════════════════════════════════════════════ */
const Shop = () => {
  // ══════════════════════════════════════
  // 3. 상태 및 초기 로드
  //    코인·소유 아이템·전체 상점 아이템을 마운트 시 병렬 조회
  // ══════════════════════════════════════
  const [coins,        setCoins]        = useState(0);
  const [activeTab,    setActiveTab]    = useState('furniture'); // 현재 선택된 탭
  const [ownedItems,   setOwnedItems]   = useState([]);          // 유저 소유 아이템 목록
  const [selectedItem, setSelectedItem] = useState(null);        // 구매 모달에 표시할 아이템
  const [isModalOpen,  setIsModalOpen]  = useState(false);       // 구매 모달 열림 여부
  const [isPurchasing, setIsPurchasing] = useState(false);       // 구매 요청 진행 중 여부
  const [toast,        setToast]        = useState(null);        // 토스트 메시지 { message, type }
  const [allItems,     setAllItems]     = useState([]);          // 서버에서 받아온 전체 아이템

  // 마운트 시 유저 정보·인벤토리·상점 아이템 3개 API 병렬 조회
  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, invRes, itemsRes] = await Promise.all([
          axios.get(`${API}/api/auth/me`,       { withCredentials: true }),
          axios.get(`${API}/api/inventory`,     { withCredentials: true }),
          axios.get(`${API}/api/shop/items`,    { withCredentials: true }),
        ]);
        setCoins(meRes.data.data?.point ?? 0);
        // 인벤토리를 keyword 기준 목록으로 정규화
        setOwnedItems((invRes.data ?? []).map(i => ({ keyword: i.item_keyword })));
        // 상점 아이템에 로컬 이미지 URL 주입
        setAllItems((itemsRes.data ?? []).map(i => ({
          ...i,
          id:  i.item_keyword,
          name: i.item_name,
          img: IMG_BY_NAME[i.icon_name] ?? null,
        })));
      } catch { }
    };
    load();
  }, []);

  // 현재 탭에 해당하는 아이템만 필터링
  const currentItems = allItems.filter(i => i.category === activeTab);

  // ══════════════════════════════════════
  // 4. 카드 클릭 처리
  //    소유 여부 → 코인 부족 → 구매 모달 오픈 순으로 검증
  // ══════════════════════════════════════

  // 이미 소유했거나 코인이 부족하면 모달 없이 토스트 표시
  const handleCardClick = (item) => {
    if (ownedItems.some(o => o.keyword === item.item_keyword)) return;
    if (coins < item.price) {
      setToast({ message: `코인이 부족해요! 현재 ${coins.toLocaleString()} 보유 중 🐾`, type: 'error' });
      return;
    }
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // 구매 모달 취소 — 모달 닫기 + 선택 초기화
  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // ══════════════════════════════════════
  // 5. 구매 확인 처리
  //    POST /api/shop/purchase → 코인 차감 + 소유 목록 추가
  // ══════════════════════════════════════

  // 서버 구매 요청 후 코인·소유 목록 갱신 및 결과 토스트 표시
  const handleConfirm = async () => {
    setIsPurchasing(true);
    try {
      const res = await axios.post(
        `${API}/api/shop/purchase`,
        { item_keyword: selectedItem.item_keyword },
        { withCredentials: true },
      );
      setOwnedItems(prev => [...prev, { keyword: selectedItem.item_keyword }]);
      setCoins(res.data.coins);
      setIsModalOpen(false);
      setToast({ message: '구매 완료! 🐾', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message ?? '구매에 실패했어요 😿';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsPurchasing(false);
      setSelectedItem(null);
    }
  };

  // 토스트 닫기 핸들러
  const handleToastClose = () => setToast(null);

  // ══════════════════════════════════════
  // 6. 렌더
  //    헤더(코인) → 탭 → 아이템 그리드 → 구매 모달 → 토스트 → Navbar
  // ══════════════════════════════════════
  return (
    <div className="shop-page">

      {/* 상단 헤더: 타이틀 + 현재 보유 코인 */}
      <div className="shop-header">
        <h2>상점</h2>
        <UserCoin coins={coins} />
      </div>

      {/* 카테고리 탭 (가구·벽지·타일) */}
      <div className="shop-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`shop-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {CATEGORY_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* 아이템 그리드 — 현재 탭 아이템 없으면 준비 중 안내 표시 */}
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

      {/* 구매 확인 모달 — 아이템 선택 시에만 렌더 */}
      {isModalOpen && selectedItem && (
        <PurchaseModal
          item={selectedItem}
          isPurchasing={isPurchasing}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* 토스트 메시지 (구매 성공/실패/코인 부족 알림) */}
      <ToastMessage toast={toast} onClose={handleToastClose} />
      <Navbar />
    </div>
  );
};

export default Shop;

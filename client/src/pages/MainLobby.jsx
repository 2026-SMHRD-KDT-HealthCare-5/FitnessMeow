/**
 * MainLobby.jsx — 메인 로비 페이지
 *
 * 전체 화면 구성 (위 → 아래):
 *   ① lobby-header    : 아바타 · 닉네임 · Lv · 고양이명 · 코인 / 경험치 패널 토글 버튼
 *   ② lobby-room-area : PixiJS 방 캔버스 + 부위별 경험치 오버레이(우측, 토글)
 *   ③ QuestPanel      : 오늘의 할일 카드 3개 (밥주기·빗질·화장실)
 *   ④ Navbar          : 하단 탭 바
 *
 * 주요 상태(state):
 *   character       — 서버에서 받아온 고양이 정보 (레벨·부위별 경험치·캐릭터키 등)
 *   userName        — 유저 닉네임
 *   coins           — 유저의 현재 코인
 *   expPanelOpen    — 부위별 경험치 패널 열림 여부 (💪 버튼으로 토글)
 *   todayStatus     — 오늘 퀘스트 완료 여부 { feed_done, groom_done, clean_done }
 *   placedFurniture — 방에 배치된 가구 목록 [{ item_keyword, x_pos, y_pos }]
 *   ownedItems      — 유저가 소유한 가구 목록 [{ item_keyword }]
 *   roomTheme       — 현재 적용된 방 배경 { wallpaper_key, tile_key }
 *
 * API 연동:
 *   GET   /api/auth/me          — 유저 정보 (닉네임·코인·오늘 퀘스트 완료 여부)
 *   GET   /api/character        — 고양이 정보 (레벨·부위별 경험치·캐릭터키)
 *   GET   /api/inventory        — 인벤토리 (소유 가구 + 배치 좌표)
 *   POST  /api/coordinates      — 가구 배치 좌표 저장/업데이트
 *   DEL   /api/coordinates/:kw  — 가구 배치 해제
 *   GET   /api/room/theme       — 현재 벽지·타일 키 조회
 *   PATCH /api/room/theme       — 벽지 또는 타일 키 변경
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MyRoom          from '../components/MyRoom.jsx';          // PixiJS 방 캔버스
import QuestPanel       from '../components/QuestPanel.jsx'; // 돌봄 행동 카드 섹션
import BodyExpPanel    from '../components/BodyExpPanel.jsx';    // 부위별 경험치 패널
import Navbar          from '../components/Navbar.jsx';          // 하단 탭 바
import TestCoinButton  from '../components/TestCoinButton.jsx';  // ⚠️ 개발용 코인 버튼
import coinImg      from '../assets/coin.png';            // 코인 아이콘 이미지
import profileImg   from '../assets/profile.png';         // 프로필 기본 아바타 이미지
import '../css/MainLobby.css';

// 서버 주소: .env 에 VITE_API_URL 이 있으면 사용, 없으면 로컬 3001포트
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const MainLobby = () => {
  // ── 상태 선언 ─────────────────────────────────────────────────────────────
  const [character,       setCharacter]       = useState(null);  // 고양이 데이터
  const [userName,        setUserName]        = useState('');    // 유저 닉네임
  const [coins,           setCoins]           = useState(0);     // 보유 코인
  const [expPanelOpen,    setExpPanelOpen]    = useState(false); // 경험치 패널 열림 여부
  const [todayStatus,     setTodayStatus]     = useState({       // 오늘 돌봄 완료 여부
    feed_done: false, groom_done: false, clean_done: false,
  });
  const [placedFurniture, setPlacedFurniture] = useState([]);    // 방에 배치된 가구
  const [ownedItems,      setOwnedItems]      = useState([]);    // 소유한 가구 전체
  const [invOpen,         setInvOpen]         = useState(false); // 인벤토리 열림 여부
  const [roomTheme,       setRoomTheme]       = useState({       // 방 배경 테마
    wallpaper_key: 'wallpaper_1',
    tile_key:      'tile_1',
  });
  const [unlockedCats,    setUnlockedCats]    = useState([]);    // 해금된 고양이 목록
  const [activeCat,       setActiveCat]       = useState(null);  // 방에 표시 중인 고양이

  // ── 초기 데이터 로드 ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchCharacter();    // 고양이 정보
    fetchUserData();     // 코인·돌봄포인트·오늘 상태
    fetchInventory();    // 인벤토리·배치 좌표
    fetchRoomTheme();    // 방 배경 테마 (벽지·타일)
    fetchUnlockedCats(); // 해금된 고양이 전체 목록
  }, []);

  /** 고양이 캐릭터 정보 조회 */
  const fetchCharacter = async () => {
    try {
      const res = await axios.get(`${API}/api/character`, { withCredentials: true });
      setCharacter(res.data);
      // 첫 로드 시에만 activeCat 초기화 (이미 선택된 고양이 유지)
      setActiveCat(prev => prev ?? { character_key: res.data.character_key, level: res.data.level ?? 1 });
    } catch { /* 로그인 안 된 경우 등 — 무시 */ }
  };

  /** 해금된 고양이 전체 목록 조회 */
  const fetchUnlockedCats = async () => {
    try {
      const res = await axios.get(`${API}/api/character/all`, { withCredentials: true });
      setUnlockedCats(res.data ?? []);
    } catch { }
  };

  /** 코인·오늘 돌봄 완료 상태 조회 */
  const fetchUserData = async () => {
    try {
      const res = await axios.get(`${API}/api/auth/me`, { withCredentials: true });
      setCoins(res.data.data?.point ?? 0);
      setUserName(res.data.data?.name ?? '');
      setTodayStatus(res.data.data?.today_status ?? {});
    } catch { }
  };

  /** 방 배경 테마 조회 — 현재 적용된 벽지·타일 키 */
  const fetchRoomTheme = async () => {
    try {
      const res = await axios.get(`${API}/api/room/theme`, { withCredentials: true });
      setRoomTheme({
        wallpaper_key: res.data.wallpaper_key ?? 'wallpaper_1',
        tile_key:      res.data.tile_key      ?? 'tile_1',
      });
    } catch { }
  };

  /** 인벤토리 조회 — 소유 가구 목록 + 배치된 가구 좌표 분리 */
  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${API}/api/inventory`, { withCredentials: true });
      const items = res.data ?? [];

      // 소유 가구 전체 (배치 여부 무관)
      setOwnedItems(items.map(i => ({ item_keyword: i.item_keyword })));

      // x_pos·y_pos 가 있는 항목만 → 방에 배치된 가구
      setPlacedFurniture(
        items
          .filter(i => i.x_pos != null && i.y_pos != null)
          .map(i => ({ item_keyword: i.item_keyword, x_pos: i.x_pos, y_pos: i.y_pos })),
      );
    } catch { }
  };

  // ── 가구 드래그 이동 핸들러 ────────────────────────────────────────────────
  /**
   * PixiJS 캔버스에서 가구를 드래그로 옮겼을 때 호출됨
   * 1) UI 상태 즉시 반영 (낙관적 업데이트)
   * 2) 서버에 새 좌표 저장
   */
  const handleFurnitureMove = useCallback(async (item_keyword, x, y) => {
    setPlacedFurniture(prev =>
      prev.map(f => f.item_keyword === item_keyword ? { ...f, x_pos: x, y_pos: y } : f),
    );
    try {
      await axios.post(`${API}/api/coordinates`, { item_keyword, x_pos: x, y_pos: y }, { withCredentials: true });
    } catch { }
  }, []);

  // ── 가구 배치/해제 토글 핸들러 ────────────────────────────────────────────
  /**
   * 인벤토리 패널에서 가구 클릭 시 호출됨
   * - 이미 배치된 가구 → 해제 (DB 좌표 삭제)
   * - 미배치 가구 → 기본 위치(320, 240)에 배치 (DB 좌표 저장)
   */
  const handleToggleFurniture = useCallback(async (item) => {
    const { item_keyword } = item;
    const isPlaced = placedFurniture.some(f => f.item_keyword === item_keyword);

    if (isPlaced) {
      // 배치 해제
      setPlacedFurniture(prev => prev.filter(f => f.item_keyword !== item_keyword));
      try { await axios.delete(`${API}/api/coordinates/${item_keyword}`, { withCredentials: true }); }
      catch { }
    } else {
      // 기본 위치에 배치 (캔버스 중앙: 320, 240)
      setPlacedFurniture(prev => [...prev, { item_keyword, x_pos: 195, y_pos: 435 }]);
      try {
        await axios.post(`${API}/api/coordinates`, { item_keyword, x_pos: 195, y_pos: 435 }, { withCredentials: true });
      } catch { }
    }
  }, [placedFurniture]);

  // ── 고양이 선택 핸들러 ───────────────────────────────────────────────────
  const handleSelectCat = useCallback((character_key, level) => {
    setActiveCat({ character_key, level });
  }, []);

  // ── 배경 테마 적용 핸들러 ─────────────────────────────────────────────────
  /**
   * 인벤토리 패널의 벽지·타일 탭에서 "적용" 버튼 클릭 시 호출됨
   * 1) UI 즉시 반영 (낙관적 업데이트)
   * 2) 서버에 PATCH /api/room/theme 으로 저장
   *
   * @param {'wallpaper'|'tile'} type  — 변경할 배경 종류
   * @param {string}             key   — 적용할 item_keyword
   */
  const handleApplyBackground = useCallback(async (type, key) => {
    if (type === 'wallpaper') {
      setRoomTheme(prev => ({ ...prev, wallpaper_key: key }));
      try {
        await axios.patch(`${API}/api/room/theme`, { wallpaper_key: key }, { withCredentials: true });
      } catch { }
    } else if (type === 'tile') {
      setRoomTheme(prev => ({ ...prev, tile_key: key }));
      try {
        await axios.patch(`${API}/api/room/theme`, { tile_key: key }, { withCredentials: true });
      } catch { }
    }
  }, []);

  // ── 헤더 표시용 계산값 ────────────────────────────────────────────────────
  const level   = character?.level          ?? 1;      // 현재 레벨 (없으면 1)
  const catName = character?.character_name ?? '냥이'; // 고양이 이름

  // ── 렌더 ──────────────────────────────────────────────────────────────────
  return (
    <div className="lobby-page">

      {/* ══════════════ ① 상단 헤더 ══════════════ */}
      <header className="lobby-header">

        {/* 고양이 프로필: 아바타 + 이름 + 레벨 + 닉네임 + 코인 */}
        <div className="lh-profile">
          <img src={profileImg} alt="프로필" className="lh-avatar" />
          
          <div className="lh-lv-block">
            <span className="lh-username">{userName}</span>

            <div className="lh-lv-row">
              <span className="lh-lv-badge">Lv. {level}</span>
              {userName && <span className="lh-cat-name">{catName}</span>}
            </div>
          </div>
          
          {/* 코인 표시 pill */}
          <div className="lh-pill lh-coin">
            <img src={coinImg} alt="코인" className="lh-coin-img" />
            <span>{coins.toLocaleString()}</span>
          </div>
        </div>


        {/* 우측 아이콘 버튼: 경험치 패널 토글 · 설정 */}
        <div className="lh-icons">
          <button
            className={`lh-icon-btn${expPanelOpen ? ' active' : ''}`}
            title="경험치 패널"
            onClick={() => setExpPanelOpen(v => !v)}
          >💪</button>

          <button className="lh-icon-btn" title="설정">⚙️</button>
        </div>
      </header>

      {/* ══════════════ ② 방 영역 ══════════════ */}
      {/*
        lobby-room-area 안에 3가지 레이어가 겹쳐 있음:
          1) MyRoom    — PixiJS 캔버스 (배경·고양이·가구 렌더링)
          2) room-overlay-right — 부위별 경험치 패널 (절대 위치, 우측)
          인벤토리 버튼(🎒)은 MyRoom 컴포넌트 내부에 포함됨 (우측 하단)
      */}
      <div className="lobby-room-area">

        {/* PixiJS 방 캔버스 — 가구 드래그·배치 기능 포함 */}
        <MyRoom
          character={character}
          placedFurniture={placedFurniture}
          onFurnitureMove={handleFurnitureMove}
          ownedItems={ownedItems}
          onToggleFurniture={handleToggleFurniture}
          invOpen={invOpen}
          onInvToggle={setInvOpen}
          wallpaperKey={roomTheme.wallpaper_key}
          tileKey={roomTheme.tile_key}
          onApplyBackground={handleApplyBackground}
          unlockedCats={unlockedCats}
          activeCat={activeCat}
          onSelectCat={handleSelectCat}
        />

        {/* 부위별 경험치 오버레이 — 절대 위치(우측 상단), 버튼으로 토글 */}
        {expPanelOpen && (
          <div className="room-overlay-right">
            <BodyExpPanel character={character} />
          </div>
        )}
      </div>

      {/* ══════════════ ③ 일일퀘스트 섹션 ══════════════ */}
      {/*
        QuestPanel은 오늘의 할일 카드 3개(밥주기·빗질·화장실)로 구성됨.
      */}
      {/* 인벤토리 열릴 때 먼저 사라지고, 닫힐 때 다시 나타남 */}
      <div style={{
        opacity:    invOpen ? 0 : 1,
        visibility: invOpen ? 'hidden' : 'visible',
        transition: 'opacity 0.15s ease',
      }}>
        <QuestPanel todayStatus={todayStatus} />
      </div>

      {/* ══════════════ ④ 하단 탭 바 ══════════════ */}
      <Navbar />

      {/* ⚠️ 개발용 — 배포 시 제거 */}
      <TestCoinButton
        onCoinsChange={setCoins}
        onExpChange={setCharacter}
        coinAmount={500}
        expAmount={5}
      />
    </div>
  );
};

export default MainLobby;

/**
 * MainLobby.jsx — 메인 로비 페이지
 *
 * 전체 화면 구성 (위 → 아래):
 *   ① lobby-header  : 고양이 프로필 / 레벨·경험치 바 / 코인 / 돌봄포인트 / 아이콘 버튼
 *   ② lobby-room-area : PixiJS 방 캔버스 + 부위별 경험치 오버레이(우측)
 *   ③ CarePanel     : 오늘의 할일 (밥주기·빗질·화장실) 카드 + 돌봄포인트 표시
 *   ④ Navbar        : 하단 탭 바
 *
 * 주요 상태(state):
 *   character       — 서버에서 받아온 고양이 정보 (레벨·경험치·캐릭터키 등)
 *   coins           — 유저의 현재 코인
 *   carePoints      — 유저의 현재 돌봄포인트 (운동 1세트 완료 시 +1)
 *   todayStatus     — 오늘 돌봄 행동 완료 여부 { feed_done, groom_done, clean_done }
 *   placedFurniture — 방에 배치된 가구 목록 [{ item_keyword, x_pos, y_pos }]
 *   ownedItems      — 유저가 소유한 가구 목록 [{ item_keyword }]
 *
 * API 연동:
 *   GET  /api/character       — 고양이 정보
 *   GET  /api/care/status     — 코인·돌봄포인트·오늘 돌봄 완료 여부
 *   GET  /api/inventory       — 인벤토리(소유 가구 + 배치 좌표)
 *   POST /api/coordinates     — 가구 배치 좌표 저장/업데이트
 *   DEL  /api/coordinates/:kw — 가구 배치 해제
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MyRoom          from '../components/MyRoom.jsx';          // PixiJS 방 캔버스
import CarePanel       from '../components/CarePanel.jsx';       // 돌봄 행동 카드 섹션
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
  const [coins,           setCoins]           = useState(0);     // 보유 코인
  const [carePoints,      setCarePoints]      = useState(0);     // 돌봄포인트
  const [todayStatus,     setTodayStatus]     = useState({       // 오늘 돌봄 완료 여부
    feed_done: false, groom_done: false, clean_done: false,
  });
  const [placedFurniture, setPlacedFurniture] = useState([]);    // 방에 배치된 가구
  const [ownedItems,      setOwnedItems]      = useState([]);    // 소유한 가구 전체

  // ── 초기 데이터 로드 ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchCharacter(); // 고양이 정보
    fetchUserData();  // 코인·돌봄포인트·오늘 상태
    fetchInventory(); // 인벤토리·배치 좌표
  }, []);

  /** 고양이 캐릭터 정보 조회 */
  const fetchCharacter = async () => {
    try {
      const res = await axios.get(`${API}/api/character`, { withCredentials: true });
      setCharacter(res.data);
    } catch { /* 로그인 안 된 경우 등 — 무시 */ }
  };

  /** 코인·돌봄포인트·오늘 돌봄 완료 상태 조회 */
  const fetchUserData = async () => {
    try {
      const res = await axios.get(`${API}/api/care/status`, { withCredentials: true });
      setCoins(res.data.coins ?? 0);
      setCarePoints(res.data.care_point ?? 0);      // DB 컬럼명: care_point (단수)
      setTodayStatus(res.data.today_status ?? {});
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
      setPlacedFurniture(prev => [...prev, { item_keyword, x_pos: 320, y_pos: 240 }]);
      try {
        await axios.post(`${API}/api/coordinates`, { item_keyword, x_pos: 320, y_pos: 240 }, { withCredentials: true });
      } catch { }
    }
  }, [placedFurniture]);

  // ── 헤더 표시용 계산값 ────────────────────────────────────────────────────
  const level  = character?.level   ?? 1;   // 현재 레벨 (없으면 1)
  const maxExp = character?.max_exp ?? 30;  // 레벨업에 필요한 최대 경험치

  // 팔·가슴·코어·하체 경험치의 평균값 → 헤더 EXP 바에 표시
  const avgExp = character
    ? ((character.arm_exp ?? 0) + (character.chest_exp ?? 0) +
       (character.core_exp ?? 0) + (character.lower_exp ?? 0)) / 4
    : 0;

  const expPct  = Math.min((avgExp / maxExp) * 100, 100); // EXP 바 퍼센트 (100% 초과 방지)
  const catName = character?.character_name ?? '냥이';     // 고양이 이름

  // ── 렌더 ──────────────────────────────────────────────────────────────────
  return (
    <div className="lobby-page">

      {/* ══════════════ ① 상단 헤더 ══════════════ */}
      <header className="lobby-header">

        {/* 고양이 프로필: 아바타 + 이름 + 레벨 + EXP 바 */}
        <div className="lh-profile">
          <img src={profileImg} alt="프로필" className="lh-avatar" />
          <div className="lh-lv-block">
            <span className="lh-cat-name">{catName}</span>
            <div className="lh-lv-row">
              <span className="lh-lv-badge">Lv. {level}</span>
              {/* EXP 진행 바 — width는 avgExp / maxExp 비율로 계산 */}
              <div className="lh-exp-track">
                <div className="lh-exp-fill" style={{ width: `${expPct}%` }} />
              </div>
              <span className="lh-exp-text">{Math.round(avgExp)}/{maxExp}</span>
            </div>
          </div>
        </div>

        {/* 코인 표시 pill */}
        <div className="lh-pill lh-coin">
          <img src={coinImg} alt="코인" className="lh-coin-img" />
          <span>{coins.toLocaleString()}</span>
        </div>

        {/* 돌봄포인트 표시 pill — + 버튼 없음 (운동으로만 획득) */}
        <div className="lh-pill lh-care">
          <span className="lh-care-paw">🐾</span>
          <span>{carePoints}</span>
        </div>

        {/* 우측 아이콘 버튼: 출석·설정 */}
        <div className="lh-icons">
          <button className="lh-icon-btn" title="출석">📅</button>
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
          character={character}               // 고양이 스프라이트 결정에 사용
          placedFurniture={placedFurniture}   // 방에 배치할 가구 목록
          onFurnitureMove={handleFurnitureMove}     // 드래그 완료 시 좌표 저장
          ownedItems={ownedItems}             // 인벤토리 패널에 표시할 소유 가구
          onToggleFurniture={handleToggleFurniture} // 인벤토리에서 배치/해제 토글
        />

        {/* 부위별 경험치 오버레이 — 절대 위치(우측 상단) */}
        <div className="room-overlay-right">
          <BodyExpPanel character={character} />
        </div>
      </div>

      {/* ══════════════ ③ 돌봄 섹션 ══════════════ */}
      {/*
        CarePanel은 오늘의 할일 카드 3개(밥주기·빗질·화장실) +
        돌봄포인트 표시 카드로 구성됨.
        돌봄 행동 1회 = 돌봄포인트 1 소모 + 코인 +50 획득
      */}
      <CarePanel
        carePoints={carePoints}         // 현재 돌봄포인트 (버튼 활성화 판단에 사용)
        setCarePoints={setCarePoints}   // 돌봄 완료 후 포인트 감소 반영
        onCoinsChange={setCoins}        // 돌봄 완료 후 코인 증가 반영
        todayStatus={todayStatus}       // 오늘 완료된 행동 표시 (완료 ✓ 처리)
        setTodayStatus={setTodayStatus} // 돌봄 완료 시 done 플래그 업데이트
      />

      {/* ══════════════ ④ 하단 탭 바 ══════════════ */}
      <Navbar />

      {/* ⚠️ 개발용 — 배포 시 제거 */}
      <TestCoinButton
        onCoinsChange={setCoins}
        onCarePointsChange={setCarePoints}
        onExpChange={setCharacter}
        coinAmount={500}
        careAmount={5}
        expAmount={5}
      />
    </div>
  );
};

export default MainLobby;

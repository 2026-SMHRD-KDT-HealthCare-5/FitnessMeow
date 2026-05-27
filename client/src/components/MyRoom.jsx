/**
 * MyRoom.jsx — PixiJS 기반 방 렌더링 컴포넌트
 *
 * 역할:
 *   - PixiJS v7 로 640×480 캔버스를 생성하고, CSS로 부모 영역에 맞게 스트레칭
 *   - 방 배경 이미지(room-bg.png) 렌더링
 *   - 고양이 스프라이트: character_key + level 에 맞는 이미지 로드
 *   - 가구 스프라이트: placedFurniture 배열 기반으로 배치
 *   - 가구 드래그 이동: 인벤토리 패널이 열려 있을 때만 활성화
 *   - 인벤토리 패널: 🎒 버튼 클릭 시 열림 — 소유 가구 목록 표시 + 배치/해제 토글
 *
 * Props:
 *   character         — { character_key, level, ... } 고양이 정보
 *   placedFurniture   — [{ item_keyword, x_pos, y_pos }] 배치된 가구 목록
 *   onFurnitureMove   — (item_keyword, x, y) => void  드래그 완료 콜백
 *   ownedItems        — [{ item_keyword }] 소유한 가구 전체
 *   onToggleFurniture — (item) => void  배치/해제 토글 콜백
 *
 * 드래그 잠금 메커니즘:
 *   - draggingEnabledRef: 드래그 허용 여부를 저장하는 ref (초기값 false)
 *   - invOpen 상태가 true 로 바뀔 때 draggingEnabledRef.current = true 동기화
 *   - 가구 스프라이트의 pointerdown 핸들러에서 draggingEnabledRef.current 를 확인
 *     → false 이면 드래그를 시작하지 않음
 *   - invOpen 이 바뀔 때마다 기존 모든 스프라이트의 cursor 도 함께 업데이트
 *
 * stale closure 방지:
 *   PixiJS 이벤트 핸들러는 마운트 시점에 한 번만 등록되기 때문에,
 *   최신 콜백·데이터를 ref 로 유지하고 핸들러 안에서 ref.current 로 접근함
 *
 * 이미지 로딩 방식:
 *   Vite의 import.meta.glob 으로 빌드 타임에 이미지 파일을 모두 번들링
 *   → 런타임에 파일시스템 접근 없이 URL 맵으로 조회
 */

import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { SHOP_ITEMS } from '../config/shopitems.js'; // 상점 아이템 목록 (icon_name 포함)
import roomBg from '../assets/room-bg.png';           // 방 배경 이미지
import '../css/MyRoom.css';

/* ── 이미지 번들 (Vite glob import) ────────────────────────────────────────
   빌드 시점에 assets 폴더의 모든 PNG를 미리 로드해 URL 맵으로 만들어 둠.
   런타임에 PIXI.Sprite.from(url) 에 바로 넘겨 사용.
─────────────────────────────────────────────────────────────────────────── */

// 고양이 스프라이트: assets/characters/{character_key}/{character_key}_LV_{n}.png
const CAT_IMAGES = import.meta.glob(
  '../assets/characters/**/*.png',
  { eager: true, import: 'default' },
);


// 가구 스프라이트: assets/furniture·cat_items 폴더 하위 모든 PNG

const FURNITURE_IMGS = import.meta.glob(
  '../assets/{furniture,cat_items}/**/*.png',
  { eager: true, import: 'default' },
);

// 파일명(icon_name) → URL 조회 테이블
// 예) "cattower1.png" → "http://localhost:5173/assets/cattower1-xxx.png"
const FURNITURE_URL_BY_NAME = {};
Object.entries(FURNITURE_IMGS).forEach(([path, url]) => {
  FURNITURE_URL_BY_NAME[path.split('/').pop()] = url;
});

// item_keyword → icon_name 조회 테이블 (SHOP_ITEMS 설정 기반)
// 예) "cattower_1" → "cattower1.png"
const ITEM_ICON_MAP = {};
SHOP_ITEMS.forEach(item => {
  if (item.icon_name) ITEM_ICON_MAP[item.item_keyword] = item.icon_name;
});

/** 캐릭터 스프라이트 URL 반환 */
function getCatUrl(characterKey, level) {
  const path = `../assets/characters/${characterKey}/${characterKey}_LV_${level}.png`;
  return CAT_IMAGES[path] ?? null;
}

/** 가구 스프라이트 URL 반환 */
function getFurnitureUrl(item_keyword) {
  const iconName = ITEM_ICON_MAP[item_keyword];
  return iconName ? (FURNITURE_URL_BY_NAME[iconName] ?? null) : null;
}

// PixiJS 내부 캔버스 해상도 (CSS로 실제 크기에 맞게 스트레칭됨)
const CANVAS_W = 640;
const CANVAS_H = 480;

/* ═══════════════════════════════════════════════════════════════════
   syncFurnitureToStage — 가구 스프라이트 동기화 (순수 함수)

   placedFurniture 배열과 PixiJS 스테이지를 동기화함:
     - 배열에서 사라진 가구 → 스테이지에서 제거 + destroy
     - 새로 추가된 가구 → 스프라이트 생성 + 드래그 이벤트 등록 + 스테이지 추가
     - 이미 있는 가구 → 위치만 업데이트 (단, 드래그 중인 가구는 건드리지 않음)

   파라미터:
     app               — PIXI.Application 인스턴스
     furSprites        — { item_keyword: PIXI.Sprite } 맵 (수정됨)
     dragState         — { target, offX, offY } 드래그 상태 객체
     items             — placedFurniture 배열
     onMoveRef         — 드래그 완료 콜백 ref (stale closure 방지)
     draggingEnabledRef — 드래그 허용 여부 ref (인벤토리 열림 여부와 동기화)

   왜 컴포넌트 밖에 둔 순수 함수인가?
     → PIXI 초기화 effect 와 가구 업데이트 effect 에서 둘 다 호출하기 위해
       컴포넌트 내부에 두면 두 번 정의해야 해서 분리함
═══════════════════════════════════════════════════════════════════ */
function syncFurnitureToStage(app, furSprites, dragState, items, onMoveRef, draggingEnabledRef) {
  const placedKeys = new Set(items.map(f => f.item_keyword));

  // 배열에 없는 가구 → 스테이지에서 제거
  Object.keys(furSprites).forEach(kw => {
    if (!placedKeys.has(kw)) {
      app.stage.removeChild(furSprites[kw]);
      furSprites[kw].destroy();
      delete furSprites[kw];
    }
  });

  // 배열의 각 가구 → 추가 또는 위치 업데이트
  items.forEach(item => {
    const { item_keyword, x_pos, y_pos } = item;

    if (furSprites[item_keyword]) {
      // 이미 스프라이트가 존재하는 경우: 드래그 중이 아닐 때만 위치 갱신
      if (dragState.target !== furSprites[item_keyword]) {
        furSprites[item_keyword].x = x_pos ?? CANVAS_W / 2;
        furSprites[item_keyword].y = y_pos ?? CANVAS_H / 2;
      }
      return;
    }

    // 신규 가구: URL 없으면 건너뜀
    const url = getFurnitureUrl(item_keyword);
    if (!url) return;

    // 가구 스프라이트 생성
    const sprite       = PIXI.Sprite.from(url);
    sprite.anchor.set(0.5);              // 중앙 기준점
    sprite.x           = x_pos ?? CANVAS_W / 2;
    sprite.y           = y_pos ?? CANVAS_H / 2;
    sprite.width       = 90;
    sprite.height      = 90;
    sprite.zIndex      = 10;            // 배경(0)·고양이(5)보다 위
    sprite.interactive = true;

    // 초기 커서: 인벤토리가 열려 있으면 grab, 닫혀 있으면 default
    sprite.cursor = draggingEnabledRef.current ? 'grab' : 'default';

    // ── 드래그 시작 ──────────────────────────────────────────────────────
    // draggingEnabledRef.current 가 false(인벤토리 닫힘)이면 드래그 불가
    sprite.on('pointerdown', (e) => {
      // 인벤토리가 닫혀 있으면 드래그 시작하지 않음 (가구 편집 잠금)
      if (!draggingEnabledRef.current) return;

      dragState.target = sprite;
      sprite.alpha     = 0.85;          // 반투명으로 드래그 중임을 표시
      sprite.zIndex    = 100;           // 다른 가구보다 위에 표시
      const pos        = e.data.getLocalPosition(app.stage);
      dragState.offX   = pos.x - sprite.x;
      dragState.offY   = pos.y - sprite.y;
      e.stopPropagation();
    });

    // ── 드래그 종료 ──────────────────────────────────────────────────────
    // 위치를 서버에 저장 (onMoveRef.current 로 stale closure 방지)
    const stopDrag = () => {
      if (dragState.target !== sprite) return;
      dragState.target = null;
      sprite.cursor    = draggingEnabledRef.current ? 'grab' : 'default';
      sprite.alpha     = 1;
      sprite.zIndex    = 10;
      onMoveRef.current?.(item_keyword, sprite.x, sprite.y);
    };
    sprite.on('pointerup',        stopDrag);
    sprite.on('pointerupoutside', stopDrag); // 캔버스 밖에서 손을 뗀 경우도 처리

    app.stage.addChild(sprite);
    furSprites[item_keyword] = sprite;
  });
}

/* ═══════════════════════════════════════════════════════════════════
   MyRoom 컴포넌트
═══════════════════════════════════════════════════════════════════ */
const MyRoom = ({
  character,
  placedFurniture = [],
  onFurnitureMove,
  ownedItems = [],
  onToggleFurniture,
  invOpen = false,        // 인벤토리 열림 여부 (MainLobby에서 제어)
  onInvToggle,            // 인벤토리 토글 콜백
}) => {
  // PixiJS 캔버스를 마운트할 DOM 노드
  const containerRef = useRef(null);

  // PIXI 앱 전체 생명주기 동안 유지되는 상태 객체
  // (React state 가 아닌 ref 로 관리 — 리렌더링 불필요)
  const pixiRef = useRef({
    app:        null,               // PIXI.Application 인스턴스
    furSprites: {},                 // item_keyword → PIXI.Sprite 맵
    dragState:  { target: null, offX: 0, offY: 0 }, // 현재 드래그 중인 스프라이트 상태
  });

  // 최신 콜백·데이터를 ref 로 유지 → PixiJS 이벤트 핸들러에서 stale closure 방지
  const onFurnitureMoveRef  = useRef(onFurnitureMove);
  const placedFurnitureRef  = useRef(placedFurniture);
  useEffect(() => { onFurnitureMoveRef.current = onFurnitureMove; }, [onFurnitureMove]);
  useEffect(() => { placedFurnitureRef.current = placedFurniture; }, [placedFurniture]);

  // ── 드래그 잠금 ref ────────────────────────────────────────────────────────
  // invOpen 과 동기화되어 PixiJS 이벤트 핸들러 안에서 최신 값을 읽을 수 있게 함
  // (이벤트 핸들러에서 invOpen 을 직접 읽으면 stale closure 문제 발생)
  const draggingEnabledRef = useRef(false);

  // invOpen 이 바뀔 때마다:
  //   1) draggingEnabledRef 동기화 (이벤트 핸들러에서 읽기 위해)
  //   2) 이미 스테이지에 올라간 모든 가구 스프라이트의 cursor 업데이트
  useEffect(() => {
    draggingEnabledRef.current = invOpen;

    // 기존 스프라이트들의 cursor 를 현재 invOpen 에 맞게 일괄 업데이트
    const { furSprites } = pixiRef.current;
    Object.values(furSprites).forEach(sprite => {
      sprite.cursor = invOpen ? 'grab' : 'default';
    });
  }, [invOpen]);

  /* ── PIXI 앱 초기화 ──────────────────────────────────────────────
     character_key 또는 level 이 바뀔 때마다 캔버스를 다시 생성함
     (같은 레벨·같은 캐릭터면 재생성하지 않음)
  ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current) return;

    // 픽셀 아트 스타일 유지를 위해 nearest-neighbor 스케일링 사용
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    const app = new PIXI.Application({
      width:           CANVAS_W,
      height:          CANVAS_H,
      backgroundAlpha: 0,    // 배경 투명 (배경 스프라이트로 대체)
      antialias:       false, // 픽셀 아트이므로 안티앨리어싱 OFF
      resolution:      1,
    });

    app.stage.sortableChildren = true; // zIndex 정렬 활성화

    // CSS로 부모 크기에 맞게 스트레칭 (MainLobby.css 에서 !important 로 강제)
    app.view.style.width   = '100%';
    app.view.style.height  = 'auto';
    app.view.style.display = 'block';

    containerRef.current.appendChild(app.view);

    // 레이어 1: 방 배경 (zIndex 0, 가장 아래)
    const bg = PIXI.Sprite.from(roomBg);
    bg.width  = CANVAS_W;
    bg.height = CANVAS_H;
    bg.zIndex = 0;
    app.stage.addChild(bg);

    // 레이어 2: 고양이 스프라이트 (zIndex 5)
    if (character?.character_key) {
      const url = getCatUrl(character.character_key, character.level ?? 1);
      if (url) {
        const cat = PIXI.Sprite.from(url);
        cat.anchor.set(0.5, 1);   // 발 기준 (하단 중앙)
        cat.x      = 310;
        cat.y      = 430;
        cat.width  = 140;
        cat.height = 140;
        cat.zIndex = 5;
        app.stage.addChild(cat);
      }
    }

    // 전역 pointermove: 드래그 중인 스프라이트를 마우스/터치 위치로 이동
    const { dragState } = pixiRef.current;
    app.stage.interactive = true;
    app.stage.on('pointermove', (e) => {
      if (!dragState.target) return;
      const pos = e.data.getLocalPosition(app.stage);
      dragState.target.x = pos.x - dragState.offX;
      dragState.target.y = pos.y - dragState.offY;
    });

    const furSprites = {};
    pixiRef.current.app        = app;
    pixiRef.current.furSprites = furSprites;

    // 초기화 시점에 이미 placedFurniture 데이터가 있으면 즉시 렌더링
    // (API 응답이 PIXI 초기화보다 먼저 왔을 경우 대비)
    if (placedFurnitureRef.current.length > 0) {
      syncFurnitureToStage(
        app, furSprites, dragState,
        placedFurnitureRef.current,
        onFurnitureMoveRef,
        draggingEnabledRef,  // 드래그 잠금 ref 전달
      );
    }

    // 컴포넌트 언마운트 또는 재초기화 시 PIXI 앱 완전 제거
    return () => {
      pixiRef.current = {
        app:        null,
        furSprites: {},
        dragState:  { target: null, offX: 0, offY: 0 },
      };
      app.destroy(true, { children: true });
    };
  }, [character?.character_key, character?.level]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 가구 변경 시 스테이지 동기화 ───────────────────────────────
     placedFurniture 배열이 바뀔 때마다 PixiJS 스테이지에 반영
  ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const { app, furSprites, dragState } = pixiRef.current;
    if (!app) return; // PIXI 앱이 아직 초기화 안 됐으면 건너뜀
    syncFurnitureToStage(
      app, furSprites, dragState,
      placedFurniture,
      onFurnitureMoveRef,
      draggingEnabledRef,  // 드래그 잠금 ref 전달
    );
  }, [placedFurniture]); // eslint-disable-line react-hooks/exhaustive-deps

  // 현재 배치된 가구 키 집합 — 인벤토리 패널에서 "배치 중" 뱃지 표시에 사용
  const placedSet = new Set(placedFurniture.map(f => f.item_keyword));

  /* ── 렌더 ─────────────────────────────────────────────────────── */
  return (
    <div className="my-room-wrapper">
      {/* PixiJS 캔버스 마운트 포인트 — JS가 여기에 <canvas> 를 삽입함 */}
      <div className="pixi-canvas-container" ref={containerRef} />

      {/* 인벤토리 토글 버튼 — 우측 하단 고정 위치 (z-index 40으로 오버레이보다 위)
          클릭하면 invOpen 토글 → draggingEnabledRef 와 스프라이트 cursor 도 함께 변경됨 */}
      <button
        className="inv-toggle-btn"
        onClick={() => onInvToggle?.(!invOpen)}
        title={invOpen ? '인벤토리 닫기' : '인벤토리 열기'}
      >
        🎒
      </button>

      {/* 인벤토리 패널 — 🎒 버튼 클릭 시 캔버스 위에 오버레이로 표시
          이 패널이 열려 있을 때만 가구 드래그·배치가 활성화됨 */}
      {invOpen && (
        <div className="inv-panel">
          <div className="inv-panel-header">
            <span className="inv-panel-title">🎒 인벤토리</span>
            <button className="inv-close-btn" onClick={() => onInvToggle?.(false)}>✕</button>
          </div>

          {/* 소유 가구가 없는 경우 안내 메시지 */}
          {ownedItems.length === 0 ? (
            <p className="inv-empty">보유 중인 가구가 없습니다.<br />상점에서 구매해 보세요!</p>
          ) : (
            <div className="inv-item-grid">
              {ownedItems.map(({ item_keyword }) => {
                const shopItem = SHOP_ITEMS.find(s => s.item_keyword === item_keyword);
                if (!shopItem?.icon_name) return null;
                const imgUrl   = FURNITURE_URL_BY_NAME[shopItem.icon_name];
                const isPlaced = placedSet.has(item_keyword);

                return (
                  <div
                    key={item_keyword}
                    className={`inv-item ${isPlaced ? 'inv-item--placed' : ''}`}
                    onClick={() => onToggleFurniture?.({ item_keyword, icon_name: shopItem.icon_name })}
                  >
                    {/* 가구 이미지 (없으면 📦 이모지 대체) */}
                    {imgUrl
                      ? <img src={imgUrl} alt={shopItem.item_name} className="inv-item-img" />
                      : <span className="inv-item-placeholder">📦</span>
                    }
                    <p className="inv-item-name">{shopItem.item_name}</p>
                    {/* 배치 중이면 초록 뱃지, 아니면 회색 뱃지 */}
                    <span className="inv-item-badge">
                      {isPlaced ? '배치 중' : '배치하기'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyRoom;

/**
 * MyRoom.jsx — PixiJS 기반 방 렌더링 컴포넌트
 *
 * 목차:
 *   1. 이미지 번들 및 조회 테이블   — Vite glob import, URL·아이콘 맵 생성
 *   2. 유틸 함수                    — getCatUrl, getFurnitureUrl
 *   3. 캔버스 상수                  — CANVAS_W, CANVAS_H, WALL_H
 *   4. syncFurnitureToStage         — PixiJS 스테이지와 가구 Sprite 동기화
 *   5. MyRoom 컴포넌트              — 상태·Ref 선언, PIXI 초기화, 인벤토리 패널 렌더링
 *
 * Props:
 *   character         — { character_key, level, ... } 고양이 정보
 *   placedFurniture   — [{ item_keyword, x_pos, y_pos }] 배치된 가구 목록
 *   onFurnitureMove   — (item_keyword, x, y) => void  드래그 완료 콜백
 *   ownedItems        — [{ item_keyword }] 소유한 전체 아이템
 *   onToggleFurniture — (item) => void  가구 배치/해제 토글 콜백
 *   wallpaperKey      — 현재 적용된 벽지 키 (기본: 'wallpaper_1')
 *   tileKey           — 현재 적용된 타일 키 (기본: 'tile_1')
 *   onApplyBackground — (type, key) => void  벽지·타일 적용 콜백
 *   invOpen           — boolean  인벤토리 패널 열림 상태 (부모에서 제어)
 *   onInvToggle       — (open: boolean) => void  인벤토리 토글 콜백
 *   unlockedCats      — [{ character_key, level, character_name }] 해금된 고양이 목록
 *   activeCat         — { character_key, level } 현재 방에 표시 중인 고양이
 *   onSelectCat       — (character_key, level) => void  고양이 선택 콜백
 */

import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import axios from 'axios';
import '../css/MyRoom.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// 고양이 소리 파일 (assets/catsounds/ 하위 전체)
const CAT_SOUND_URLS = import.meta.glob(
  '../assets/catsounds/**/*',
  { eager: true, import: 'default' },
);
// 아이콘 이미지 (heartbubble 포함)
const ICON_IMGS = import.meta.glob(
  '../assets/icons/*.png',
  { eager: true, import: 'default' },
);
const HEART_BUBBLE_URL = ICON_IMGS['../assets/icons/heartbubble.png'] ?? null;

// 탭 표시 이름 (UI 전용)
const CATEGORY_LABELS = {
  furniture: '가구',
  cat:       '고양이',
  wallpaper: '벽지',
  tile:      '타일',
};

// ══════════════════════════════════════
// 1. 이미지 번들 및 조회 테이블
//    Vite glob import 로 빌드 시점에 모든 PNG를 URL 맵으로 로드한다.
//    이후 파일명(icon_name) → URL 변환을 O(1)로 조회할 수 있도록 테이블을 구성한다.
// ══════════════════════════════════════

/* ── 이미지 번들 (Vite glob import) ── */
const CAT_IMAGES = import.meta.glob(
  '../assets/characters/**/*.png',
  { eager: true, import: 'default' },
);
const FURNITURE_IMGS = import.meta.glob(
  '../assets/furniture/**/*.png',
  { eager: true, import: 'default' },
);
const BG_IMGS = import.meta.glob(
  '../assets/{wallpaper,tile}/**/*.png',
  { eager: true, import: 'default' },
);

// 파일명 → URL 조회 테이블 (가구)
const FURNITURE_URL_BY_NAME = {};
Object.entries(FURNITURE_IMGS).forEach(([path, url]) => {
  FURNITURE_URL_BY_NAME[path.split('/').pop()] = url;
});

// 파일명 → URL 조회 테이블 (배경: 벽지·타일)
const BG_URL_BY_NAME = {};
Object.entries(BG_IMGS).forEach(([path, url]) => {
  BG_URL_BY_NAME[path.split('/').pop()] = url;
});

// ══════════════════════════════════════
// 2. 유틸 함수
//    getCatUrl:       캐릭터 키·레벨 → CAT_IMAGES URL
//    getFurnitureUrl: item_keyword → FURNITURE_IMGS URL
// ══════════════════════════════════════

/** 캐릭터 스프라이트 URL 반환 */
function getCatUrl(characterKey, level) {
  return CAT_IMAGES[`../assets/characters/${characterKey}/${characterKey}_LV_${level}.png`] ?? null;
}

/** 고양이 소리 재생 */
function playCatSound(character_key) {
  const entry = Object.entries(CAT_SOUND_URLS).find(([path]) =>
    path.split('/').pop().startsWith(character_key + '.'),
  );
  if (!entry) return;
  const audio = new Audio(entry[1]);
  audio.play().catch(() => {});
}

/** 하트 말풍선 스프라이트를 고양이 위에 2초간 표시 */
function showHeartBubble(app, catSprite) {
  if (!HEART_BUBBLE_URL) return;
  const bubble    = new PIXI.Sprite(PIXI.Texture.from(HEART_BUBBLE_URL));
  bubble.anchor.set(0.5, 1);
  bubble.x        = catSprite.x;
  bubble.y        = catSprite.y - catSprite.height + 10;
  bubble.width    = 60;
  bubble.height   = 60;
  bubble.zIndex   = 200;
  app.stage.addChild(bubble);
  setTimeout(() => {
    if (bubble.parent) app.stage.removeChild(bubble);
    bubble.destroy();
  }, 2000);
}

/** 가구 스프라이트 URL 반환 — icon_name 직접 전달 */
function getFurnitureUrl(icon_name) {
  return icon_name ? (FURNITURE_URL_BY_NAME[icon_name] ?? null) : null;
}

// ══════════════════════════════════════
// 3. 캔버스 상수
//    CANVAS_W × CANVAS_H: 모바일 2:3 비율의 내부 해상도 (표시 크기와 1:1 매칭)
//    WALL_H: 벽지(상단 0~WALL_H) / 타일(하단 WALL_H~580) 경계선
// ══════════════════════════════════════

// 캔버스 내부 해상도 — 
const CANVAS_W = 390+600;
const CANVAS_H = 580+580;
// 벽지(상단 0~WALL_H) / 타일(하단 WALL_H~580) 경계선 — 각 50%
const WALL_H   = 580;

/**
 * 드래그 종료 시 z순서 재정규화
 * - app.stage의 interactive 스프라이트(가구+고양이)를 현재 zIndex 순으로 정렬
 * - 10부터 순서대로 재할당 → zIndex가 무한정 커지지 않음
 * - dropped 스프라이트는 마지막(최상위)으로 배치
 */
function normalizeZOrder(app, droppedSprite, saveZOrderRef) {
  const sprites = app.stage.children
    .filter(c => c._isItem && c !== droppedSprite)
    .sort((a, b) => a.zIndex - b.zIndex);

  sprites.forEach((s, i) => { s.zIndex = 10 + i; });
  droppedSprite.zIndex = 10 + sprites.length;

  // 변경된 z_order 전체를 서버에 일괄 저장
  if (saveZOrderRef?.current) {
    const all = [...sprites, droppedSprite].filter(s => s._itemKeyword);
    saveZOrderRef.current(all.map(s => ({ item_keyword: s._itemKeyword, z_order: s.zIndex })));
  }
}

// ══════════════════════════════════════
// 4. syncFurnitureToStage
//    placedFurniture 배열과 PixiJS 스테이지의 Sprite 상태를 동기화한다.
//    - 배열에서 제거된 아이템은 Sprite를 destroy
//    - 새로 추가된 아이템은 Sprite를 생성하고 드래그 이벤트를 등록
//    - 드래그 중인 Sprite 위치는 업데이트하지 않음 (사용자 조작 보호)
// ══════════════════════════════════════
function syncFurnitureToStage(app, furSprites, dragState, items, onMoveRef, draggingEnabledRef, saveZOrderRef) {
  // 현재 배치된 아이템 키 집합
  const placedKeys = new Set(items.map(f => f.item_keyword));

  // 배열에서 제거된 아이템 Sprite 삭제
  Object.keys(furSprites).forEach(kw => {
    if (!placedKeys.has(kw)) {
      app.stage.removeChild(furSprites[kw]);
      furSprites[kw].destroy();
      delete furSprites[kw];
    }
  });

  items.forEach(item => {
    const { item_keyword, x_pos, y_pos } = item;

    if (furSprites[item_keyword]) {
      // 드래그 중이 아닌 경우에만 서버 좌표로 위치 갱신
      if (dragState.target !== furSprites[item_keyword]) {
        furSprites[item_keyword].x = x_pos ?? CANVAS_W / 2;
        furSprites[item_keyword].y = y_pos ?? CANVAS_H / 2;
      }
      return;
    }

    // 아직 Sprite 없는 경우 URL 조회 후 생성
    const url = getFurnitureUrl(item.icon_name);
    if (!url) return;

    const BASE = 80; // 1칸 기준 픽셀 크기

    const sizeW = item.size_w ?? 1;
    const sizeH = item.size_h ?? 1;

    const sprite       = PIXI.Sprite.from(url);
    sprite.anchor.set(0.5);
    sprite.x           = x_pos ?? CANVAS_W / 2;
    sprite.y           = y_pos ?? CANVAS_H / 2;
    sprite.width       = BASE * sizeW;
    sprite.height      = BASE * sizeH;
    sprite.zIndex       = item.z_order ?? 10;  // 저장된 z순서로 초기화
    sprite.interactive  = true;
    sprite._isItem      = true;                // normalizeZOrder 필터용 태그
    sprite._itemKeyword = item_keyword;         // z_order 저장 시 키로 사용
    sprite.cursor       = draggingEnabledRef.current ? 'grab' : 'default';

    // 드래그 시작
    sprite.on('pointerdown', (e) => {
      if (!draggingEnabledRef.current) return;
      dragState.target = sprite;
      sprite.alpha     = 0.85;
      sprite.zIndex    = 9999;
      const pos        = e.data.getLocalPosition(app.stage);
      dragState.offX   = pos.x - sprite.x;
      dragState.offY   = pos.y - sprite.y;
      e.stopPropagation();
    });

    // 드래그 종료: z순서 재정규화 + 서버 저장
    const stopDrag = () => {
      if (dragState.target !== sprite) return;
      dragState.target = null;
      sprite.cursor    = draggingEnabledRef.current ? 'grab' : 'default';
      sprite.alpha     = 1;
      normalizeZOrder(app, sprite, saveZOrderRef);
      onMoveRef.current?.(item_keyword, sprite.x, sprite.y);
    };
    sprite.on('pointerup',        stopDrag);
    sprite.on('pointerupoutside', stopDrag);

    app.stage.addChild(sprite);
    furSprites[item_keyword] = sprite;
  });
}

// ══════════════════════════════════════
// 5. syncCatsToStage
//    placedCats 배열과 PixiJS 스테이지의 고양이 Sprite 상태를 동기화한다.
//    - 인벤토리 열림(draggingEnabled) 시: 드래그 이동 가능
//    - 인벤토리 닫힘 시: 클릭 → 소리 + 하트 말풍선 2초 표시
// ══════════════════════════════════════
function syncCatsToStage(app, catSprites, dragState, cats, onMoveRef, draggingEnabledRef, saveZOrderRef) {
  const placedKeys = new Set(cats.map(c => c.cat_key));

  // 제거된 고양이 Sprite 삭제
  Object.keys(catSprites).forEach(key => {
    if (!placedKeys.has(key)) {
      app.stage.removeChild(catSprites[key]);
      catSprites[key].destroy();
      delete catSprites[key];
    }
  });

  cats.forEach(cat => {
    const { cat_key, character_key, level, x_pos, y_pos } = cat;

    if (catSprites[cat_key]) {
      // 드래그 중이 아닌 경우에만 좌표 갱신
      if (dragState.target !== catSprites[cat_key]) {
        catSprites[cat_key].x = x_pos ?? CANVAS_W / 2;
        catSprites[cat_key].y = y_pos ?? CANVAS_H * 0.75;
      }
      return;
    }

    // 새 고양이 Sprite 생성
    const url = getCatUrl(character_key, level);
    if (!url) return;

    const sprite       = PIXI.Sprite.from(url);
    sprite.anchor.set(0.5, 1);
    sprite.x           = x_pos ?? CANVAS_W / 2;
    sprite.y           = y_pos ?? CANVAS_H * 0.75;
    const CAT_SIZE = { 1: 120, 2: 150, 3: 180 };
    const catPx    = CAT_SIZE[level] ?? 120;
    sprite.width   = catPx;
    sprite.height  = catPx+50;
    sprite.zIndex       = cat.z_order ?? 10;  // 저장된 z순서로 초기화
    sprite.interactive  = true;
    sprite._isItem      = true;
    sprite._itemKeyword = cat_key;             // z_order 저장 시 키로 사용
    sprite.cursor       = draggingEnabledRef.current ? 'grab' : 'pointer';

    // 드래그 시작 (인벤토리 열림 시에만)
    sprite.on('pointerdown', (e) => {
      if (!draggingEnabledRef.current) return;
      dragState.target = sprite;
      sprite.alpha     = 0.85;
      sprite.zIndex    = 9999; // 드래그 중 항상 최상위
      const pos        = e.data.getLocalPosition(app.stage);
      dragState.offX   = pos.x - sprite.x;
      dragState.offY   = pos.y - sprite.y;
      e.stopPropagation();
    });

    // 드래그 종료 (pointerup / pointerupoutside 공통)
    const stopCatDrag = () => {
      if (dragState.target !== sprite) return;
      dragState.target = null;
      sprite.cursor    = draggingEnabledRef.current ? 'grab' : 'pointer';
      sprite.alpha     = 1;
      normalizeZOrder(app, sprite, saveZOrderRef);
      onMoveRef.current?.(cat_key, sprite.x, sprite.y);
    };
    sprite.on('pointerup',        stopCatDrag);
    sprite.on('pointerupoutside', stopCatDrag);

    // 클릭 감지 — pointertap 사용 (pointerup보다 신뢰성 높음) [Bug1 fix]
    // 인벤토리 닫힘 상태에서만 소리 + 하트버블
    sprite.on('pointertap', () => {
      if (draggingEnabledRef.current) return;
      playCatSound(character_key);
      showHeartBubble(app, sprite);
    });

    app.stage.addChild(sprite);
    catSprites[cat_key] = sprite;
  });
}

// ══════════════════════════════════════
// 6. MyRoom 컴포넌트
//    PixiJS 캔버스를 초기화하고 인벤토리 패널을 렌더링하는 메인 컴포넌트.
//    - useRef 로 PIXI 인스턴스를 관리해 리렌더링 시 PIXI 재초기화 방지
//    - 벽지·타일·고양이 변경은 각 전용 useEffect 에서 Sprite 텍스처만 교체
//    - 가구 변경은 syncFurnitureToStage 를 통해 스테이지와 동기화
//    - 인벤토리 패널: furniture / cat / wallpaper / tile 4개 탭
// ══════════════════════════════════════
const MyRoom = ({
  character,
  placedFurniture = [],
  onFurnitureMove,
  ownedItems = [],
  onToggleFurniture,
  invOpen = false,
  onInvToggle,
  wallpaperKey = 'wallpaper_1',
  tileKey      = 'tile_1',
  onApplyBackground,
  unlockedCats = [],
  placedCats   = [],
  onToggleCat,
  onCatMove,
}) => {
  const containerRef = useRef(null);

  // PIXI 인스턴스 모음 — 리렌더링 시에도 유지
  const pixiRef = useRef({
    app:             null,
    furSprites:      {},
    catSprites:      {},     // cat_key → Sprite (복수 고양이)
    dragState:       { target: null, offX: 0, offY: 0 },
    wallpaperSprite: null,
    tileSprite:      null,
  });

  // 콜백·배열·키를 Ref 로 유지 — PIXI 이벤트 핸들러 안에서 최신 값 참조
  const onFurnitureMoveRef = useRef(onFurnitureMove);
  const onCatMoveRef       = useRef(onCatMove);
  const placedFurnitureRef = useRef(placedFurniture);
  const wallpaperKeyRef    = useRef(wallpaperKey);
  const tileKeyRef         = useRef(tileKey);
  useEffect(() => { onFurnitureMoveRef.current = onFurnitureMove; }, [onFurnitureMove]);
  useEffect(() => { onCatMoveRef.current       = onCatMove; },       [onCatMove]);
  useEffect(() => { placedFurnitureRef.current = placedFurniture; }, [placedFurniture]);
  useEffect(() => { wallpaperKeyRef.current    = wallpaperKey; },    [wallpaperKey]);
  useEffect(() => { tileKeyRef.current         = tileKey; },         [tileKey]);

  // 드래그 활성 여부 Ref — invOpen 상태와 동기화
  const draggingEnabledRef = useRef(false);

  // z_order 일괄 저장 함수 Ref
  const saveZOrderRef = useRef(async (zOrders) => {
    try {
      await axios.patch(`${API}/api/coordinates/z-order`, zOrders, { withCredentials: true });
    } catch { }
  });

  // item_keyword → 배경 이미지 URL 맵 (ownedItems 변경 시 갱신)
  const bgImageMapRef = useRef({});
  useEffect(() => {
    const map = {};
    ownedItems.forEach(item => {
      if (item.icon_name && (item.category === 'wallpaper' || item.category === 'tile')) {
        map[item.item_keyword] = BG_URL_BY_NAME[item.icon_name];
      }
    });
    bgImageMapRef.current = map;
  }, [ownedItems]);

  // 인벤토리 탭: 'furniture' | 'cat' | 'wallpaper' | 'tile'
  const [invTab, setInvTab] = useState('furniture');

  // invOpen 변경 시 드래그 활성 여부 및 모든 Sprite 커서 업데이트
  useEffect(() => {
    draggingEnabledRef.current = invOpen;
    const { furSprites, catSprites } = pixiRef.current;
    Object.values(furSprites).forEach(s => { s.cursor = invOpen ? 'grab' : 'default'; });
    Object.values(catSprites).forEach(s => { s.cursor = invOpen ? 'grab' : 'pointer'; });
  }, [invOpen]);

  /* ── 벽지·타일 키 또는 배경 이미지 맵 변경 시 Sprite 텍스처 교체 ── */
  useEffect(() => {
    const { wallpaperSprite, tileSprite } = pixiRef.current;
    if (!wallpaperSprite || !tileSprite) return;
    const wpUrl   = bgImageMapRef.current[wallpaperKey];
    const tileUrl = bgImageMapRef.current[tileKey];
    if (wpUrl)   wallpaperSprite.texture = PIXI.Texture.from(wpUrl);
    if (tileUrl) tileSprite.texture      = PIXI.Texture.from(tileUrl);
  }, [wallpaperKey, tileKey, ownedItems]); // ownedItems: API 로드 후 맵이 채워지면 재적용

  /* ── 고양이 배치 변경 동기화 ── */
  useEffect(() => {
    const { app, catSprites, dragState } = pixiRef.current;
    if (!app) return;
    syncCatsToStage(app, catSprites, dragState, placedCats, onCatMoveRef, draggingEnabledRef, saveZOrderRef);
  }, [placedCats]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── PIXI 초기화 (마운트 시 1회) ── */
  useEffect(() => {
    if (!containerRef.current) return;

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;

    // PIXI Application 생성 — 투명 배경, 안티앨리어싱 활성화
    const app = new PIXI.Application({
      width:           CANVAS_W,
      height:          CANVAS_H,
      backgroundAlpha: 0,
      antialias:       true,
      resolution:      1,
    });

    app.stage.sortableChildren = true;
    // CSS로 부모 요소 너비에 맞게 스트레칭
    app.view.style.width   = '100%';
    app.view.style.height  = 'auto';
    app.view.style.display = 'block';
    containerRef.current.appendChild(app.view);

    // ── 레이어 1: 벽지 Sprite (상단, zIndex 0) ──
    const wpUrl = bgImageMapRef.current[wallpaperKeyRef.current];
    const wallpaperSprite = new PIXI.Sprite(
      wpUrl ? PIXI.Texture.from(wpUrl) : PIXI.Texture.WHITE,
    );
    wallpaperSprite.x      = 0;
    wallpaperSprite.y      = 0;
    wallpaperSprite.width  = CANVAS_W;
    wallpaperSprite.height = WALL_H;
    wallpaperSprite.zIndex = 0;
    app.stage.addChild(wallpaperSprite);

    // ── 레이어 2: 타일 Sprite (하단, zIndex 1) ──
    const tileUrl = bgImageMapRef.current[tileKeyRef.current];
    const tileSprite = new PIXI.Sprite(
      tileUrl ? PIXI.Texture.from(tileUrl) : PIXI.Texture.WHITE,
    );
    tileSprite.x      = 0;
    tileSprite.y      = WALL_H;
    tileSprite.width  = CANVAS_W;
    tileSprite.height = CANVAS_H - WALL_H;
    tileSprite.zIndex = 1;
    app.stage.addChild(tileSprite);

    pixiRef.current.wallpaperSprite = wallpaperSprite;
    pixiRef.current.tileSprite      = tileSprite;

    // 전역 pointermove — 드래그 중인 Sprite 위치 갱신
    const { dragState } = pixiRef.current;
    app.stage.interactive = true;
    app.stage.on('pointermove', (e) => {
      if (!dragState.target) return;
      const pos = e.data.getLocalPosition(app.stage);
      dragState.target.x = pos.x - dragState.offX;
      dragState.target.y = pos.y - dragState.offY;
    });

    const furSprites = {};
    const catSprites = {};
    pixiRef.current.app        = app;
    pixiRef.current.furSprites = furSprites;
    pixiRef.current.catSprites = catSprites;

    // 초기 가구 배치 동기화
    if (placedFurnitureRef.current.length > 0) {
      syncFurnitureToStage(
        app, furSprites, dragState,
        placedFurnitureRef.current,
        onFurnitureMoveRef,
        draggingEnabledRef,
        saveZOrderRef,
      );
    }

    // 언마운트 시 PIXI 인스턴스 및 Sprite 정리
    return () => {
      pixiRef.current = {
        app: null, furSprites: {}, catSprites: {},
        dragState:       { target: null, offX: 0, offY: 0 },
        wallpaperSprite: null, tileSprite: null,
      };
      app.destroy(true, { children: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 가구 변경 동기화 ── */
  useEffect(() => {
    const { app, furSprites, dragState } = pixiRef.current;
    if (!app) return;
    syncFurnitureToStage(
      app, furSprites, dragState,
      placedFurniture,
      onFurnitureMoveRef,
      draggingEnabledRef,
      saveZOrderRef,
    );
  }, [placedFurniture]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 인벤토리 패널용 데이터 계산 ──
  // 현재 방에 배치된 아이템 키 집합
  const placedSet   = new Set(placedFurniture.map(f => f.item_keyword));
  // 소유한 아이템 키 집합 (배경 탭에서 기본 제공 아이템과 함께 표시)
  const ownedKeySet = new Set(ownedItems.map(i => i.item_keyword));

  const isFurnitureTab = invTab === 'furniture';
  const isCatTab       = invTab === 'cat';
  const isBgTab        = invTab === 'wallpaper' || invTab === 'tile';

  // 가구 탭: 소유 아이템 중 furniture 카테고리만 필터링
  const tabFurnitureItems = isFurnitureTab
    ? ownedItems.filter(i => i.category === 'furniture')
    : [];

  // 배경 탭: 소유 아이템 중 현재 탭 카테고리(wallpaper / tile)만 표시
  const visibleBgItems = isBgTab
    ? ownedItems.filter(i => i.category === invTab)
    : [];

  /* ── 렌더 ── */
  return (
    <div className="my-room-wrapper">
      {/* PixiJS 캔버스가 마운트될 컨테이너 */}
      <div className="pixi-canvas-container" ref={containerRef} />

      {/* 인벤토리 토글 버튼 */}
      <button
        className="inv-toggle-btn"
        onClick={() => onInvToggle?.(!invOpen)}
        title={invOpen ? '인벤토리 닫기' : '인벤토리 열기'}
      >
        🎒
      </button>

      {/* 인벤토리 패널 — invOpen 이 true 일 때만 렌더링 */}
      {invOpen && (
        <div className="inv-panel">
          <div className="inv-panel-header">
            <span className="inv-panel-title">🎒 인벤토리</span>
            <button className="inv-close-btn" onClick={() => onInvToggle?.(false)}>✕</button>
          </div>

          {/* ── 탭 바: furniture / cat / wallpaper / tile ── */}
          <div className="inv-tab-bar">
            {['furniture', 'cat', 'wallpaper', 'tile'].map(tab => (
              <button
                key={tab}
                className={`inv-tab${invTab === tab ? ' active' : ''}`}
                onClick={() => setInvTab(tab)}
              >{CATEGORY_LABELS[tab]}</button>
            ))}
          </div>

          {/* ── 가구 탭: 소유 가구 목록, 클릭 시 배치/해제 토글 ── */}
          {isFurnitureTab && (
            tabFurnitureItems.length === 0 ? (
              <p className="inv-empty">
                보유 중인 가구가 없습니다.<br />상점에서 구매해 보세요!
              </p>
            ) : (
              <div className="inv-item-grid">
                {tabFurnitureItems.map(({ item_keyword, icon_name, item_name }) => {
                  if (!icon_name) return null;
                  const imgUrl   = FURNITURE_URL_BY_NAME[icon_name];
                  const isPlaced = placedSet.has(item_keyword);
                  return (
                    <div
                      key={item_keyword}
                      className={`inv-item ${isPlaced ? 'inv-item--placed' : ''}`}
                      onClick={() => onToggleFurniture?.({ item_keyword })}
                    >
                      {imgUrl
                        ? <img src={imgUrl} alt={item_name} className="inv-item-img" />
                        : <span className="inv-item-placeholder">📦</span>
                      }
                      <p className="inv-item-name">{item_name}</p>
                      {/* 배치 상태 뱃지 */}
                      <span className="inv-item-badge">{isPlaced ? '배치 중' : '배치하기'}</span>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── 고양이 탭: 해금된 고양이의 각 레벨을 별도 카드로 표시, 클릭으로 배치/해제 ── */}
          {isCatTab && (() => {
            // 해금된 각 캐릭터를 레벨별로 펼침 (Lv1 ~ 현재레벨)
            const catEntries = unlockedCats.flatMap(({ character_key, level, character_name }) =>
              Array.from({ length: Number(level) }, (_, i) => ({
                character_key,
                level:         i + 1,
                character_name: character_name ?? character_key,
                cat_key:        `cat_${character_key}_lv${i + 1}`,
              })),
            );
            return catEntries.length === 0 ? (
              <p className="inv-empty">해금된 고양이가 없습니다.</p>
            ) : (
              <div className="inv-item-grid">
                {catEntries.map(({ cat_key, character_key, level, character_name }) => {
                  const imgUrl   = getCatUrl(character_key, level);
                  const isPlaced = placedCats.some(c => c.cat_key === cat_key);
                  return (
                    <div
                      key={cat_key}
                      className={`inv-item ${isPlaced ? 'inv-item--placed' : ''}`}
                      onClick={() => onToggleCat?.(character_key, level)}
                    >
                      {imgUrl
                        ? <img src={imgUrl} alt={character_name} className="inv-item-img" />
                        : <span className="inv-item-placeholder">🐱</span>
                      }
                      <p className="inv-item-name">{character_name}</p>
                      <span style={{ fontSize: '9px', color: '#aaa' }}>Lv. {level}</span>
                      <span className="inv-item-badge">{isPlaced ? '배치 중' : '배치하기'}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── wallpaper / tile 탭: 기본 제공 + 보유 배경 목록, 적용 버튼 ── */}
          {isBgTab && (
            <div className="inv-bg-grid">
              {visibleBgItems.map(item => {
                const isActive = invTab === 'wallpaper'
                  ? wallpaperKey === item.item_keyword
                  : tileKey      === item.item_keyword;
                const previewUrl = item.icon_name ? BG_URL_BY_NAME[item.icon_name] : null;
                return (
                  <div
                    key={item.item_keyword}
                    className={`inv-bg-item ${isActive ? 'inv-bg-item--active' : ''}`}
                  >
                    {previewUrl
                      ? <img src={previewUrl} alt={item.item_name} className="inv-bg-preview" />
                      : <div className="inv-bg-preview" />
                    }
                    <p className="inv-bg-name">{item.item_name}</p>
                    {/* 이미 적용 중이면 버튼 비활성화 */}
                    <button
                      className={`inv-bg-btn ${isActive ? 'applied' : ''}`}
                      onClick={() => !isActive && onApplyBackground?.(invTab, item.item_keyword)}
                      disabled={isActive}
                    >
                      {isActive ? '적용 중 ✓' : '적용'}
                    </button>
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

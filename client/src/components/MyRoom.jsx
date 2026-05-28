/**
 * MyRoom.jsx — PixiJS 기반 방 렌더링 컴포넌트
 *
 * 역할:
 *   - PixiJS v7 로 390×580 캔버스를 생성하고, CSS로 부모 영역에 맞게 스트레칭
 *   - 방 배경: 상단(벽지 Sprite, 0~WALL_H) + 하단(타일 Sprite, WALL_H~580)
 *   - 고양이 스프라이트: character_key + level 에 맞는 이미지 로드
 *   - 가구 스프라이트: placedFurniture 배열 기반으로 배치
 *   - 가구 드래그 이동: 인벤토리 패널이 열려 있을 때만 활성화
 *   - 인벤토리 패널: 🎒 버튼 클릭 시 열림 — 가구/벽지/타일 탭으로 구분
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
 */

import React, { useRef, useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { SHOP_ITEMS, BG_ITEMS, CATEGORY_LABELS } from '../config/shopitems.js';
import { CHARACTER_CONFIG } from '../config/characters.js';
import '../css/MyRoom.css';

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

// 파일명 → URL 조회 테이블
const FURNITURE_URL_BY_NAME = {};
Object.entries(FURNITURE_IMGS).forEach(([path, url]) => {
  FURNITURE_URL_BY_NAME[path.split('/').pop()] = url;
});

const BG_URL_BY_NAME = {};
Object.entries(BG_IMGS).forEach(([path, url]) => {
  BG_URL_BY_NAME[path.split('/').pop()] = url;
});

// item_keyword → icon_name 조회 (가구)
const ITEM_ICON_MAP = {};
SHOP_ITEMS.forEach(item => {
  if (item.icon_name) ITEM_ICON_MAP[item.item_keyword] = item.icon_name;
});

// item_keyword → 이미지 URL 조회 (배경)
const BG_IMAGE_MAP = {};
BG_ITEMS.forEach(item => {
  if (item.icon_name) BG_IMAGE_MAP[item.item_keyword] = BG_URL_BY_NAME[item.icon_name];
});

/** 캐릭터 스프라이트 URL 반환 */
function getCatUrl(characterKey, level) {
  return CAT_IMAGES[`../assets/characters/${characterKey}/${characterKey}_LV_${level}.png`] ?? null;
}

/** 가구 스프라이트 URL 반환 */
function getFurnitureUrl(item_keyword) {
  const iconName = ITEM_ICON_MAP[item_keyword];
  return iconName ? (FURNITURE_URL_BY_NAME[iconName] ?? null) : null;
}

// 캔버스 내부 해상도 — 모바일 2:3 비율 (표시 크기와 1:1 매칭)
const CANVAS_W = 390;
const CANVAS_H = 580;
// 벽지(상단 0~WALL_H) / 타일(하단 WALL_H~580) 경계선 — 각 50%
const WALL_H   = 290;

/* ═══════════════════════════════════════
   syncFurnitureToStage
═══════════════════════════════════════ */
function syncFurnitureToStage(app, furSprites, dragState, items, onMoveRef, draggingEnabledRef) {
  const placedKeys = new Set(items.map(f => f.item_keyword));

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
      if (dragState.target !== furSprites[item_keyword]) {
        furSprites[item_keyword].x = x_pos ?? CANVAS_W / 2;
        furSprites[item_keyword].y = y_pos ?? CANVAS_H / 2;
      }
      return;
    }

    const url = getFurnitureUrl(item_keyword);
    if (!url) return;

    const sprite       = PIXI.Sprite.from(url);
    sprite.anchor.set(0.5);
    sprite.x           = x_pos ?? CANVAS_W / 2;
    sprite.y           = y_pos ?? CANVAS_H / 2;
    sprite.width       = 90;
    sprite.height      = 90;
    sprite.zIndex      = 10;
    sprite.interactive = true;
    sprite.cursor      = draggingEnabledRef.current ? 'grab' : 'default';

    sprite.on('pointerdown', (e) => {
      if (!draggingEnabledRef.current) return;
      dragState.target = sprite;
      sprite.alpha     = 0.85;
      sprite.zIndex    = 100;
      const pos        = e.data.getLocalPosition(app.stage);
      dragState.offX   = pos.x - sprite.x;
      dragState.offY   = pos.y - sprite.y;
      e.stopPropagation();
    });

    const stopDrag = () => {
      if (dragState.target !== sprite) return;
      dragState.target = null;
      sprite.cursor    = draggingEnabledRef.current ? 'grab' : 'default';
      sprite.alpha     = 1;
      sprite.zIndex    = 10;
      onMoveRef.current?.(item_keyword, sprite.x, sprite.y);
    };
    sprite.on('pointerup',        stopDrag);
    sprite.on('pointerupoutside', stopDrag);

    app.stage.addChild(sprite);
    furSprites[item_keyword] = sprite;
  });
}

/* ═══════════════════════════════════════
   MyRoom 컴포넌트
═══════════════════════════════════════ */
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
  activeCat    = null,
  onSelectCat,
}) => {
  const containerRef = useRef(null);

  const pixiRef = useRef({
    app:             null,
    furSprites:      {},
    dragState:       { target: null, offX: 0, offY: 0 },
    wallpaperSprite: null,   // 벽지 Sprite
    tileSprite:      null,   // 타일 Sprite
    catSprite:       null,   // 고양이 Sprite
  });

  const onFurnitureMoveRef  = useRef(onFurnitureMove);
  const placedFurnitureRef  = useRef(placedFurniture);
  const wallpaperKeyRef     = useRef(wallpaperKey);
  const tileKeyRef          = useRef(tileKey);
  const activeCatRef        = useRef(activeCat);
  useEffect(() => { onFurnitureMoveRef.current = onFurnitureMove; }, [onFurnitureMove]);
  useEffect(() => { placedFurnitureRef.current = placedFurniture; }, [placedFurniture]);
  useEffect(() => { wallpaperKeyRef.current    = wallpaperKey; },    [wallpaperKey]);
  useEffect(() => { tileKeyRef.current         = tileKey; },         [tileKey]);
  useEffect(() => { activeCatRef.current       = activeCat; },       [activeCat]);

  const draggingEnabledRef = useRef(false);

  // 인벤토리 탭: 'furniture' | 'wallpaper' | 'tile'
  const [invTab, setInvTab] = useState('furniture');

  useEffect(() => {
    draggingEnabledRef.current = invOpen;
    const { furSprites } = pixiRef.current;
    Object.values(furSprites).forEach(sprite => {
      sprite.cursor = invOpen ? 'grab' : 'default';
    });
  }, [invOpen]);

  /* ── 벽지·타일 키 변경 시 Sprite 텍스처 교체 ── */
  useEffect(() => {
    const { wallpaperSprite, tileSprite } = pixiRef.current;
    if (!wallpaperSprite || !tileSprite) return;
    const wpUrl   = BG_IMAGE_MAP[wallpaperKey];
    const tileUrl = BG_IMAGE_MAP[tileKey];
    if (wpUrl)   wallpaperSprite.texture = PIXI.Texture.from(wpUrl);
    if (tileUrl) tileSprite.texture      = PIXI.Texture.from(tileUrl);
  }, [wallpaperKey, tileKey]);

  /* ── 고양이 변경 시 Sprite 텍스처 교체 ── */
  useEffect(() => {
    const { catSprite } = pixiRef.current;
    if (!catSprite || !activeCat) return;
    const url = getCatUrl(activeCat.character_key, activeCat.level ?? 1);
    if (url) catSprite.texture = PIXI.Texture.from(url);
  }, [activeCat]);

  /* ── PIXI 초기화 ── */
  useEffect(() => {
    if (!containerRef.current) return;

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;

    const app = new PIXI.Application({
      width:           CANVAS_W,
      height:          CANVAS_H,
      backgroundAlpha: 0,
      antialias:       true,
      resolution:      1,
    });

    app.stage.sortableChildren = true;
    app.view.style.width   = '100%';
    app.view.style.height  = 'auto';
    app.view.style.display = 'block';
    containerRef.current.appendChild(app.view);

    // ── 레이어 1: 벽지 Sprite (상단, zIndex 0) ──
    const wpUrl = BG_IMAGE_MAP[wallpaperKeyRef.current];
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
    const tileUrl = BG_IMAGE_MAP[tileKeyRef.current];
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

    // ── 레이어 3: 고양이 (zIndex 5) ──
    const initCat  = activeCatRef.current;
    const initUrl  = initCat ? getCatUrl(initCat.character_key, initCat.level ?? 1) : null;
    const catSprite = new PIXI.Sprite(
      initUrl ? PIXI.Texture.from(initUrl) : PIXI.Texture.EMPTY,
    );
    catSprite.anchor.set(0.5, 1);
    catSprite.x      = 195;
    catSprite.y      = 550;
    catSprite.width  = 140;
    catSprite.height = 140;
    catSprite.zIndex = 5;
    app.stage.addChild(catSprite);
    pixiRef.current.catSprite = catSprite;

    // 전역 pointermove (드래그)
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

    if (placedFurnitureRef.current.length > 0) {
      syncFurnitureToStage(
        app, furSprites, dragState,
        placedFurnitureRef.current,
        onFurnitureMoveRef,
        draggingEnabledRef,
      );
    }

    return () => {
      pixiRef.current = {
        app: null, furSprites: {},
        dragState:       { target: null, offX: 0, offY: 0 },
        wallpaperSprite: null, tileSprite: null, catSprite: null,
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
    );
  }, [placedFurniture]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 인벤토리 패널용 데이터 ──
  const placedSet   = new Set(placedFurniture.map(f => f.item_keyword));
  const ownedKeySet = new Set(ownedItems.map(i => i.item_keyword));

  const isFurnitureTab = invTab === 'furniture';
  const isCatTab       = invTab === 'cat';
  const isBgTab        = invTab === 'wallpaper' || invTab === 'tile';

  // 가구 탭: 소유 아이템 중 furniture 카테고리만
  const tabFurnitureItems = isFurnitureTab
    ? ownedItems.filter(i => {
        const s = SHOP_ITEMS.find(si => si.item_keyword === i.item_keyword);
        return s?.category === 'furniture';
      })
    : [];

  // 배경 탭: 기본 제공 아이템 + 소유 아이템
  const visibleBgItems = isBgTab
    ? BG_ITEMS.filter(item => item.category === invTab && (item.isDefault || ownedKeySet.has(item.item_keyword)))
    : [];

  /* ── 렌더 ── */
  return (
    <div className="my-room-wrapper">
      <div className="pixi-canvas-container" ref={containerRef} />

      {/* 인벤토리 토글 버튼 */}
      <button
        className="inv-toggle-btn"
        onClick={() => onInvToggle?.(!invOpen)}
        title={invOpen ? '인벤토리 닫기' : '인벤토리 열기'}
      >
        🎒
      </button>

      {/* 인벤토리 패널 */}
      {invOpen && (
        <div className="inv-panel">
          <div className="inv-panel-header">
            <span className="inv-panel-title">🎒 인벤토리</span>
            <button className="inv-close-btn" onClick={() => onInvToggle?.(false)}>✕</button>
          </div>

          {/* ── 탭 바 ── */}
          <div className="inv-tab-bar">
            {['furniture', 'cat', 'wallpaper', 'tile'].map(tab => (
              <button
                key={tab}
                className={`inv-tab${invTab === tab ? ' active' : ''}`}
                onClick={() => setInvTab(tab)}
              >{CATEGORY_LABELS[tab]}</button>
            ))}
          </div>

          {/* ── 가구 탭 ── */}
          {isFurnitureTab && (
            tabFurnitureItems.length === 0 ? (
              <p className="inv-empty">
                보유 중인 가구가 없습니다.<br />상점에서 구매해 보세요!
              </p>
            ) : (
              <div className="inv-item-grid">
                {tabFurnitureItems.map(({ item_keyword }) => {
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
                      {imgUrl
                        ? <img src={imgUrl} alt={shopItem.item_name} className="inv-item-img" />
                        : <span className="inv-item-placeholder">📦</span>
                      }
                      <p className="inv-item-name">{shopItem.item_name}</p>
                      <span className="inv-item-badge">{isPlaced ? '배치 중' : '배치하기'}</span>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── 고양이 탭 ── */}
          {isCatTab && (
            unlockedCats.length === 0 ? (
              <p className="inv-empty">
                해금된 고양이가 없습니다.
              </p>
            ) : (
              <div className="inv-item-grid">
                {unlockedCats.map(({ character_key, level }) => {
                  const config   = CHARACTER_CONFIG[character_key];
                  const catName  = config?.character_name ?? character_key;
                  const imgUrl   = getCatUrl(character_key, level ?? 1);
                  const isActive = activeCat?.character_key === character_key;
                  return (
                    <div
                      key={character_key}
                      className={`inv-item ${isActive ? 'inv-item--placed' : ''}`}
                      onClick={() => onSelectCat?.(character_key, level ?? 1)}
                    >
                      {imgUrl
                        ? <img src={imgUrl} alt={catName} className="inv-item-img" />
                        : <span className="inv-item-placeholder">🐱</span>
                      }
                      <p className="inv-item-name">{catName}</p>
                      <span className="inv-item-name" style={{ fontSize: '9px', color: '#aaa' }}>Lv. {level}</span>
                      <span className="inv-item-badge">{isActive ? '배치 중' : '배치하기'}</span>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── wallpaper / tile 탭 ── */}
          {isBgTab && (
            <div className="inv-bg-grid">
              {visibleBgItems.map(item => {
                const isActive = invTab === 'wallpaper'
                  ? wallpaperKey === item.item_keyword
                  : tileKey      === item.item_keyword;
                const previewUrl = BG_IMAGE_MAP[item.item_keyword];
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

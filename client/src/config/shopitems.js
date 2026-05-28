// config/shopItems.js
// 상점 아이템 마스터 데이터
// item_keyword → DB user_items.item_keyword 와 연결되는 고유 키

export const SHOP_CATEGORIES = ['all', 'furniture', 'wallpaper', 'tile'];

// 카테고리 식별자 → UI 표시 레이블 (한국어)
export const CATEGORY_LABELS = {
  all:       '전체',
  furniture: '가구',
  cat:       '고양이',
  wallpaper: '벽지',
  tile:      '타일',
};

// 배경 아이템 — assets/wallpaper/ 및 assets/tile/ 파일 기반
// isDefault: true → 구매 없이 기본 제공
export const BG_ITEMS = [
  // ── 벽지 (assets/wallpaper/) ─────────────────────────
  { item_keyword: 'wallpaper_1', item_name: '벽지 1', category: 'wallpaper', price: 0,   icon_name: 'wallpaper1.png',  isDefault: true },
  { item_keyword: 'wallpaper_2', item_name: '벽지 2', category: 'wallpaper', price: 300, icon_name: 'wallpapers2.png' },

  // ── 타일 (assets/tile/) ──────────────────────────────
  { item_keyword: 'tile_1', item_name: '타일 1', category: 'tile', price: 0,   icon_name: 'floortiles1.png', isDefault: true },
  { item_keyword: 'tile_2', item_name: '타일 2', category: 'tile', price: 300, icon_name: 'floortiles2.png' },
];

// 가구 아이템 — assets/furniture/ 파일 기반 (고양이 용품 통합)
export const SHOP_ITEMS = [
  { item_keyword: 'barbell',        item_name: '바벨',          category: 'furniture', price: 200, icon_name: 'barbell.png',        size: { w: 1, h: 1 } },
  { item_keyword: 'book',           item_name: '책',            category: 'furniture', price: 80,  icon_name: 'book.png',           size: { w: 1, h: 1 } },
  { item_keyword: 'box',            item_name: '상자',          category: 'furniture', price: 100, icon_name: 'box.png',            size: { w: 1, h: 1 } },
  { item_keyword: 'cabinet',        item_name: '캐비닛',        category: 'furniture', price: 400, icon_name: 'cabinet.png',        size: { w: 1, h: 2 } },
  { item_keyword: 'catbed',         item_name: '고양이 침대',   category: 'furniture', price: 250, icon_name: 'catbed.png',         size: { w: 1, h: 1 } },
  { item_keyword: 'catbed2',        item_name: '고양이 침대 2', category: 'furniture', price: 300, icon_name: 'catbed2.png',        size: { w: 1, h: 1 } },
  { item_keyword: 'catfoodbowl',    item_name: '밥그릇',        category: 'furniture', price: 80,  icon_name: 'catfoodbowl.png',    size: { w: 1, h: 1 } },
  { item_keyword: 'cathouse',       item_name: '고양이 집',     category: 'furniture', price: 350, icon_name: 'cathouse.png',       size: { w: 2, h: 2 } },
  { item_keyword: 'cattoilet',      item_name: '화장실',        category: 'furniture', price: 200, icon_name: 'cattoilet.png',      size: { w: 1, h: 1 } },
  { item_keyword: 'cattower',       item_name: '캣타워',        category: 'furniture', price: 450, icon_name: 'cattower.png',       size: { w: 1, h: 2 } },
  { item_keyword: 'catwaterbowl',   item_name: '물그릇',        category: 'furniture', price: 80,  icon_name: 'catwaterbowl.png',   size: { w: 1, h: 1 } },
  { item_keyword: 'frame',          item_name: '액자',          category: 'furniture', price: 150, icon_name: 'frame.png',          size: { w: 1, h: 1 } },
  { item_keyword: 'gymball',        item_name: '짐볼',          category: 'furniture', price: 200, icon_name: 'gymball.png',        size: { w: 1, h: 1 } },
  { item_keyword: 'plant',          item_name: '화분',          category: 'furniture', price: 150, icon_name: 'plant2.png',         size: { w: 1, h: 1 } },
  { item_keyword: 'shelf',          item_name: '선반',          category: 'furniture', price: 250, icon_name: 'shelf.png',          size: { w: 2, h: 1 } },
  { item_keyword: 'tissuecase',     item_name: '티슈케이스',    category: 'furniture', price: 80,  icon_name: 'tissuecase.png',     size: { w: 1, h: 1 } },
  { item_keyword: 'walkingmachine', item_name: '러닝머신',      category: 'furniture', price: 600, icon_name: 'walkingmachine.png', size: { w: 2, h: 1 } },
  { item_keyword: 'window',         item_name: '창문',          category: 'furniture', price: 200, icon_name: 'window.png',         size: { w: 2, h: 1 } },
  { item_keyword: 'yogamat',        item_name: '요가 매트',     category: 'furniture', price: 150, icon_name: 'yogamat.png',        size: { w: 2, h: 1 } },
];

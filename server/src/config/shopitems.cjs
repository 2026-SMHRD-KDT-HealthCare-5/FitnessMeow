// server/src/config/shopitems.cjs
// 클라이언트 config/shopitems.js 와 반드시 동기화 유지
// item_keyword → DB user_items.item_keyword 와 연결

const SHOP_ITEMS = [
  // ── furniture (가구 + 고양이 용품 통합) ───────────────
  { item_keyword: 'barbell',        item_name: '바벨',          category: 'furniture', price: 200 },
  { item_keyword: 'book',           item_name: '책',            category: 'furniture', price: 80  },
  { item_keyword: 'box',            item_name: '상자',          category: 'furniture', price: 100 },
  { item_keyword: 'cabinet',        item_name: '캐비닛',        category: 'furniture', price: 400 },
  { item_keyword: 'catbed',         item_name: '고양이 침대',   category: 'furniture', price: 250 },
  { item_keyword: 'catbed2',        item_name: '고양이 침대 2', category: 'furniture', price: 300 },
  { item_keyword: 'catfoodbowl',    item_name: '밥그릇',        category: 'furniture', price: 80  },
  { item_keyword: 'cathouse',       item_name: '고양이 집',     category: 'furniture', price: 350 },
  { item_keyword: 'cattoilet',      item_name: '화장실',        category: 'furniture', price: 200 },
  { item_keyword: 'cattower',       item_name: '캣타워',        category: 'furniture', price: 450 },
  { item_keyword: 'catwaterbowl',   item_name: '물그릇',        category: 'furniture', price: 80  },
  { item_keyword: 'frame',          item_name: '액자',          category: 'furniture', price: 150 },
  { item_keyword: 'gymball',        item_name: '짐볼',          category: 'furniture', price: 200 },
  { item_keyword: 'plant',          item_name: '화분',          category: 'furniture', price: 150 },
  { item_keyword: 'shelf',          item_name: '선반',          category: 'furniture', price: 250 },
  { item_keyword: 'tissuecase',     item_name: '티슈케이스',    category: 'furniture', price: 80  },
  { item_keyword: 'walkingmachine', item_name: '러닝머신',      category: 'furniture', price: 600 },
  { item_keyword: 'window',         item_name: '창문',          category: 'furniture', price: 200 },
  { item_keyword: 'yogamat',        item_name: '요가 매트',     category: 'furniture', price: 150 },

  // ── wallpaper (벽지) — wallpaper_1 은 기본 제공 ────────
  { item_keyword: 'wallpaper_2', item_name: '벽지 2', category: 'wallpaper', price: 300 },

  // ── tile (타일) — tile_1 은 기본 제공 ──────────────────
  { item_keyword: 'tile_2', item_name: '타일 2', category: 'tile', price: 300 },
];

// item_keyword → price 빠른 조회용
const PRICE_MAP = {};
SHOP_ITEMS.forEach(i => { PRICE_MAP[i.item_keyword] = i.price; });

module.exports = { SHOP_ITEMS, PRICE_MAP };

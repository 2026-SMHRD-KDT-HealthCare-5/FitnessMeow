// server/src/config/shopitems.cjs
// 클라이언트 config/shopitems.js 와 반드시 동기화 유지
// item_keyword → DB user_items.item_keyword 와 연결

const SHOP_ITEMS = [
  // ── 가구 (침대·소파·캣타워) ─────────────────────
  { item_keyword: 'bed_cushion',          item_name: '쿠션',        category: '가구',       price: 200 },
  { item_keyword: 'bed_sofa',             item_name: '소파',        category: '가구',       price: 500 },
  { item_keyword: 'cat_tower_wood',       item_name: '원목 캣타워', category: '가구',       price: 350 },
  { item_keyword: 'cat_tower_2',          item_name: '캣타워 2',    category: '가구',       price: 450 },
  { item_keyword: 'cat_tower_condo',      item_name: '캣콘도',      category: '가구',       price: 500 },
  { item_keyword: 'cat_tower_pole',       item_name: '캣폴',        category: '가구',       price: 400 },
  { item_keyword: 'cat_tower_wheel',      item_name: '캣휠',        category: '가구',       price: 600 },

  // ── 고양이 용품 ────────────────────────────────
  { item_keyword: 'toy_ball1',            item_name: '털뭉치 1',    category: '고양이 용품', price: 50  },
  { item_keyword: 'toy_ball2',            item_name: '털뭉치 2',    category: '고양이 용품', price: 80  },
  { item_keyword: 'toy_ball3',            item_name: '털뭉치 3',    category: '고양이 용품', price: 120 },
  { item_keyword: 'toy_mouse',            item_name: '쥐 인형',     category: '고양이 용품', price: 80  },
  { item_keyword: 'toy_scratcher',        item_name: '스크래쳐',    category: '고양이 용품', price: 250 },
  { item_keyword: 'toy_catnippile',       item_name: '캣닢 더미',   category: '고양이 용품', price: 150 },
  { item_keyword: 'toy_catfoodcontainer', item_name: '사료 용기',   category: '고양이 용품', price: 100 },
  { item_keyword: 'toy_toilet',           item_name: '화장실',      category: '고양이 용품', price: 300 },
  { item_keyword: 'toy_waterdispenser',   item_name: '정수기',      category: '고양이 용품', price: 200 },
];

// item_keyword → price 빠른 조회용
const PRICE_MAP = {};
SHOP_ITEMS.forEach(i => { PRICE_MAP[i.item_keyword] = i.price; });

module.exports = { SHOP_ITEMS, PRICE_MAP };

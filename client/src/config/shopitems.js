// config/shopItems.js
// 상점 아이템 마스터 데이터
// DB shop_items 테이블 대신 config로 관리
// item_keyword는 DB user_items.item_keyword와 연결되는 고유 키

export const SHOP_CATEGORIES = ['전체', '가구', '고양이 용품', '벽지', '타일'];

export const SHOP_ITEMS = [

    // ────────────────────────────────
    //  침대 / 소파
    // ────────────────────────────────
    {
        item_keyword : 'bed_cushion',
        item_name    : '쿠션',
        category     : '가구',
        price        : 200,
        icon_name    : 'cushion.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'bed_sofa',
        item_name    : '소파',
        category     : '가구',
        price        : 500,
        icon_name    : 'sofa.png',
        size         : { w: 2, h: 1 },
    },

    // ────────────────────────────────
    //  캣타워
    // ────────────────────────────────
    {
        item_keyword : 'cat_tower_wood',
        item_name    : '원목 캣타워',
        category     : '가구',
        price        : 350,
        icon_name    : 'cattower.png',
        size         : { w: 1, h: 2 },
    },
    {
        item_keyword : 'cat_tower_2',
        item_name    : '캣타워 2',
        category     : '가구',
        price        : 450,
        icon_name    : 'cattower2.png',
        size         : { w: 1, h: 2 },
    },
    {
        item_keyword : 'cat_tower_condo',
        item_name    : '캣콘도',
        category     : '가구',
        price        : 500,
        icon_name    : 'catcondo.png',
        size         : { w: 2, h: 2 },
    },
    {
        item_keyword : 'cat_tower_pole',
        item_name    : '캣폴',
        category     : '가구',
        price        : 400,
        icon_name    : 'catpole.png',
        size         : { w: 1, h: 2 },
    },
    {
        item_keyword : 'cat_tower_wheel',
        item_name    : '캣휠',
        category     : '가구',
        price        : 600,
        icon_name    : 'catwheel.png',
        size         : { w: 2, h: 2 },
    },

    // ────────────────────────────────
    //  고양이 용품
    // ────────────────────────────────
    {
        item_keyword : 'toy_ball1',
        item_name    : '털뭉치 1',
        category     : '고양이 용품',
        price        : 50,
        icon_name    : 'ball1.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_ball2',
        item_name    : '털뭉치 2',
        category     : '고양이 용품',
        price        : 80,
        icon_name    : 'ball2.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_ball3',
        item_name    : '털뭉치 3',
        category     : '고양이 용품',
        price        : 120,
        icon_name    : 'ball3.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_mouse',
        item_name    : '쥐 인형',
        category     : '고양이 용품',
        price        : 80,
        icon_name    : 'mouse.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_scratcher',
        item_name    : '스크래쳐',
        category     : '고양이 용품',
        price        : 250,
        icon_name    : 'scratcher.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_catnippile',
        item_name    : '캣닢 더미',
        category     : '고양이 용품',
        price        : 150,
        icon_name    : 'catnippile.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_catfoodcontainer',
        item_name    : '사료 용기',
        category     : '고양이 용품',
        price        : 100,
        icon_name    : 'catfoodcontainer.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_toilet',
        item_name    : '화장실',
        category     : '고양이 용품',
        price        : 300,
        icon_name    : 'toilet.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_waterdispenser',
        item_name    : '정수기',
        category     : '고양이 용품',
        price        : 200,
        icon_name    : 'waterdispenser.png',
        size         : { w: 1, h: 1 },
    },
];

// config/shopItems.js
// 상점 아이템 마스터 데이터
// DB shop_items 테이블 대신 config로 관리
// item_keyword는 DB user_items.item_keyword와 연결되는 고유 키

export const SHOP_CATEGORIES = ['전체', '침대', '캣타워', '장난감', '벽지'];

export const SHOP_ITEMS = [

    // ────────────────────────────────
    //  침대
    // ────────────────────────────────
    {
        item_keyword : 'bed_basic',
        item_name    : '기본 침대',
        category     : '침대',
        price        : 100,
        icon_name    : 'bed_basic.png',
        size         : { w: 2, h: 1 },   // 방 배치 시 차지하는 그리드 크기
    },
    {
        item_keyword : 'bed_cloud',
        item_name    : '구름 침대',
        category     : '침대',
        price        : 300,
        icon_name    : 'bed_cloud.png',
        size         : { w: 2, h: 1 },
    },
    {
        item_keyword : 'bed_royal',
        item_name    : '로얄 침대',
        category     : '침대',
        price        : 600,
        icon_name    : 'bed_royal.png',
        size         : { w: 2, h: 1 },
    },
    {
        item_keyword : 'bed_cushion',
        item_name    : '쿠션',
        category     : '침대',
        price        : 200,
        icon_name    : 'cushion.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'bed_sofa',
        item_name    : '소파',
        category     : '침대',
        price        : 500,
        icon_name    : 'sofa.png',
        size         : { w: 2, h: 1 },
    },

    // ────────────────────────────────
    //  캣타워
    // ────────────────────────────────
    {
        item_keyword : 'cat_tower_mini',
        item_name    : '미니 캣타워',
        category     : '캣타워',
        price        : 150,
        icon_name    : 'cat_tower_mini.png',
        size         : { w: 1, h: 2 },
    },
    {
        item_keyword : 'cat_tower_medium',
        item_name    : '중형 캣타워',
        category     : '캣타워',
        price        : 350,
        icon_name    : 'cat_tower_medium.png',
        size         : { w: 1, h: 2 },
    },
    {
        item_keyword : 'cat_tower_deluxe',
        item_name    : '디럭스 캣타워',
        category     : '캣타워',
        price        : 700,
        icon_name    : 'cat_tower_deluxe.png',
        size         : { w: 2, h: 3 },
    },
    {
        item_keyword : 'cat_tower_wood',
        item_name    : '원목 캣타워',
        category     : '캣타워',
        price        : 350,
        icon_name    : 'cattower.png',
        size         : { w: 1, h: 2 },
    },
    {
        item_keyword : 'cat_tower_2',
        item_name    : '캣타워 2',
        category     : '캣타워',
        price        : 450,
        icon_name    : 'cattower2.png',
        size         : { w: 1, h: 2 },
    },
    {
        item_keyword : 'cat_tower_condo',
        item_name    : '캣콘도',
        category     : '캣타워',
        price        : 500,
        icon_name    : 'catcondo.png',
        size         : { w: 2, h: 2 },
    },
    {
        item_keyword : 'cat_tower_pole',
        item_name    : '캣폴',
        category     : '캣타워',
        price        : 400,
        icon_name    : 'catpole.png',
        size         : { w: 1, h: 2 },
    },
    {
        item_keyword : 'cat_tower_wheel',
        item_name    : '캣휠',
        category     : '캣타워',
        price        : 600,
        icon_name    : 'catwheel.png',
        size         : { w: 2, h: 2 },
    },
    // ────────────────────────────────
    //  장난감
    // ────────────────────────────────
    {
        item_keyword : 'toy_yarn',
        item_name    : '실뭉치',
        category     : '장난감',
        price        : 50,
        icon_name    : 'toy_yarn.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_mouse',
        item_name    : '쥐 장난감',
        category     : '장난감',
        price        : 80,
        icon_name    : 'toy_mouse.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_feather',
        item_name    : '깃털 막대',
        category     : '장난감',
        price        : 120,
        icon_name    : 'toy_feather.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_fish',
        item_name    : '물고기 인형',
        category     : '장난감',
        price        : 200,
        icon_name    : 'toy_fish.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_scratcher',
        item_name    : '스크래쳐',
        category     : '장난감',
        price        : 250,
        icon_name    : 'scratcher.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_ball1',
        item_name    : '털뭉치 1',
        category     : '장난감',
        price        : 50,
        icon_name    : 'ball1.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_ball2',
        item_name    : '털뭉치 2',
        category     : '장난감',
        price        : 80,
        icon_name    : 'ball2.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_ball3',
        item_name    : '털뭉치 3',
        category     : '장난감',
        price        : 120,
        icon_name    : 'ball3.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_mouse',
        item_name    : '쥐 인형',
        category     : '장난감',
        price        : 80,
        icon_name    : 'mouse.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_catnippile',
        item_name    : '캣닢 더미',
        category     : '장난감',
        price        : 150,
        icon_name    : 'catnippile.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_catfoodcontainer',
        item_name    : '사료 용기',
        category     : '장난감',
        price        : 100,
        icon_name    : 'catfoodcontainer.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_toilet',
        item_name    : '화장실',
        category     : '장난감',
        price        : 300,
        icon_name    : 'toilet.png',
        size         : { w: 1, h: 1 },
    },
    {
        item_keyword : 'toy_waterdispenser',
        item_name    : '정수기',
        category     : '장난감',
        price        : 200,
        icon_name    : 'waterdispenser.png',
        size         : { w: 1, h: 1 },
    },
    // ────────────────────────────────
    //  벽지
    // ────────────────────────────────
    {
        item_keyword : 'wallpaper_basic',
        item_name    : '기본 벽지',
        category     : '벽지',
        price        : 100,
        icon_name    : 'wallpaper_basic.png',
        size         : null,   // 벽지는 배치 개념 없음
    },
    {
        item_keyword : 'wallpaper_stripe',
        item_name    : '줄무늬 벽지',
        category     : '벽지',
        price        : 200,
        icon_name    : 'wallpaper_stripe.png',
        size         : null,
    },
    {
        item_keyword : 'wallpaper_floral',
        item_name    : '꽃무늬 벽지',
        category     : '벽지',
        price        : 300,
        icon_name    : 'wallpaper_floral.png',
        size         : null,
    },
    {
        item_keyword : 'wallpaper_space',
        item_name    : '우주 벽지',
        category     : '벽지',
        price        : 500,
        icon_name    : 'wallpaper_space.png',
        size         : null,
    },
];


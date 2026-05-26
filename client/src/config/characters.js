// config/characters.js  ← 서버 characters.cjs와 반드시 동기화 유지
export const CHARACTER_CONFIG = {
    cheese_korean_shorthair: {
        character_name: '치즈코리안숏헤어',
        max_exp: { lv1: 30, lv2: 45, lv3: 60 },
        unlock_condition: null,
    },
    russian_blue: {
        character_name: '러시안블루',
        max_exp: { lv1: 45, lv2: 60, lv3: 75 },
        unlock_condition: {
            prev_character: 'cheese_korean_shorthair',
            badge: null,
        },
    },
    munchkin: {
        character_name: '먼치킨',
        max_exp: { lv1: 60, lv2: 75, lv3: 90 },
        unlock_condition: {
            prev_character: 'russian_blue',
            badge: null,
        },
    },
};
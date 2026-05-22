// config/characters.js
export const CHARACTER_CONFIG = {
    cheese: {
        character_name: '치즈',
        max_exp: { lv1: 50, lv2: 100, lv3: 150 },
        unlock_condition: null  // 기본 제공
    },
    korean_shorthair: {
        character_name: '코리안숏헤어',
        max_exp: { lv1: 50, lv2: 100, lv3: 150 },
        unlock_condition: {
        prev_character: 'cheese',
        badge: null
        }
    },
    russian_blue: {
        character_name: '러시안블루',
        max_exp: { lv1: 80, lv2: 130, lv3: 180 },
        unlock_condition: {
            prev_character: 'korean_shorthair',
            badge: null
        }
    },
    munchkin: {
        character_name: '먼치킨',
        max_exp: { lv1: 110, lv2: 160, lv3: 210 },
        unlock_condition: {
            prev_character: 'russian_blue',
            badge: null //업적 기능 구현시 +'streak_30'
        }
    }
}
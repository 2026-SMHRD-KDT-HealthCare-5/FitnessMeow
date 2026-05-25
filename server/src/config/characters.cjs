// shared/config/characters.js

// 15회 1 세트 기준으로 경험치 구간 설정

const CHARACTER_CONFIG = {
    cheese_korean_shorthair: {
        character_name: '치즈코리안숏헤어',
        max_exp: { lv1: 30, lv2: 45, lv3: 60 },
        unlock_condition: null
    },
    russian_blue: {
        character_name: '러시안블루',
        max_exp: { lv1: 45, lv2: 60, lv3:  75 },
        unlock_condition: {
            prev_character: 'cheese_korean_shorthair',
            badge: null
        }
    },
    munchkin: {
        character_name: '먼치킨',
        max_exp: { lv1: 60, lv2: 75, lv3: 90 },
        unlock_condition: {
            prev_character: 'russian_blue',
            badge: null
        }
    }
}


const EXERCISE_PART_MAP = {
    pushup: ['chest_exp', 'arm_exp', 'core_exp'],
    squat:  ['lower_exp', 'core_exp'],
    lunge:  ['lower_exp', 'core_exp'],
}

module.exports = { CHARACTER_CONFIG, EXERCISE_PART_MAP };
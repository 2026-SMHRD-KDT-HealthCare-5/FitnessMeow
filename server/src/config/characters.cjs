// shared/config/characters.js

const CHARACTER_CONFIG = {
    cheese_korean_shorthair: {
        character_name: '치즈코리안숏헤어',
        max_exp: { lv1: 50, lv2: 100, lv3: 150 },
        unlock_condition: null
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
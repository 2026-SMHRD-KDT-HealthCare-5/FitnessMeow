// src/utils/catUtils.js
// 캐릭터 이미지 관련 공통 유틸
// Collection.jsx, Info.jsx, Result.jsx 등에서 공유

// 빌드 시점에 모든 캐릭터 레벨별 PNG를 URL 맵으로 로드
// 경로 규칙: assets/characters/{key}/{key}_LV_{level}.png
export const CAT_IMAGES = import.meta.glob(
  '../assets/characters/**/*.png',
  { eager: true, import: 'default' },
);

/**
 * 캐릭터 키와 레벨로 이미지 URL 반환
 * @param {string} key   — 캐릭터 키 (예: "cheese_korean_shorthair")
 * @param {number} level — 레벨 1·2·3
 * @returns {string|null} — URL 또는 null (파일 없으면)
 */
export function getCatUrl(key, level = 1) {
  return CAT_IMAGES[`../assets/characters/${key}/${key}_LV_${level}.png`] ?? null;
}

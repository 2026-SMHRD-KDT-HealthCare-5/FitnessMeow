/**
 * catUtils.js — 캐릭터(고양이) 이미지 관련 공통 유틸
 *
 * 목차:
 *   1. 이미지 번들   — Vite glob import 로 빌드 시 모든 캐릭터 PNG를 URL 맵으로 로드
 *   2. getCatUrl     — 캐릭터 키·레벨로 이미지 URL 반환
 *
 * 사용처:
 *   Collection.jsx, Info.jsx, Result.jsx 등 여러 컴포넌트에서 공유
 */

// ══════════════════════════════════════
// 1. 이미지 번들
//    빌드 시점에 assets/characters/ 하위 모든 PNG를 eager 로 로드해
//    경로 → URL 맵을 생성한다.
//    경로 규칙: assets/characters/{key}/{key}_LV_{level}.png
// ══════════════════════════════════════

// 빌드 시점에 모든 캐릭터 레벨별 PNG를 URL 맵으로 로드
// 경로 규칙: assets/characters/{key}/{key}_LV_{level}.png
export const CAT_IMAGES = import.meta.glob(
  '../assets/characters/**/*.png',
  { eager: true, import: 'default' },
);

// ══════════════════════════════════════
// 2. getCatUrl
//    character_key 와 level 을 조합해 CAT_IMAGES 맵에서 URL을 조회한다.
//    해당 파일이 없으면 null 을 반환한다.
// ══════════════════════════════════════

/**
 * 캐릭터 키와 레벨로 이미지 URL 반환
 * @param {string} key   — 캐릭터 키 (예: "cheese_korean_shorthair")
 * @param {number} level — 레벨 1·2·3
 * @returns {string|null} — URL 또는 null (파일 없으면)
 */
export function getCatUrl(key, level = 1) {
  return CAT_IMAGES[`../assets/characters/${key}/${key}_LV_${level}.png`] ?? null;
}

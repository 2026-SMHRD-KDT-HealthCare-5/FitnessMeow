/**
 * calcCalories.js — 운동 칼로리 계산 유틸
 *
 * 목차:
 *   1. calcCalories   — 운동 타입·체중·키·횟수로 소모 칼로리 계산
 *
 * 계산 공식:
 *   calories = weightKg × (heightCm / 100) × reps × CALORIE_COEFFICIENTS[type]
 *   결과는 소수점 둘째 자리까지 반올림
 */

import { CALORIE_COEFFICIENTS } from '../constants/exerciseConfig';

// ══════════════════════════════════════
// 1. calcCalories
//    운동 타입별 계수(CALORIE_COEFFICIENTS)를 적용해 소모 칼로리를 계산한다.
//    체중(kg) × 신장(m) × 횟수 × 계수 공식을 사용하며, 결과는 소수 2자리로 반올림.
//
//    @param {string} type      — 운동 타입 ('squat' | 'pushup' | 'lunge')
//    @param {number} weightKg  — 사용자 체중 (kg)
//    @param {number} heightCm  — 사용자 신장 (cm)
//    @param {number} reps      — 완료한 운동 횟수
//    @returns {number}         — 소모 칼로리 (kcal, 소수 2자리)
// ══════════════════════════════════════
export function calcCalories(type, weightKg, heightCm, reps) {
  // 신장을 m 단위로 변환 후 체중·횟수·운동별 계수를 곱해 칼로리 산출
  const h = heightCm / 100;
  return +(weightKg * h * reps * CALORIE_COEFFICIENTS[type]).toFixed(2);
}

// src/utils/calcCalories.js
import { CALORIE_COEFFICIENTS } from '../constants/exerciseConfig';

export function calcCalories(type, weightKg, heightCm, reps) {
  const h = heightCm / 100;
  return +(weightKg * h * reps * CALORIE_COEFFICIENTS[type]).toFixed(2);
}
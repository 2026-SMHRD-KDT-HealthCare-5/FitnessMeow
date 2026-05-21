// src/utils/exerciseApi.js

// 하드코딩 제거 → env 변수로 관리 (보안)
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function postWorkoutWithRetry(workoutData, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(workoutData),
      });

      if (response.ok) return;
    } catch {}

    if (attempt < maxAttempts) await wait(250);
  }

  throw new Error('운동 기록 저장 실패');
}
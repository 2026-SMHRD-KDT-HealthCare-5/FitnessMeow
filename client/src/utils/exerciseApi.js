/**
 * exerciseApi.js — 운동 기록 API 통신 유틸
 *
 * 목차:
 *   1. 설정          — API 기본 URL, 대기 함수
 *   2. postWorkoutWithRetry — 운동 기록 저장 (재시도 포함)
 */

// ══════════════════════════════════════
// 1. 설정
//    API_URL: 환경변수 VITE_API_URL 우선 사용, 없으면 localhost:3001 폴백
//    wait: 재시도 간격 대기용 Promise 래퍼
// ══════════════════════════════════════

// 하드코딩 제거 → env 변수로 관리 (보안)
const API = '';

// ms 만큼 대기하는 Promise 반환 (재시도 간격 조절용)
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ══════════════════════════════════════
// 2. postWorkoutWithRetry
//    POST /api/workouts 호출 후 실패 시 250ms 간격으로 최대 maxAttempts 번 재시도한다.
//    모든 시도 실패 시 '운동 기록 저장 실패' 오류를 throw 한다.
//
//    @param {object} workoutData  — { type, reps, calories, ... } 서버로 전송할 운동 데이터
//    @param {number} maxAttempts  — 최대 재시도 횟수 (기본: 3)
//    @returns {Promise<object>}   — 서버 응답 JSON
// ══════════════════════════════════════
export async function postWorkoutWithRetry(workoutData, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(workoutData),
      });

      // 응답이 정상이면 JSON 파싱 후 즉시 반환
      if (response.ok) return response.json();
    } catch {}

    // 마지막 시도가 아니면 250ms 대기 후 재시도
    if (attempt < maxAttempts) await wait(250);
  }

  throw new Error('운동 기록 저장 실패');
}

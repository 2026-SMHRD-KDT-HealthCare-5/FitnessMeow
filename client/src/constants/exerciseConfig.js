/**
 * exerciseConfig.js — 운동 기능 전역 설정 상수
 *
 * 목차:
 *   1. MediaPipe 스크립트 URL   — CDN 주소 목록
 *   2. 운동 로직 파일 경로       — EXERCISE_LOGIC_FILES
 *   3. 운동 메타데이터           — EXERCISES (이름 등)
 *   4. 칼로리 계수               — CALORIE_COEFFICIENTS
 *   5. 로직 타입 맵              — LOGIC_BY_TYPE
 *   6. 헬퍼 함수 소스            — EXERCISE_LOGIC_HELPERS (string, new Function 주입용)
 */

// ══════════════════════════════════════
// 1. MediaPipe 스크립트 URL
//    scriptLoader.loadScript 로 동적 로드할 CDN 스크립트 순서 목록.
//    순서 중요: drawing_utils → camera_utils → pose 순으로 로드해야 함.
// ══════════════════════════════════════
export const MEDIAPIPE_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
];

// ══════════════════════════════════════
// 2. 운동 로직 파일 경로
//    scriptLoader.loadExerciseLogicFiles 에서 fetch 할 파일 경로와
//    해당 파일의 전역 함수 이름을 정의한다.
//    src: Vite dev 서버 기준 public 경로 (빌드 시 /src/ 경로 접근 방식에 주의)
// ══════════════════════════════════════
export const EXERCISE_LOGIC_FILES = {
  squat:  { src: '/exercises/squats.js',  globalName: 'squatsLogic' },
  pushup: { src: '/exercises/push_up.js', globalName: 'pushUpLogic' },
  lunge:  { src: '/exercises/lunges.js',  globalName: 'lungesLogic' },
};

// ══════════════════════════════════════
// 3. 운동 메타데이터
//    UI 표시용 운동 이름 등 부가 정보
// ══════════════════════════════════════
export const EXERCISES = {
  squat:  { name: '스쿼트' },
  pushup: { name: '푸쉬업' },
  lunge:  { name: '런지'   },
};

// ══════════════════════════════════════
// 4. 칼로리 계수
//    calcCalories.js 에서 사용.
//    calories = weightKg × (heightCm/100) × reps × coefficient
// ══════════════════════════════════════
export const CALORIE_COEFFICIENTS = {
  squat:  0.0020,
  pushup: 0.0009,
  lunge:  0.0016,
};

// ══════════════════════════════════════
// 5. 로직 타입 맵
//    운동 타입 문자열 → __fitnessMeowLogic 키 매핑
//    현재 1:1 매핑이므로 직접 타입 문자열 사용과 동일하지만, 확장성을 위해 분리 유지
// ══════════════════════════════════════
export const LOGIC_BY_TYPE = {
  squat:  'squat',
  pushup: 'pushup',
  lunge:  'lunge',
};

// ══════════════════════════════════════
// 6. 헬퍼 함수 소스 (문자열)
//    loadExerciseLogicFiles 에서 new Function 으로 운동 로직 파일과 함께 주입되는
//    공통 헬퍼 함수 소스 코드.
//
//    포함 함수:
//      interp(value, [min1,max1], [min2,max2]) — 선형 보간
//      angleBetween(p1, p2, p3)               — 세 점으로 이루어진 각도 계산 (0~180°)
//      getPoint(landmarks, index, width, height) — MediaPipe 랜드마크 → 픽셀 좌표 변환
//      getPercent(angle, minAngle, maxAngle)   — 각도를 0~100% 범위로 정규화
// ══════════════════════════════════════
export const EXERCISE_LOGIC_HELPERS = `
function interp(value, [min1, max1], [min2, max2]) {
  const ratio = (value - min1) / (max1 - min1);
  return min2 + ratio * (max2 - min2);
}
function angleBetween(p1, p2, p3) {
  let angle = Math.abs(
    (Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x)) *
      (180 / Math.PI)
  );
  if (angle > 360) angle %= 360;
  if (angle < 0)   angle += 360;
  if (angle > 180) angle  = 360 - angle;
  return angle;
}
function getPoint(landmarks, index, width, height) {
  const lm = landmarks[index];
  return { x: lm.x * width, y: lm.y * height };
}
function getPercent(angle, minAngle, maxAngle) {
  return Math.max(0, Math.min(100, interp(angle, [minAngle, maxAngle], [0, 100])));
}
`;

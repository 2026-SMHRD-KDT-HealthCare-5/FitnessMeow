// src/constants/exerciseConfig.js

export const MEDIAPIPE_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
];

export const EXERCISE_LOGIC_FILES = {
  squat:  { src: '/src/exercises/squats.js',  globalName: 'squatsLogic' },
  pushup: { src: '/src/exercises/push_up.js', globalName: 'pushUpLogic' },
  lunge:  { src: '/src/exercises/lunges.js',  globalName: 'lungesLogic' },
};

export const EXERCISES = {
  squat:  { name: '스쿼트' },
  pushup: { name: '푸쉬업' },
  lunge:  { name: '런지'   },
};

export const CALORIE_COEFFICIENTS = {
  squat:  0.0020,
  pushup: 0.0009,
  lunge:  0.0016,
};

export const LOGIC_BY_TYPE = {
  squat:  'squat',
  pushup: 'pushup',
  lunge:  'lunge',
};

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
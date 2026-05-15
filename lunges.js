function lungesLogic(landmarks, width, height) {
  const points = {
    leftShoulder: getPoint(landmarks, 11, width, height),
    rightShoulder: getPoint(landmarks, 12, width, height),
    leftHip: getPoint(landmarks, 23, width, height),
    rightHip: getPoint(landmarks, 24, width, height),
    leftKnee: getPoint(landmarks, 25, width, height),
    rightKnee: getPoint(landmarks, 26, width, height),
    leftAnkle: getPoint(landmarks, 27, width, height),
    rightAnkle: getPoint(landmarks, 28, width, height),
    leftToe: getPoint(landmarks, 31, width, height),
    rightToe: getPoint(landmarks, 32, width, height),
  };

  const legAngles = {
    left: angleBetween(points.leftHip, points.leftKnee, points.leftAnkle),
    right: angleBetween(points.rightHip, points.rightKnee, points.rightAnkle),
  };

  const hipAngles = {
    left: angleBetween(points.leftShoulder, points.leftHip, points.leftKnee),
    right: angleBetween(points.rightShoulder, points.rightHip, points.rightKnee),
  };

  const leftPer = getPercent(legAngles.left, 85, 170);
  const rightPer = getPercent(legAngles.right, 85, 170);
  const avgPer = (leftPer + rightPer) / 2;

  const shoulderDist = Math.abs(points.leftShoulder.x - points.rightShoulder.x);
  const hipDist = Math.abs(points.leftHip.x - points.rightHip.x);
  const sideView = shoulderDist < width * 0.28 && hipDist < width * 0.22;

  const stride = Math.abs(points.leftAnkle.x - points.rightAnkle.x);
  const enoughStride = stride > width * 0.12;
  const leftDepthGap = Math.abs(legAngles.left - 92);
  const rightDepthGap = Math.abs(legAngles.right - 92);
  const frontSide = leftDepthGap <= rightDepthGap ? 'left' : 'right';
  const rearSide = frontSide === 'left' ? 'right' : 'left';
  const frontKneeAngle = legAngles[frontSide];
  const rearKneeAngle = legAngles[rearSide];
  const frontHipAngle = hipAngles[frontSide];
  const rearHipAngle = hipAngles[rearSide];
  const frontKnee = points[`${frontSide}Knee`];
  const frontToe = points[`${frontSide}Toe`];
  const frontAnkle = points[`${frontSide}Ankle`];

  const isStanding = legAngles.left > 155 && legAngles.right > 155;
  const properDepth = frontKneeAngle >= 80 && frontKneeAngle <= 105;
  const rearLegBent = rearKneeAngle >= 75 && rearKneeAngle <= 145;
  const properTorso = frontHipAngle >= 145 || rearHipAngle >= 145;
  const toeDirection = Math.sign(frontToe.x - frontAnkle.x);
  const kneeOverToe = toeDirection !== 0 && (frontKnee.x - frontToe.x) * toeDirection > width * 0.03;
  const properLungeForm = sideView && enoughStride && properDepth && rearLegBent && properTorso && !kneeOverToe;
  const grade = properLungeForm ? '퍼펙트' : '그냥저냥';

  let feedback = '';

  if (!sideView) {
    feedback = '옆모습을 보여주세요.';
    return { count, dir, feedback, avgPer, grade };
  }

  if (properDepth && enoughStride && properTorso && dir === 0) {
    count += 0.5;
    dir = 1;
  }

  if (isStanding && dir === 1) {
    count += 0.5;
    dir = 0;
  }

  if (!enoughStride) feedback = '발을 더 넓게 내딛으세요.';
  else if (!properTorso) feedback = '몸통을 곧게 세우세요.';
  else if (kneeOverToe) feedback = '앞무릎이 발끝보다 너무 앞으로 나갔습니다.';
  else if (!rearLegBent && dir === 0) feedback = '뒤쪽 무릎도 함께 굽혀주세요.';
  else if (!properDepth && dir === 0) feedback = '앞무릎이 90도에 가까워지도록 더 내려가세요.';

  return { count, dir, feedback, avgPer, grade };
}

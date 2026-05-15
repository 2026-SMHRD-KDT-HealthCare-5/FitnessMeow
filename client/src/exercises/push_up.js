function pushUpLogic(landmarks, width, height) {
  const armAngles = {
    left: angleBetween(
      getPoint(landmarks, 11, width, height),
      getPoint(landmarks, 13, width, height),
      getPoint(landmarks, 15, width, height)
    ),
    right: angleBetween(
      getPoint(landmarks, 12, width, height),
      getPoint(landmarks, 14, width, height),
      getPoint(landmarks, 16, width, height)
    ),
  };

  const bodyAngles = {
    left: angleBetween(
      getPoint(landmarks, 11, width, height),
      getPoint(landmarks, 23, width, height),
      getPoint(landmarks, 25, width, height)
    ),
    right: angleBetween(
      getPoint(landmarks, 12, width, height),
      getPoint(landmarks, 24, width, height),
      getPoint(landmarks, 26, width, height)
    ),
  };
  const leftKnee = getPoint(landmarks, 25, width, height);
  const rightKnee = getPoint(landmarks, 26, width, height);

  const leftPer = getPercent(armAngles.left, 85, 165);
  const rightPer = getPercent(armAngles.right, 85, 165);
  const avgPer = (leftPer + rightPer) / 2;
  const bodyAligned = bodyAngles.left > 150 && bodyAngles.right > 150;
  const bodyTilted = bodyAngles.left < 140 || bodyAngles.right < 140;
  let feedback = '';

  if (avgPer > 95 && dir === 0) {
    // === 새로운 추가된 로직: 푸시업 횟수는 자세가 좋지 않아도 계산 ===
    if (count > 0) {
      count += 0.5;
    }
    // === 새로운 추가된 로직 끝 ===
    dir = 1;
  }
  if (avgPer < 5 && dir === 1) {
    count += 0.5;
    dir = 0;
  }

  // === 새로운 추가된 로직: 자세 결함 감지 (엉덩이 처짐 / 엉덩이 솟구침) ===
  const leftShoulder = getPoint(landmarks, 11, width, height);
  const rightShoulder = getPoint(landmarks, 12, width, height);
  const leftHip = getPoint(landmarks, 23, width, height);
  const rightHip = getPoint(landmarks, 24, width, height);
  const leftSagging = leftHip.y > (leftShoulder.y + leftKnee.y) / 2 + height * 0.03;
  const rightSagging = rightHip.y > (rightShoulder.y + rightKnee.y) / 2 + height * 0.03;
  const leftPike = leftHip.y < (leftShoulder.y + leftKnee.y) / 2 - height * 0.03;
  const rightPike = rightHip.y < (rightShoulder.y + rightKnee.y) / 2 - height * 0.03;
  const saggingHips = leftSagging || rightSagging;
  const pikeHips = leftPike || rightPike;
  const issueDetected = saggingHips || pikeHips;
  // === 새로운 추가된 로직 끝 ===

  // === 새로운 추가된 로직: 스쿼트와 비슷한 푸시업 등급 계산 ===
  const grade = !issueDetected && bodyAligned ? '퍼펙트' : '그냥저냥';
  // === 새로운 추가된 로직 끝 ===

  if (saggingHips) {
    feedback = '엉덩이가 처졌습니다. 코어를 조이고 몸을 일직선으로 유지하세요.';
    return { count, dir, feedback, avgPer, grade };
  }
  if (pikeHips) {
    feedback = '엉덩이가 솟구쳤습니다. 체중을 가슴 쪽으로 이동하세요.';
    return { count, dir, feedback, avgPer, grade };
  }

  if (!bodyAligned && bodyTilted) {
    feedback = '몸을 곧게 유지하세요!';
  }

  return { count, dir, feedback, avgPer, grade };
}

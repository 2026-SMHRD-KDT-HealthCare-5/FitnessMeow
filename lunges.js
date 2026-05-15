function lungesLogic(landmarks, width, height) {
  const legAngles = {
    left: angleBetween(
      getPoint(landmarks, 23, width, height),
      getPoint(landmarks, 25, width, height),
      getPoint(landmarks, 27, width, height)
    ),
    right: angleBetween(
      getPoint(landmarks, 24, width, height),
      getPoint(landmarks, 26, width, height),
      getPoint(landmarks, 28, width, height)
    ),
  };

  const hipAngles = {
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

  const leftPer = getPercent(legAngles.left, 85, 170);
  const rightPer = getPercent(legAngles.right, 85, 170);

  // 한쪽이 앞무릎(~90°), 반대쪽이 뒷무릎(~90°)인지 체크
  const isLungeDown =
    (legAngles.left >= 80 && legAngles.left <= 100) ||
    (legAngles.right >= 80 && legAngles.right <= 100);

  // 서 있는 상태: 양쪽 다리가 펴짐
  const isStanding =
    legAngles.left > 155 && legAngles.right > 155;

  const properTorso = hipAngles.left >= 160 || hipAngles.right >= 160;

  // 런지 고유 grade 기준:
  // 1. 몸통 직립 유지 (properTorso)
  // 2. 앞무릎이 80~100도로 충분히 내려감 (isLungeDown)
  // 3. 앞/뒷무릎 각도 차이가 30도 이상 (한 발이 확실히 앞으로 나간 상태)
  const legAngleDiff = Math.abs(legAngles.left - legAngles.right);
  const properLungeForm = isLungeDown && legAngleDiff >= 30;
  const grade = properTorso && properLungeForm ? '퍼펙트' : '그냥저냥';

  let feedback = '';

  // 내려갔을 때 (down)
  if (isLungeDown && properTorso && dir === 0) {
    count += 0.5;
    dir = 1;
  }

  // 올라왔을 때 (up)
  if (isStanding && dir === 1) {
    count += 0.5;
    dir = 0;
  }

  if (!properTorso) feedback = '몸통을 곧게 유지하세요!';
  else if (isLungeDown && legAngleDiff < 30) feedback = '발을 더 넓게 내딛으세요!';
  else if (!isLungeDown && dir === 0) feedback = '더 깊게 내려가세요!';

  return { count, dir, feedback, avgPer: (leftPer + rightPer) / 2, grade };
}
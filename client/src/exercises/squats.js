function squatsLogic(landmarks, width, height) {
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

  const leftPer = getPercent(legAngles.left, 90, 170);//무릎이 90도 이상으로 굽혀졌는지 판단하기 위한 퍼센트 계산
  const rightPer = getPercent(legAngles.right, 90, 170);//무릎이 90도 이상으로 굽혀졌는지 판단하기 위한 퍼센트 계산
  const avgPer = (leftPer + rightPer) / 2;//무릎이 90도 이상으로 굽혀졌는지 판단하기 위한 퍼센트 계산
  const properDepth = legAngles.left >= 90 && legAngles.left <= 110 && legAngles.right >= 90 && legAngles.right <= 110;
  const properHip = hipAngles.left >= 90 && hipAngles.right >= 90;

  // === 새로운 추가된 로직: 무릎(25/26)이 발끝(31/32)보다 앞으로 나가면 나쁜 자세로 판단 ===
  const leftKnee = getPoint(landmarks, 25, width, height);
  const leftToe = getPoint(landmarks, 31, width, height);
  const rightKnee = getPoint(landmarks, 26, width, height);
  const rightToe = getPoint(landmarks, 32, width, height);
  const leftAnkle = getPoint(landmarks, 27, width, height);
  const rightAnkle = getPoint(landmarks, 28, width, height);
  const threshold = 0.04 * width; // 화면 너비의 4% 이상 차이가 날 때만 판정

  const leftToeMoreFront = leftToe.x > rightToe.x;//왼쪽 발이 오른발 보다 더 앞으로 나갔는지 여부 판단
  const rightToeMoreFront = rightToe.x < leftToe.x;//오른쪽 발이 왼발 보다 더 앞으로 나갔는지 여부 판단
  const leftKneeOverToe = leftKnee.x - leftToe.x > threshold || leftKnee.x - leftAnkle.x > threshold;
//왼쪽 무릎이 왼쪽 발끝보다 앞으로 나갔는지, 또는 왼쪽 무릎이 왼쪽 발목보다 앞으로 나갔는지 판단
  const rightKneeOverToe = rightToe.x - rightKnee.x > threshold || rightAnkle.x - rightKnee.x > threshold;
  //오른쪽 무릎이 오른쪽 발끝보다 앞으로 나갔는지, 또는 오른쪽 무릎이 오른쪽 발목보다 앞으로 나갔는지 판단
  const kneeOverToe = leftToeMoreFront ? leftKneeOverToe : rightToeMoreFront ? rightKneeOverToe : leftKneeOverToe || rightKneeOverToe;
  //왼발이 더 앞으로 나갔으면 왼쪽 무릎이 발끝보다 앞으로 나갔는지 판단, 오른발이 더 앞으로 나갔으면 오른쪽 무릎이 발끝보다 앞으로 나갔는지 판단, 둘 다 비슷하면 둘 중 하나라도 무릎이 발끝보다 앞으로 나갔는지 판단

  // === 새로운 추가된 로직: 스쿼트 등급을 계산하여 오른쪽 상단에 표시 ===
  const grade = !kneeOverToe ? '퍼펙트' : '그냥저냥';
  // === 새로운 추가된 로직 끝 ===

  let feedback = '';

  // === 새로운 추가된 로직: 앞모습이면 옆모습을 보여주세요 경고, 횟수 측정 차단 ===
  const leftShoulder = getPoint(landmarks, 11, width, height);
  const rightShoulder = getPoint(landmarks, 12, width, height);
  const leftHip = getPoint(landmarks, 23, width, height);
  const rightHip = getPoint(landmarks, 24, width, height);
  const shoulderDist = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipDist = Math.abs(leftHip.x - rightHip.x);
  const frontView = shoulderDist < width * 0.22 && hipDist < width * 0.22;
  if (frontView) {
    feedback = '옆모습을 보여주세요.';
    return { count, dir, feedback, avgPer, grade };
  }
  // === 새로운 추가된 로직 끝 ===

  if (avgPer > 95 && dir === 0) {
    // === 새로운 추가된 로직: 처음 서 있는 상태에서 바로 0.5가 올라가지 않도록 처리 ===
    if (count > 0) {
      count += 0.5;
    }
    // === 새로운 추가된 로직 끝 ===
    dir = 1;
  }//일어나는 동작이 완성되었는지 판단하는 로직
  if (properDepth && properHip && dir === 1) {
    count += 0.5;
    dir = 0;
  }//앉는 동작이 완성되었는지 판단하는 로직

  if (kneeOverToe) feedback = '무릎이 발끝보다 앞으로 나갔습니다!';
  else if (!properHip) feedback = '힙 힌지를 유지하세요!';
  else if (Math.abs(leftPer - rightPer) > 15) feedback = '무게 중심을 고르게 유지하세요!';

  return { count, dir, feedback, avgPer, grade };
}

/**
 * squats.js — 스쿼트 운동 포즈 인식 로직
 *
 * 목차:
 *   1. 각도 계산    — 무릎(legAngles)·고관절(hipAngles) 각도 측정
 *   2. 정면 감지    — 옆모습이 아닌 정면 촬영 시 경고 및 측정 차단
 *   3. 무릎 과신전  — 무릎이 발끝보다 앞으로 나갔는지 판단
 *   4. 횟수 카운트  — 내려갔다 올라오면 +1 (0.5씩 누적)
 *   5. 피드백       — 자세 오류 메시지 생성
 *   6. 자세 등급    — repHadIssue 기반으로 '퍼펙트' / '그냥저냥' 결정
 *
 * 실행 환경:
 *   scriptLoader.loadExerciseLogicFiles 에서 new Function 으로 로드됨.
 *   count, dir, repHadIssue 변수와 헬퍼(angleBetween, getPoint, getPercent)가
 *   클로저 스코프에 미리 주입되어 있다.
 *
 * 반환값: { count, dir, feedback, avgPer, grade }
 *
 * 사용 랜드마크 인덱스 (MediaPipe Pose):
 *   11/12 — 어깨(좌/우)   23/24 — 골반(좌/우)
 *   25/26 — 무릎(좌/우)   27/28 — 발목(좌/우)
 *   31/32 — 발끝(좌/우)
 */
function squatsLogic(landmarks, width, height) {
  // 이번 프레임 이전의 정수 횟수 — 횟수 완성 시점 감지에 사용
  const previousWholeCount = Math.floor(count + 1e-6);

  // ══════════════════════════════════════
  // 1. 각도 계산
  //    legAngles: 골반-무릎-발목 각도 → 무릎 굽힘 정도 (90~110° = 올바른 스쿼트 깊이)
  //    hipAngles: 어깨-골반-무릎 각도 → 힙 힌지 여부 (90° 이상이면 적절)
  // ══════════════════════════════════════

  // 무릎 각도 계산 (골반-무릎-발목)
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

  // 고관절 각도 계산 (어깨-골반-무릎) → 힙 힌지 여부 판단
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

  // 무릎이 90도 이상으로 굽혀졌는지 판단하기 위한 퍼센트 계산
  const leftPer = getPercent(legAngles.left, 90, 170);//무릎이 90도 이상으로 굽혀졌는지 판단하기 위한 퍼센트 계산
  const rightPer = getPercent(legAngles.right, 90, 170);//무릎이 90도 이상으로 굽혀졌는지 판단하기 위한 퍼센트 계산
  const avgPer = (leftPer + rightPer) / 2;//무릎이 90도 이상으로 굽혀졌는지 판단하기 위한 퍼센트 계산
  // 올바른 스쿼트 깊이: 무릎이 90~110° 범위에 들어왔는지
  const properDepth = legAngles.left >= 90 && legAngles.left <= 110 && legAngles.right >= 90 && legAngles.right <= 110;
  // 힙 힌지 여부: 좌우 고관절 각도 모두 90° 이상
  const properHip = hipAngles.left >= 90 && hipAngles.right >= 90;

  // ══════════════════════════════════════
  // 3. 무릎 과신전 감지
  //    무릎(25/26)이 발끝(31/32) 또는 발목(27/28)보다 앞으로 나가면 나쁜 자세로 판단.
  //    threshold: 화면 너비의 4% 이상 차이가 날 때만 판정 (노이즈 방지)
  // ══════════════════════════════════════

  // === 새로운 추가된 로직: 무릎(25/26)이 발끝(31/32)보다 앞으로 나가면 나쁜 자세로 판단 ===
  const leftKnee = getPoint(landmarks, 25, width, height);
  const leftToe = getPoint(landmarks, 31, width, height);
  const rightKnee = getPoint(landmarks, 26, width, height);
  const rightToe = getPoint(landmarks, 32, width, height);
  const leftAnkle = getPoint(landmarks, 27, width, height);
  const rightAnkle = getPoint(landmarks, 28, width, height);
  const threshold = 0.04 * width; // 화면 너비의 4% 이상 차이가 날 때만 판정

  const leftToeMoreFront = leftToe.x > rightToe.x;//왼쪽 발이 오른발 보다 더 앞으로 나갔는지 여부 판단
  const rightToeMoreFront = rightToe.x > leftToe.x;//오른쪽 발이 왼발 보다 더 앞으로 나갔는지 여부 판단
  const leftKneeOverToe = leftKnee.x - leftToe.x > threshold || leftKnee.x - leftAnkle.x > threshold;
//왼쪽 무릎이 왼쪽 발끝보다 앞으로 나갔는지, 또는 왼쪽 무릎이 왼쪽 발목보다 앞으로 나갔는지 판단
  const rightKneeOverToe = rightToe.x - rightKnee.x > threshold || rightAnkle.x - rightKnee.x > threshold;
  //오른쪽 무릎이 오른쪽 발끝보다 앞으로 나갔는지, 또는 오른쪽 무릎이 오른쪽 발목보다 앞으로 나갔는지 판단
  const kneeOverToe = leftToeMoreFront ? leftKneeOverToe : rightToeMoreFront ? rightKneeOverToe : leftKneeOverToe || rightKneeOverToe;
  //왼발이 더 앞으로 나갔으면 왼쪽 무릎이 발끝보다 앞으로 나갔는지 판단, 오른발이 더 앞으로 나갔으면 오른쪽 무릎이 발끝보다 앞으로 나갔는지 판단, 둘 다 비슷하면 둘 중 하나라도 무릎이 발끝보다 앞으로 나갔는지 판단

  let feedback = '';

  // ══════════════════════════════════════
  // 2. 정면 감지 — 측정 차단
  //    어깨 간격 / 골반 간격이 화면 너비의 22% 이상이면 정면을 보고 있다고 판단.
  //    정면에서는 무릎·고관절 각도를 정확히 측정할 수 없으므로 즉시 반환한다.
  // ══════════════════════════════════════

  // === 새로운 추가된 로직: 앞모습이면 옆모습을 보여주세요 경고, 횟수 측정 차단 ===
  const leftShoulder = getPoint(landmarks, 11, width, height);
  const rightShoulder = getPoint(landmarks, 12, width, height);
  const leftHip = getPoint(landmarks, 23, width, height);
  const rightHip = getPoint(landmarks, 24, width, height);
  // 어깨·골반 x좌표 간격이 너무 크면 정면 촬영으로 판단
  const shoulderDist = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipDist = Math.abs(leftHip.x - rightHip.x);
  const frontView = shoulderDist > width * 0.22 && hipDist > width * 0.22;
  if (frontView) {
    feedback = '옆모습을 보여주세요.';
    return { count, dir, feedback, avgPer };
  }
  // === 새로운 추가된 로직 끝 ===

  // ══════════════════════════════════════
  // 4. 횟수 카운트
  //    올라가기(avgPer>95, dir=0→1): count > 0 인 경우에만 +0.5 (첫 서기 상태 방지)
  //    내려가기(properDepth && properHip, dir=1→0): +0.5
  // ══════════════════════════════════════

  if (avgPer > 95 && dir === 0) {
    // === 새로운 추가된 로직: 처음 서 있는 상태에서 바로 0.5가 올라가지 않도록 처리 ===
    if (count > 0) {
      count += 0.5;
    }
    // === 새로운 추가된 로직 끝 ===
    dir = 1;
  }//일어나는 동작이 완성되었는지 판단하는 로직
  // 앉는 동작이 완성되었는지 판단 (올바른 깊이 + 힙 힌지)
  if (properDepth && properHip && dir === 1) {
    count += 0.5;
    dir = 0;
  }//앉는 동작이 완성되었는지 판단하는 로직

  // ══════════════════════════════════════
  // 5, 6. 피드백 및 등급
  //    피드백 우선순위: 무릎 과신전 > 힙 힌지 > 좌우 불균형
  //    repHadIssue: 한 횟수 내에서 무릎 과신전이 있었으면 true → '그냥저냥'
  //    횟수 완성 시(정수 올라갈 때) repHadIssue 리셋
  // ══════════════════════════════════════

  if (kneeOverToe) feedback = '무릎이 발끝보다 앞으로 나갔습니다!';
  else if (!properHip) feedback = '힙 힌지를 유지하세요!';
  else if (Math.abs(leftPer - rightPer) > 15) feedback = '무게 중심을 고르게 유지하세요!';

  // 무릎 과신전 발생 시 이번 렙에 이슈 표시
  if (kneeOverToe) {
    repHadIssue = true;
  }

  // 횟수가 완성(정수 증가)되면 다음 렙을 위해 이슈 플래그 리셋
  const grade = repHadIssue ? '그냥저냥' : '퍼펙트';
  if (Math.floor(count + 1e-6) > previousWholeCount) {
    repHadIssue = false;
  }

  return { count, dir, feedback, avgPer, grade };
}

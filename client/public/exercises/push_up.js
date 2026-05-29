/**
 * push_up.js — 푸쉬업 운동 포즈 인식 로직
 *
 * 목차:
 *   1. 각도 계산    — 팔꿈치(armAngles)·몸통(bodyAngles) 각도 측정
 *   2. 상태 판단    — 내려가기(avgPer>95) / 올라오기(avgPer<5)
 *   3. 자세 결함 감지 — 엉덩이 처짐 / 엉덩이 솟구침 감지
 *   4. 자세 등급    — 자세 결함 없고 몸통 정렬 시 '퍼펙트'
 *   5. 횟수 카운트  — 내려갔다 올라오면 +1 (0.5씩 누적)
 *   6. 피드백       — 자세 오류 메시지 생성
 *
 * 실행 환경:
 *   scriptLoader.loadExerciseLogicFiles 에서 new Function 으로 로드됨.
 *   count, dir 변수와 헬퍼(angleBetween, getPoint, getPercent)가
 *   클로저 스코프에 미리 주입되어 있다.
 *
 * 반환값: { count, dir, feedback, avgPer, grade }
 *
 * 사용 랜드마크 인덱스 (MediaPipe Pose):
 *   11/12 — 어깨(좌/우)   13/14 — 팔꿈치(좌/우)
 *   15/16 — 손목(좌/우)   23/24 — 골반(좌/우)
 *   25/26 — 무릎(좌/우)
 */
function pushUpLogic(landmarks, width, height) {
  // ══════════════════════════════════════
  // 1. 각도 계산
  //    armAngles:  어깨-팔꿈치-손목 각도 → 팔 굽힘 정도 (85°=완전히 내려감, 165°=완전히 올라감)
  //    bodyAngles: 어깨-골반-무릎 각도  → 몸통 직선 여부 (150° 이상이면 일직선)
  // ══════════════════════════════════════

  // 팔꿈치 각도 계산 (어깨-팔꿈치-손목)
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

  // 몸통 각도 계산 (어깨-골반-무릎) → 몸이 일직선인지 판단
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
  // 무릎 포인트 (엉덩이 처짐/솟구침 계산에 사용)
  const leftKnee = getPoint(landmarks, 25, width, height);
  const rightKnee = getPoint(landmarks, 26, width, height);

  // 팔꿈치 각도를 0~100% 범위로 정규화 (85°=0%, 165°=100%)
  const leftPer = getPercent(armAngles.left, 85, 165);
  const rightPer = getPercent(armAngles.right, 85, 165);
  const avgPer = (leftPer + rightPer) / 2;
  // 몸통 정렬 판단 — 좌우 모두 150° 이상이면 일직선
  const bodyAligned = bodyAngles.left > 150 && bodyAngles.right > 150;
  // 몸통 기울기 판단 — 좌우 중 하나라도 140° 미만이면 기울어짐
  const bodyTilted = bodyAngles.left < 140 || bodyAngles.right < 140;
  let feedback = '';

  // ══════════════════════════════════════
  // 2. 횟수 카운트
  //    내려가기(avgPer>95, dir=0→1): count > 0 인 경우에만 +0.5 (처음 서 있는 상태 방지)
  //    올라오기(avgPer<5, dir=1→0): +0.5
  // ══════════════════════════════════════

  if (avgPer > 95 && dir === 0) {
    // === 새로운 추가된 로직: 푸시업 횟수는 자세가 좋지 않아도 계산 ===
    // 처음 서 있는 상태에서 바로 0.5가 올라가지 않도록 count > 0 조건 부여
    if (count > 0) {
      count += 0.5;
    }
    // === 새로운 추가된 로직 끝 ===
    dir = 1;
  }
  // 올라왔을 때 (up) — 팔이 완전히 펴진 상태
  if (avgPer < 5 && dir === 1) {
    count += 0.5;
    dir = 0;
  }

  // ══════════════════════════════════════
  // 3. 자세 결함 감지
  //    어깨·골반·무릎 y좌표 기반으로 엉덩이 위치가 이상적 높이에서 벗어났는지 판단.
  //    threshold: 화면 높이의 3% 이상 차이가 날 때만 결함으로 판정
  // ══════════════════════════════════════

  // === 새로운 추가된 로직: 자세 결함 감지 (엉덩이 처짐 / 엉덩이 솟구침) ===
  const leftShoulder = getPoint(landmarks, 11, width, height);
  const rightShoulder = getPoint(landmarks, 12, width, height);
  const leftHip = getPoint(landmarks, 23, width, height);
  const rightHip = getPoint(landmarks, 24, width, height);
  // 엉덩이가 어깨-무릎 중간선보다 아래에 있으면 처짐
  const leftSagging = leftHip.y > (leftShoulder.y + leftKnee.y) / 2 + height * 0.03;
  const rightSagging = rightHip.y > (rightShoulder.y + rightKnee.y) / 2 + height * 0.03;
  // 엉덩이가 어깨-무릎 중간선보다 위에 있으면 솟구침
  const leftPike = leftHip.y < (leftShoulder.y + leftKnee.y) / 2 - height * 0.03;
  const rightPike = rightHip.y < (rightShoulder.y + rightKnee.y) / 2 - height * 0.03;
  const saggingHips = leftSagging || rightSagging;
  const pikeHips = leftPike || rightPike;
  const issueDetected = saggingHips || pikeHips;
  // === 새로운 추가된 로직 끝 ===

  // ══════════════════════════════════════
  // 4. 자세 등급
  //    자세 결함(issueDetected)이 없고 몸통 정렬(bodyAligned)이 올바르면 '퍼펙트'
  // ══════════════════════════════════════

  // === 새로운 추가된 로직: 스쿼트와 비슷한 푸시업 등급 계산 ===
  const grade = !issueDetected && bodyAligned ? '퍼펙트' : '그냥저냥';
  // === 새로운 추가된 로직 끝 ===

  // ══════════════════════════════════════
  // 5, 6. 피드백 — 자세 결함 우선순위 순서로 즉시 반환
  //    우선순위: 엉덩이 처짐 > 엉덩이 솟구침 > 몸통 기울기
  // ══════════════════════════════════════

  // 엉덩이 처짐: 코어 수축 촉구 메시지
  if (saggingHips) {
    feedback = '엉덩이가 처졌습니다. 코어를 조이고 몸을 일직선으로 유지하세요.';
    return { count, dir, feedback, avgPer, grade };
  }
  // 엉덩이 솟구침: 체중 이동 촉구 메시지
  if (pikeHips) {
    feedback = '엉덩이가 솟구쳤습니다. 체중을 가슴 쪽으로 이동하세요.';
    return { count, dir, feedback, avgPer, grade };
  }

  // 몸통 기울기: 몸을 곧게 유지 촉구
  if (!bodyAligned && bodyTilted) {
    feedback = '몸을 곧게 유지하세요!';
  }

  return { count, dir, feedback, avgPer, grade };
}

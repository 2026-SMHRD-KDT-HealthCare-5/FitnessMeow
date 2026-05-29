/**
 * lunges.js — 런지 운동 포즈 인식 로직
 *
 * 목차:
 *   1. 각도 계산   — 무릎(legAngles)·고관절(hipAngles) 각도 측정
 *   2. 상태 판단   — 런지 다운 / 서기 상태 감지
 *   3. 자세 등급   — properTorso + properLungeForm 기반 grade 결정
 *   4. 횟수 카운트 — 내려갔다 올라오면 +1 (0.5씩 누적)
 *   5. 피드백      — 자세 오류 메시지 생성
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
 */
function lungesLogic(landmarks, width, height) {
  // ══════════════════════════════════════
  // 1. 각도 계산
  //    legAngles: 골반-무릎-발목 각도 → 무릎 굽힘 정도
  //    hipAngles: 어깨-골반-무릎 각도 → 몸통 직립 여부
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

  // 고관절 각도 계산 (어깨-골반-무릎) → 몸통 직립 여부 판단
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

  // 무릎 각도를 0~100% 범위로 정규화 (85°=0%, 170°=100%)
  const leftPer = getPercent(legAngles.left, 85, 170);
  const rightPer = getPercent(legAngles.right, 85, 170);

  // ══════════════════════════════════════
  // 2. 상태 판단
  //    isLungeDown: 앞무릎이 약 90° — 완전히 내려간 자세
  //    isStanding:  양쪽 무릎 모두 155° 이상 — 서 있는 자세
  // ══════════════════════════════════════

  // 한쪽이 앞무릎(~90°), 반대쪽이 뒷무릎(~90°)인지 체크
  const isLungeDown =
    (legAngles.left >= 80 && legAngles.left <= 100) ||
    (legAngles.right >= 80 && legAngles.right <= 100);

  // 서 있는 상태: 양쪽 다리가 펴짐
  const isStanding =
    legAngles.left > 155 && legAngles.right > 155;

  // ══════════════════════════════════════
  // 3. 자세 등급
  //    런지 고유 grade 기준:
  //      1. 몸통 직립 유지 (properTorso: 고관절 각도 160° 이상)
  //      2. 앞무릎이 80~100도로 충분히 내려감 (isLungeDown)
  //      3. 앞/뒷무릎 각도 차이가 30도 이상 (한 발이 확실히 앞으로 나간 상태)
  // ══════════════════════════════════════

  // 몸통 직립 판단 — 좌우 중 하나라도 고관절 160° 이상이면 직립
  const properTorso = hipAngles.left >= 160 || hipAngles.right >= 160;

  // 런지 고유 grade 기준:
  // 1. 몸통 직립 유지 (properTorso)
  // 2. 앞무릎이 80~100도로 충분히 내려감 (isLungeDown)
  // 3. 앞/뒷무릎 각도 차이가 30도 이상 (한 발이 확실히 앞으로 나간 상태)
  const legAngleDiff = Math.abs(legAngles.left - legAngles.right);
  const properLungeForm = isLungeDown && legAngleDiff >= 30;
  const grade = properTorso && properLungeForm ? '퍼펙트' : '그냥저냥';

  let feedback = '';

  // ══════════════════════════════════════
  // 4. 횟수 카운트
  //    내려갔을 때(dir=0→1): +0.5
  //    올라왔을 때(dir=1→0): +0.5
  //    두 단계 합산으로 1회 완성
  // ══════════════════════════════════════

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

  // ══════════════════════════════════════
  // 5. 피드백
  //    우선순위: 몸통 기울기 > 발 너비 부족 > 깊이 부족
  // ══════════════════════════════════════

  if (!properTorso) feedback = '몸통을 곧게 유지하세요!';
  else if (isLungeDown && legAngleDiff < 30) feedback = '발을 더 넓게 내딛으세요!';
  else if (!isLungeDown && dir === 0) feedback = '더 깊게 내려가세요!';

  return { count, dir, feedback, avgPer: (leftPer + rightPer) / 2, grade };
}

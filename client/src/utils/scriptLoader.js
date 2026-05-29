/**
 * scriptLoader.js — 외부 스크립트 동적 로드 유틸
 *
 * 목차:
 *   1. loadScript              — <script> 태그를 동적으로 추가해 외부 JS 파일 로드
 *   2. loadExerciseLogicFiles  — 운동 로직 파일을 fetch 해 window.__fitnessMeowLogic 에 등록
 */

import { EXERCISE_LOGIC_FILES, EXERCISE_LOGIC_HELPERS } from '../constants/exerciseConfig';

// ══════════════════════════════════════
// 1. loadScript
//    src URL에 해당하는 <script> 태그를 document.body에 추가해 외부 라이브러리를 로드한다.
//    이미 동일 src의 <script>가 존재하면 즉시 resolve 하여 중복 로드를 방지한다.
//    주 용도: MediaPipe (drawing_utils, camera_utils, pose) 라이브러리 로드
//
//    @param {string} src — 로드할 스크립트 URL
//    @returns {Promise<void>}
// ══════════════════════════════════════

// MediaPipe 라이브러리를 <script> 태그로 동적으로 HTML에 추가
// 이미 로드된 스크립트는 다시 로드하지 않음
export function loadScript(src) {
  return new Promise((resolve, reject) => {
    // 이미 동일 URL의 스크립트가 있으면 중복 삽입 방지
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// ══════════════════════════════════════
// 2. loadExerciseLogicFiles
//    EXERCISE_LOGIC_FILES 에 정의된 운동 로직 파일(squats.js, push_up.js, lunges.js)을
//    fetch 로 소스 텍스트로 가져온 뒤, new Function 으로 eval 하여
//    window.__fitnessMeowLogic[type] 에 래퍼 함수로 등록한다.
//
//    - 이미 로드된 경우 window.__fitnessMeowExerciseLogicLoaded 플래그로 중복 실행 방지
//    - 헬퍼(EXERCISE_LOGIC_HELPERS: interp, angleBetween, getPoint, getPercent)를
//      각 운동 로직 함수의 실행 스코프에 함께 주입한다
//    - 등록된 함수 시그니처:
//        window.__fitnessMeowLogic[type](landmarks, width, height, state)
//        → { count, dir, feedback, avgPer, grade }
// ══════════════════════════════════════

// 운동 로직 파일을 fetch로 가져와서 window.__fitnessMeowLogic 에 등록
// 이후 포즈 감지 결과를 이 로직에 넘겨서 횟수 카운트, 피드백 등을 처리
export async function loadExerciseLogicFiles()
{
  // 이미 로드된 경우 중복 실행 방지
  if (window.__fitnessMeowExerciseLogicLoaded) return;

  await Promise.all(
    Object.entries(EXERCISE_LOGIC_FILES).map(async ([type, config]) => {
      // 운동 로직 파일 소스 텍스트 fetch
      const response = await fetch(config.src);
      if (!response.ok) throw new Error(`Failed to load ${config.src}`);

      const source = await response.text();
      // 헬퍼 함수 + 운동 로직 소스를 하나의 함수 스코프로 묶어 실행
      // state.count / state.dir 를 클로저 변수로 이어받아 횟수 누적
      const installLogic = new Function
      (
            'window',
            `
                ${EXERCISE_LOGIC_HELPERS}
                let count = 0;
                let dir = 0;
                let repHadIssue = false;
                ${source}
                window.__fitnessMeowLogic = window.__fitnessMeowLogic || {};
                window.__fitnessMeowLogic.${type} = function runExerciseLogic(landmarks, width, height, state) {
                count = state.count;
                dir   = state.dir;
                return ${config.globalName}(landmarks, width, height);
                };
            `
        );
        installLogic(window);
      })
    );

  // 전체 로드 완료 플래그 설정
  window.__fitnessMeowExerciseLogicLoaded = true;
}

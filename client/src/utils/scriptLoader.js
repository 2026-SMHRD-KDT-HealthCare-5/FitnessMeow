// src/utils/scriptLoader.js
//외부 스크립트 파일을 동적으로 불러오는 유틸
import { EXERCISE_LOGIC_FILES, EXERCISE_LOGIC_HELPERS } from '../constants/exerciseConfig';

//MediaPipe 라이브러리 (drawing_utils, camera_utils, pose)를 <script> 태그로 동적으로 HTML에 추가
//이미 로드된 스크립트는 다시 로드하지 않음
export function loadScript(src) {
  return new Promise((resolve, reject) => {
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
//운동 로직 파일 (squats.js, push_up.js, lunges.js) 을 fetch로 가져와서
//window.__fitnessMeowLogic 에 등록
//이후 포즈 감지 결과를 이 로직에 넘겨서 횟수 카운트, 피드백 등을 처리

export async function loadExerciseLogicFiles() 
{
  if (window.__fitnessMeowExerciseLogicLoaded) return;

  await Promise.all(
    Object.entries(EXERCISE_LOGIC_FILES).map(async ([type, config]) => {
      const response = await fetch(config.src);
      if (!response.ok) throw new Error(`Failed to load ${config.src}`);

      const source = await response.text();
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

  window.__fitnessMeowExerciseLogicLoaded = true;
}
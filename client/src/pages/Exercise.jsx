import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../css/Exercise.css';

const MEDIAPIPE_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
];

const EXERCISE_LOGIC_FILES = {
  squat: {
    src: '/src/exercises/squats.js',
    globalName: 'squatsLogic',
  },
  pushup: {
    src: '/src/exercises/push_up.js',
    globalName: 'pushUpLogic',
  },
  lunge: {
    src: '/src/exercises/lunges.js',
    globalName: 'lungesLogic',
  },
};

const EXERCISES = {
  squat: {
    name: '스쿼트',
    targetCount: 15,
    kcal: 48,
    themeClass: 'exercise-page--squat',
  },
  pushup: {
    name: '푸쉬업',
    targetCount: 12,
    kcal: 36,
    themeClass: 'exercise-page--pushup',
  },
  lunge: {
    name: '런지',
    targetCount: 20,
    kcal: 52,
    themeClass: 'exercise-page--lunge',
  },
};

const EMPTY_BODY_INFO = {
  weightKg: '',
  heightCm: '',
};

const CALORIE_COEFFICIENTS = {
  squat: 0.0020,
  pushup: 0.0009,
  lunge: 0.0016,
};

const KOREAN_COUNT_LABELS = ['하나!', '둘!', '셋!', '넷!', '다섯!', '여섯!', '일곱!', '여덟!', '아홉!', '열!'];
const KOREAN_TENS_LABELS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

function getKoreanCountLabel(countValue) {
  if (countValue <= KOREAN_COUNT_LABELS.length) return KOREAN_COUNT_LABELS[countValue - 1];
  if (countValue < 100) {
    const tens = Math.floor(countValue / 10);
    const ones = countValue % 10;
    return `${KOREAN_TENS_LABELS[tens]}${ones > 0 ? KOREAN_COUNT_LABELS[ones - 1].replace('!', '') : ''}!`;
  }
  return `${countValue}!`;
}

function calcCalories(type, weightKg, heightCm, reps) {
  const h = heightCm / 100;
  return +(weightKg * h * reps * CALORIE_COEFFICIENTS[type]).toFixed(2);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
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
}// 외부 스크립트를 동적으로 로드하는 함수입니다. src를 받아 해당 스크립트를 문서에 추가하고, 로드가 완료되면 resolve, 실패하면 reject를 호출합니다.

const EXERCISE_LOGIC_HELPERS = `
function interp(value, [min1, max1], [min2, max2]) {
  const ratio = (value - min1) / (max1 - min1);
  return min2 + ratio * (max2 - min2);
}
//
function angleBetween(p1, p2, p3) {
  let angle = Math.abs(
    (Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x)) *
      (180 / Math.PI)
  );
  if (angle > 360) angle %= 360;
  if (angle < 0) angle += 360;
  if (angle > 180) angle = 360 - angle;
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

async function loadExerciseLogicFiles() {
  if (window.__fitnessMeowExerciseLogicLoaded) return;

  await Promise.all(
    Object.entries(EXERCISE_LOGIC_FILES).map(async ([type, config]) => {
      const response = await fetch(config.src);

      if (!response.ok) {
        throw new Error(`Failed to load ${config.src}`);
      }

      const source = await response.text();
      const installLogic = new Function(
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
  dir = state.dir;
  const result = ${config.globalName}(landmarks, width, height);
  return result;
};
`
      );

      installLogic(window);
    })
  );

  window.__fitnessMeowExerciseLogicLoaded = true;
}

const LOGIC_BY_TYPE = {
  squat: 'squat',
  pushup: 'pushup',
  lunge: 'lunge',
};

function Exercise({ type = 'squat', settings, onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const screenFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const stateRef = useRef({ count: 0, dir: 0 });
  const isRestingRef = useRef(false);
  const gradeCountsRef = useRef({ perfect: 0, normal: 0 });
  const [selectedType, setSelectedType] = useState(type);
  const previousTypeRef = useRef(type);

  const [count, setCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState('준비');
  const [gradeText, setGradeText] = useState('완벽 0 보통 0');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [message, setMessage] = useState('시작을 눌러 카메라를 켜세요.');
  const [rewardTick, setRewardTick] = useState(0);
  const [bodyInfo, setBodyInfo] = useState(EMPTY_BODY_INFO);

  const exercise = useMemo(() => {
    return EXERCISES[selectedType] ?? EXERCISES.squat;
  }, [selectedType]);

  const targetCount = settings?.reps || exercise.targetCount;
  const totalSets = settings?.sets || 1;
  const restTime = settings?.rest || 60;
  const progress = Math.min(100, ((count % targetCount) / targetCount) * 100);
  const caloriesBurned = calcCalories(selectedType, bodyInfo.weightKg, bodyInfo.heightCm, totalReps);
  const restDisplayTime = isResting ? restRemaining : restTime;
  const restTimeText = `${String(Math.floor(restDisplayTime / 60)).padStart(2, '0')}:${String(restDisplayTime % 60).padStart(2, '0')}`;
  const resultStats = useMemo(() => {
    const perfect = gradeCountsRef.current.perfect;
    const normal = gradeCountsRef.current.normal;
    const done = Math.max(0, totalReps - perfect - normal);

    return {
      score: Math.min(999, 800 + totalReps * 10 + perfect * 8),
      calories: calcCalories(selectedType, bodyInfo.weightKg, bodyInfo.heightCm, totalReps),
      perfect,
      normal,
      done,
      exp: totalReps,
      chur: 300,
    };
  }, [bodyInfo.heightCm, bodyInfo.weightKg, selectedType, totalReps]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop?.();
      cameraRef.current = null;
    }

    if (screenFrameRef.current) {
      cancelAnimationFrame(screenFrameRef.current);
      screenFrameRef.current = null;
    }

    const stream = videoRef.current?.srcObject;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    startTimeRef.current = null;
    setIsCameraOn(false);
    isRestingRef.current = false;
    setIsResting(false);
    setRestRemaining(0);
    setMessage('운동을 정지했습니다.');
  }, []);

  const updateExerciseState = useCallback((nextState) => {
    if (isRestingRef.current) return;

    const previousCount = Math.floor(stateRef.current.count + 1e-6);
    const nextCount = Math.floor(nextState.count + 1e-6);
    const didCompleteRep = nextCount > previousCount;
    const didCompleteSet = didCompleteRep && nextCount >= targetCount;

    stateRef.current = {
      count: nextState.count,
      dir: nextState.dir,
    };

    if (nextState.grade && didCompleteRep) {
      if (nextState.grade === 'PERFECT' || nextState.grade === '퍼펙트') {
        gradeCountsRef.current.perfect += 1;
      }
      if (nextState.grade === 'NORMAL' || nextState.grade === '그냥저냥') {
        gradeCountsRef.current.normal += 1;
      }
    }

    if (didCompleteRep) {
      setRewardTick((tick) => tick + 1);
      setTotalReps((reps) => reps + 1);
    }

    if (didCompleteSet) {
      stateRef.current = { count: 0, dir: 0 };
      isRestingRef.current = true;
      setCount(0);
      setCompletedSets((sets) => Math.min(totalSets, sets + 1));
      setRestRemaining(restTime);
      setIsResting(true);
      setFeedback('휴식하세요!');
    } else {
      setCount(nextCount);
      if (nextState.feedback) {
        setFeedback(nextState.feedback);
      } else if (didCompleteRep) {
        setFeedback(`${getKoreanCountLabel(nextCount)} 좋아요!`);
      }
    }

    setGradeText(
      `완벽 ${gradeCountsRef.current.perfect} 보통 ${gradeCountsRef.current.normal}`
    );
  }, [isResting, restTime, targetCount, totalSets]);

  const onResults = useCallback(
    (results) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      const frameWidth = video?.videoWidth || results.image?.videoWidth || results.image?.width || 640;
      const frameHeight = video?.videoHeight || results.image?.videoHeight || results.image?.height || 480;

      if (!video || !canvas || !context || frameWidth === 0 || frameHeight === 0) {
        return;
      }

      canvas.width = frameWidth;
      canvas.height = frameHeight;
      context.save();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        window.drawConnectors?.(context, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: '#30e465',
          lineWidth: 4,
        });
        window.drawLandmarks?.(context, results.poseLandmarks, {
          color: '#ff4d3d',
          lineWidth: 2,
        });

        const logic = window.__fitnessMeowLogic?.[LOGIC_BY_TYPE[selectedType] ?? 'squat'];

        if (typeof logic === 'function') {
          updateExerciseState(logic(results.poseLandmarks, canvas.width, canvas.height, stateRef.current));
        } else {
          setMessage('운동 측정 로직을 불러오지 못했습니다.');
        }
      }

      context.restore();
    },
    [selectedType, updateExerciseState]
  );

  const startCamera = async () => {
    try {
      setShowResult(false);
      setMessage('자세 인식 모델을 불러오는 중입니다.');
      await Promise.all(MEDIAPIPE_SCRIPTS.map(loadScript));
      await loadExerciseLogicFiles();

      if (!videoRef.current) return;

      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onResults);
      poseRef.current = pose;

      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          try {
            await pose.send({ image: videoRef.current });
          } catch {
            setMessage('자세 인식 중 오류가 발생했습니다.');
          }
        },
        width: 640,
        height: 480,
      });

      cameraRef.current = camera;
      await camera.start();
      startTimeRef.current = performance.now();
      setIsCameraOn(true);
      setMessage('자세를 인식하는 중입니다.');
    } catch {
      stopCamera();
      setMessage('카메라 권한 또는 네트워크 연결을 확인해주세요.');
    }
  };

  const processScreenFrame = useCallback(async () => {
    const video = videoRef.current;
    const pose = poseRef.current;

    if (!video || !pose || video.paused || video.ended) return;

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      try {
        await pose.send({ image: video });
      } catch {
        setMessage('자세 인식 중 오류가 발생했습니다.');
      }
    }

    screenFrameRef.current = requestAnimationFrame(processScreenFrame);
  }, []);

  const startScreenCapture = async () => {
    try {
      // TODO: 테스트용 화면공유 측정 기능입니다. 최종 배포 전에 삭제 예정입니다.
      setShowResult(false);
      await Promise.all(MEDIAPIPE_SCRIPTS.map(loadScript));
      await loadExerciseLogicFiles();
      stopCamera();
      setMessage('테스트용 화면공유 측정을 준비하는 중입니다.');

      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onResults);
      poseRef.current = pose;

      videoRef.current.srcObject = stream;
      videoRef.current.controls = false;
      videoRef.current.muted = true;
      await videoRef.current.play();

      const [track] = stream.getVideoTracks();
      if (track) {
        track.onended = () => {
          stopCamera();
          setMessage('테스트용 화면공유 측정이 종료되었습니다.');
        };
      }

      startTimeRef.current = performance.now();
      setIsCameraOn(true);
      setMessage('테스트용 화면공유 영상으로 자세를 인식하는 중입니다.');
      screenFrameRef.current = requestAnimationFrame(processScreenFrame);
    } catch {
      stopCamera();
      setMessage('화면공유 권한 또는 네트워크 연결을 확인해주세요.');
    }
  };

  const resetExercise = () => {
    stateRef.current = { count: 0, dir: 0 };
    gradeCountsRef.current = { perfect: 0, normal: 0 };
    startTimeRef.current = isCameraOn ? performance.now() : null;
    setCount(0);
    setCompletedSets(0);
    setTotalReps(0);
    setRestRemaining(0);
    isRestingRef.current = false;
    setIsResting(false);
    setElapsedTime(0);
    setFeedback('준비');
    setGradeText('완벽 0 보통 0');
    setShowResult(false);
    setRewardTick(0);
    setMessage('카운트를 초기화했습니다.');
  };

  const finishExercise = () => {
    stopCamera();
    setShowResult(true);
  };

  const skipRest = () => {
    setRestRemaining(0);
    isRestingRef.current = false;
    setIsResting(false);
    setFeedback('준비');
  };

  const changeExerciseType = (nextType) => {
    setIsTypeMenuOpen(false);
    if (nextType === selectedType) return;

    stopCamera();
    stateRef.current = { count: 0, dir: 0 };
    gradeCountsRef.current = { perfect: 0, normal: 0 };
    startTimeRef.current = null;
    previousTypeRef.current = nextType;
    setSelectedType(nextType);
    setCount(0);
    setCompletedSets(0);
    setTotalReps(0);
    setRestRemaining(0);
    isRestingRef.current = false;
    setIsResting(false);
    setElapsedTime(0);
    setFeedback('준비');
    setGradeText('완벽 0 보통 0');
    setShowResult(false);
    setRewardTick(0);
    setMessage('운동이 변경되었습니다. 시작을 눌러 카메라를 켜세요.');
  };

  useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) return;
        setBodyInfo({
          weightKg: data.data.weight,
          heightCm: data.data.height,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (previousTypeRef.current === type) return;

    previousTypeRef.current = type;
    setSelectedType(type);
    stateRef.current = { count: 0, dir: 0 };
    gradeCountsRef.current = { perfect: 0, normal: 0 };
    startTimeRef.current = isCameraOn ? performance.now() : null;
    setCount(0);
    setCompletedSets(0);
    setTotalReps(0);
    setRestRemaining(0);
    isRestingRef.current = false;
    setIsResting(false);
    setElapsedTime(0);
    setFeedback('준비');
    setGradeText('완벽 0 보통 0');
    setShowResult(false);
    setRewardTick(0);
    setMessage('시작을 눌러 카메라를 켜세요.');
  }, [type]);

  useEffect(() => {
    if (!isCameraOn || startTimeRef.current === null) return undefined;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((performance.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isCameraOn]);

  useEffect(() => {
    if (!isResting) return undefined;

    if (restRemaining <= 0) {
      isRestingRef.current = false;
      setIsResting(false);
      setFeedback('준비');
      return undefined;
    }

    const timer = setTimeout(() => {
      setRestRemaining((remaining) => remaining - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [isResting, restRemaining]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <main className={`exercise-page ${exercise.themeClass}`}>
      <section className="exercise-phone">
        <section className="exercise-camera-card">
          <video ref={videoRef} playsInline muted className="exercise-video" />
          <canvas ref={canvasRef} className="exercise-pose-canvas" aria-hidden="true" />
          {!isCameraOn && (
            <div className="exercise-camera-placeholder">
              <span>{exercise.name}</span>
              <strong>카메라 미리보기</strong>
            </div>
          )}

          <button type="button" className="exercise-back-button" onClick={onBack}>
            Back
          </button>

          <div className="exercise-type-picker">
            <span>운동</span>
            <button
              type="button"
              className="exercise-type-trigger"
              onClick={() => setIsTypeMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isTypeMenuOpen}
            >
              {exercise.name}
              <span aria-hidden="true">⌄</span>
            </button>
            {isTypeMenuOpen && (
              <div className="exercise-type-menu">
                {Object.entries(EXERCISES).map(([value, item]) => (
                  <button
                    type="button"
                    key={value}
                    className={value === selectedType ? 'is-active' : ''}
                    onClick={() => changeExerciseType(value)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="exercise-counter-badge">
            <small>{completedSets}/{totalSets} Set</small>
            <strong>{count}</strong>
            <span>/ {targetCount}</span>
            <em>횟수</em>
          </div>

          <div key={feedback} className="exercise-feedback-badge">{feedback}</div>

          <div className="exercise-grade-badge">{gradeText}</div>

          <div className="exercise-reward-slot">
            <strong>{totalReps} EXP</strong>
            {rewardTick > 0 && (
              <span key={rewardTick} className="exercise-reward-pop">+1 EXP</span>
            )}
          </div>
        </section>

        <section className="exercise-info-bar">
          <div className="exercise-metric">
            <span className="metric-icon">K</span>
            <strong>{caloriesBurned}</strong>
            <em>kcal</em>
          </div>
          <div className="exercise-metric exercise-metric--center">
            <span className="metric-icon">T</span>
            <strong>{String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}</strong>
          </div>
          <button
            type="button"
            className="exercise-rest"
            onClick={skipRest}
            disabled={!isResting}
            aria-label="휴식"
          >
            <span>휴식</span>
            <strong>{restTimeText}</strong>
          </button>
        </section>

        <div className="exercise-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <p className="exercise-message">{message}</p>

        <section className={`exercise-controls ${!isCameraOn ? 'exercise-controls--setup' : ''}`}>
          {!isCameraOn ? (
            <>
              <button
                type="button"
                className="exercise-control-button exercise-control-button--pause"
                onClick={startCamera}
                aria-label="시작"
                title="시작"
              >
                <span className="exercise-control-icon" aria-hidden="true">▶</span>
                <span>시작</span>
              </button>
              <button type="button" className="exercise-control-button exercise-control-button--stop" onClick={finishExercise}>
                <span className="exercise-control-icon exercise-control-icon--stop" aria-hidden="true" />
                <span>정지</span>
              </button>
              <button
                type="button"
                className="exercise-control-button exercise-control-button--screen"
                onClick={startScreenCapture}
                aria-label="테스트용 화면공유 측정"
                title="테스트용 화면공유 측정"
              >
                <span className="exercise-control-icon" aria-hidden="true">▣</span>
                <span>화면공유 테스트</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="exercise-control-button exercise-control-button--pause"
              onClick={isResting ? skipRest : stopCamera}
              aria-label={isResting ? '휴식 건너뛰기' : '일시정지'}
              title={isResting ? '휴식 건너뛰기' : '일시정지'}
            >
              <span className="exercise-control-icon" aria-hidden="true">Ⅱ</span>
              <span>{isResting ? '휴식 건너뛰기' : '일시정지'}</span>
            </button>
          )}
          {isCameraOn && (
            <button type="button" className="exercise-control-button exercise-control-button--stop" onClick={finishExercise}>
              <span className="exercise-control-icon exercise-control-icon--stop" aria-hidden="true" />
              <span>정지</span>
            </button>
          )}
        </section>
      </section>
    </main>
  );
}

export default Exercise;

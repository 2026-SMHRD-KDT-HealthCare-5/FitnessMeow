// src/Exercise.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Exercise.css';

import { MEDIAPIPE_SCRIPTS, EXERCISES, LOGIC_BY_TYPE } from '../constants/exerciseConfig';
import { calcCalories }                                 from '../utils/calcCalories';
import { postWorkoutWithRetry }                         from '../utils/exerciseApi';
import { loadScript, loadExerciseLogicFiles }           from '../utils/scriptLoader';
import { useBodyInfo }                                  from '../hooks/useBodyInfo';
import cheeringCat                                      from '../assets/cheering-cat/KakaoTalk_20260526_142532096_transparent.gif';
import calorieIcon                                      from '../assets/exercise-page-icons/calorie_fire.png';
import perfectIcon                                      from '../assets/exercise-page-icons/gold_star.png';
import normalIcon                                       from '../assets/exercise-page-icons/gray_star.png';
import repIcon                                          from '../assets/exercise-page-icons/pink_dumbbell.png';
import restIcon                                         from '../assets/exercise-page-icons/rest_cup.png';
import setIcon                                          from '../assets/exercise-page-icons/set_calendar.png';
import timerIcon                                        from '../assets/exercise-page-icons/timer_stopwatch.png';
import quitCatPopup                                     from '../assets/exercise-page-icons/quit_cat_popup_transparent.png';
import perfectSound                                     from '../assets/sounds/perfect_sound.wav';
import normalSound                                      from '../assets/sounds/normal_sound.wav';

function Exercise({ type = 'squat', settings }) {
  const navigate = useNavigate();
  const bodyInfo = useBodyInfo();

  /* ─────────────────────────────────────────
     1. Refs
     - DOM 참조 및 렌더링 없이 유지할 값들
  ───────────────────────────────────────── */
  const videoRef         = useRef(null); // 카메라 영상
  const canvasRef        = useRef(null); // 포즈 드로잉 캔버스
  const poseRef          = useRef(null); // MediaPipe Pose 인스턴스
  const cameraRef        = useRef(null); // MediaPipe Camera 인스턴스
  const screenFrameRef   = useRef(null); // 화면공유 requestAnimationFrame ID
  const startTimeRef     = useRef(null); // 운동 시작 시각 (경과시간 계산용)
  const stateRef         = useRef({ count: 0, dir: 0 }); // 운동 로직 내부 상태
  const isRestingRef     = useRef(false);  // 휴식 중 여부 (포즈 감지 차단용)
  const completedSetsRef = useRef(0);      // 완료된 세트 수 (클로저 문제 방지용)
  const gradeCountsRef   = useRef({ perfect: 0, normal: 0 }); // 퍼펙트/일반 횟수
  const previousTypeRef  = useRef(type);   // 이전 운동 종목 (변경 감지용)
  const perfectSoundRef  = useRef(null);  // 퍼펙트 사운드 오디오 객체
  const normalSoundRef   = useRef(null);  // 일반 사운드 오디오 객체

  /* ─────────────────────────────────────────
     2. State
     - UI 렌더링에 필요한 상태값들
  ───────────────────────────────────────── */
  const [selectedType,   setSelectedType]   = useState(type);   // 현재 운동 종목
  const [count,          setCount]          = useState(0);       // 현재 세트 내 횟수
  const [elapsedTime,    setElapsedTime]    = useState(0);       // 경과 시간(초)
  const [feedback,       setFeedback]       = useState('준비');  // 자세 피드백 텍스트
  const [,                setGradeText]      = useState('완벽 0 보통 0'); // 등급 렌더 갱신 트리거
  const [isCameraOn,     setIsCameraOn]     = useState(false);   // 카메라 ON/OFF
  const [isResting,      setIsResting]      = useState(false);   // 휴식 중 여부
  const [completedSets,  setCompletedSets]  = useState(0);       // 완료 세트 수 (UI용)
  const [totalReps,      setTotalReps]      = useState(0);       // 누적 총 횟수
  const [restRemaining,  setRestRemaining]  = useState(0);       // 남은 휴식 시간(초)
  const [message,        setMessage]        = useState('시작을 눌러 카메라를 켜세요.');
  const [rewardTick,     setRewardTick]     = useState(0);       // EXP 팝업 트리거
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);// 포기 확인 다이얼로그 표시 여부

  /* ─────────────────────────────────────────
     3. Derived Values
     - state/settings에서 파생된 계산값들
  ───────────────────────────────────────── */
  const exercise        = useMemo(() => EXERCISES[selectedType] ?? EXERCISES.squat, [selectedType]);
  const targetreps     = settings?.reps || 1;  // 목표 횟수
  const targetSets       = settings?.sets || 1;  // 목표 세트
  const restTime        = settings?.rest || 60; // 휴식 시간(초)
  const progress        = Math.min(100, (count / targetreps) * 100); // 진행 바 %
  const caloriesBurned  = calcCalories(selectedType, bodyInfo.weightKg, bodyInfo.heightCm, totalReps); // 실시간 칼로리
  const restDisplayTime = isResting ? restRemaining : restTime;
  const restTimeText    = `${String(Math.floor(restDisplayTime / 60)).padStart(2, '0')}:${String(restDisplayTime % 60).padStart(2, '0')}`;

  /* ─────────────────────────────────────────
     4. Result Stats
     - 운동 완료 시 DB에 저장할 최종 결과값
     - targetSets * targetreps 로 직접 계산 (totalReps 클로저 문제 방지)
  ───────────────────────────────────────── */
  const resultStats = useMemo(() => ({
    score:    Math.min(999, 800 + totalReps * 10 + gradeCountsRef.current.perfect * 8),
    calories: calcCalories(selectedType, bodyInfo.weightKg, bodyInfo.heightCm, targetSets * targetreps),
    perfect:  gradeCountsRef.current.perfect,
    normal:   gradeCountsRef.current.normal,
  }), [bodyInfo.heightCm, bodyInfo.weightKg, selectedType, totalReps, targetSets, targetreps]);

  const playGradeSound = useCallback((grade) => {
    const sound = grade === 'perfect' ? perfectSoundRef.current : normalSoundRef.current;
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }, []);

  /* ─────────────────────────────────────────
     5. 카메라 정지
     - 카메라/캔버스/스트림 전부 정리
  ───────────────────────────────────────── */
  const stopCamera = useCallback(() => {
    cameraRef.current?.stop?.();
    cameraRef.current = null;

    if (screenFrameRef.current) {
      cancelAnimationFrame(screenFrameRef.current);
      screenFrameRef.current = null;
    }

    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (canvasRef.current && ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    startTimeRef.current = null;
    setIsCameraOn(false);
    isRestingRef.current = false;
    setIsResting(false);
    setRestRemaining(0);
    setMessage('운동을 정지했습니다.');
  }, []);

  /* ─────────────────────────────────────────
     6. 운동 완료 처리
     - 카메라 정지 → DB 저장 → result 페이지 이동
     - updateExerciseState 보다 먼저 선언 필요
  ───────────────────────────────────────── */
const finishExercise = useCallback((isGiveUp = false) => {
  stopCamera();

  const currentReps = Math.floor(stateRef.current.count + 1e-6);
  const totalReps = Math.min(
  currentReps + completedSetsRef.current * targetreps,
  targetSets * targetreps
);

  const workoutData = {
    exercise_key  : selectedType,
    sets          : completedSetsRef.current,
    reps          : currentReps,
    total_score   : totalReps === 0
      ? 0
      : Math.round((gradeCountsRef.current.perfect / (targetreps * targetSets)) * 100),
    calories      : calcCalories(selectedType, bodyInfo.weightKg, bodyInfo.heightCm, totalReps),
    perfect_count : gradeCountsRef.current.perfect,
    normal_count  : gradeCountsRef.current.normal,
    total_reps    : totalReps
  };

  postWorkoutWithRetry(workoutData)
    .then((data) => navigate('/result', { state: data }))
    .catch(() => console.error('운동 기록 저장 실패'));

}, [stopCamera, selectedType, targetreps, bodyInfo, navigate]);
  /* ─────────────────────────────────────────
     7. 운동 상태 업데이트
     - 포즈 감지 결과를 받아 횟수/세트/휴식 처리
     - 매 프레임 호출됨
  ───────────────────────────────────────── */
  const updateExerciseState = useCallback((nextState) => {
    if (isRestingRef.current) return; // 휴식 중이면 처리 차단

    const previousCount  = Math.floor(stateRef.current.count + 1e-6);
    const nextCount      = Math.floor(nextState.count + 1e-6);
    const didCompleteRep = nextCount > previousCount;          // 1회 완료 여부
    const didCompleteSet = didCompleteRep && nextCount >= targetreps; // 세트 완료 여부

    stateRef.current = { count: nextState.count, dir: nextState.dir };

    // 7-1. 등급 카운트 업데이트
    if (nextState.grade && didCompleteRep) {
      if (nextState.grade === 'PERFECT' || nextState.grade === '퍼펙트') {
        gradeCountsRef.current.perfect += 1;
        playGradeSound('perfect');
      }
      if (nextState.grade === 'NORMAL'  || nextState.grade === '그냥저냥') {
        gradeCountsRef.current.normal += 1;
        playGradeSound('normal');
      }
    }

    // 7-2. 총 횟수 업데이트
    if (didCompleteRep) {
      setRewardTick((t) => t + 1);
      setTotalReps((r) => r + 1);
    }

    // 7-3. 세트 완료 처리
    if (didCompleteSet) {
      const nextCompletedSets = Math.min(targetSets, completedSetsRef.current + 1);
      completedSetsRef.current = nextCompletedSets;

      setCount(nextCount);         // 목표 횟수 잠깐 표시
      isRestingRef.current = true; // 다음 프레임 포즈 감지 차단

      // 마지막 세트 완료 → 0.5초 후 운동 완료 처리
      if (nextCompletedSets >= targetSets) {
        setTimeout(() => {
          isRestingRef.current = false;
          finishExercise();
        }, 500);
        return;
      }

      // 다음 세트 → 0.5초 후 휴식 시작
      setTimeout(() => {
        stateRef.current = { count: 0, dir: 0 };
        setCount(0);
        setCompletedSets(nextCompletedSets);
        setRestRemaining(restTime);
        setIsResting(true);
        setFeedback('휴식하세요!');
      }, 500);

    // 7-4. 일반 횟수 업데이트
    } else {
      setCount(nextCount);
      if (nextState.feedback)  setFeedback(nextState.feedback);
      else if (didCompleteRep) setFeedback('좋아요!');
    }

    setGradeText(`완벽 ${gradeCountsRef.current.perfect} 보통 ${gradeCountsRef.current.normal}`);
  }, [finishExercise, playGradeSound, restTime, targetreps, targetSets]);

  /* ─────────────────────────────────────────
     8. 포즈 감지 결과 처리
     - 캔버스에 영상/스켈레톤 그리기
     - 운동 로직 실행 → updateExerciseState 호출
  ───────────────────────────────────────── */
  const onResults = useCallback((results) => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    const fw     = video?.videoWidth  || results.image?.width  || 640;
    const fh     = video?.videoHeight || results.image?.height || 480;

    if (!video || !canvas || !ctx || fw === 0 || fh === 0) return;

    canvas.width  = fw;
    canvas.height = fh;
    ctx.save();
    ctx.clearRect(0, 0, fw, fh);
    ctx.drawImage(results.image, 0, 0, fw, fh);

    if (results.poseLandmarks) {
      window.drawConnectors?.(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, { color: '#30e465', lineWidth: 4 });
      window.drawLandmarks?.(ctx, results.poseLandmarks, { color: '#ff4d3d', lineWidth: 2 });

      const logic = window.__fitnessMeowLogic?.[LOGIC_BY_TYPE[selectedType] ?? 'squat'];
      if (typeof logic === 'function') {
        updateExerciseState(logic(results.poseLandmarks, fw, fh, stateRef.current));
      } else {
        setMessage('운동 측정 로직을 불러오지 못했습니다.');
      }
    }

    ctx.restore();
  }, [selectedType, updateExerciseState]);

  /* ─────────────────────────────────────────
     9. Pose 인스턴스 생성
  ───────────────────────────────────────── */
  const createPose = useCallback(() => {
    const pose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    pose.onResults(onResults);
    poseRef.current = pose;
    return pose;
  }, [onResults]);

  /* ─────────────────────────────────────────
     10. 카메라 시작
     - MediaPipe 스크립트 로드 → Pose 생성 → Camera 시작
  ───────────────────────────────────────── */
  const startCamera = async () => {
    try {
      setMessage('자세 인식 모델을 불러오는 중입니다.');
      await Promise.all(MEDIAPIPE_SCRIPTS.map(loadScript));
      await loadExerciseLogicFiles();
      if (!videoRef.current) return;

      const pose   = createPose();
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          try { await pose.send({ image: videoRef.current }); }
          catch { setMessage('자세 인식 중 오류가 발생했습니다.'); }
        },
        width: 640, height: 480,
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

  /* ─────────────────────────────────────────
     11. 화면공유 테스트 (TODO: 배포 전 삭제)
     - 웹캠 대신 화면공유 스트림으로 포즈 감지
  ───────────────────────────────────────── */
  const processScreenFrame = useCallback(async () => {
    const video = videoRef.current;
    const pose  = poseRef.current;
    if (!video || !pose || video.paused || video.ended) return;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      try { await pose.send({ image: video }); }
      catch { setMessage('자세 인식 중 오류가 발생했습니다.'); }
    }
    screenFrameRef.current = requestAnimationFrame(processScreenFrame);
  }, []);

  const startScreenCapture = async () => {
    try {
      await Promise.all(MEDIAPIPE_SCRIPTS.map(loadScript));
      await loadExerciseLogicFiles();
      stopCamera();
      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const pose   = createPose();

      videoRef.current.srcObject = stream;
      videoRef.current.muted     = true;
      await videoRef.current.play();

      const [track] = stream.getVideoTracks();
      if (track) track.onended = () => { stopCamera(); setMessage('화면공유 측정이 종료되었습니다.'); };

      startTimeRef.current = performance.now();
      setIsCameraOn(true);
      setMessage('화면공유 영상으로 자세를 인식하는 중입니다.');
      screenFrameRef.current = requestAnimationFrame(processScreenFrame);
    } catch {
      stopCamera();
      setMessage('화면공유 권한 또는 네트워크 연결을 확인해주세요.');
    }
  };

  /* ─────────────────────────────────────────
     12. 휴식 건너뛰기
  ───────────────────────────────────────── */
  const skipRest = () => {
    setRestRemaining(0);
    isRestingRef.current = false;
    setIsResting(false);
    setFeedback('준비');
  };

  /* ─────────────────────────────────────────
     14. Effects
  ───────────────────────────────────────── */

  // 14-1. 외부 type prop 변경 감지 → 상태 초기화
  useEffect(() => {
    if (previousTypeRef.current === type) return;
    previousTypeRef.current  = type;
    completedSetsRef.current = 0;
    stateRef.current         = { count: 0, dir: 0 };
    gradeCountsRef.current   = { perfect: 0, normal: 0 };
    setSelectedType(type);
    setCount(0); setCompletedSets(0); setTotalReps(0);
    setRestRemaining(0); setElapsedTime(0);
    isRestingRef.current = false;
    setIsResting(false);
    setFeedback('준비');
    setGradeText('완벽 0 보통 0');
    setRewardTick(0);
    setMessage('시작을 눌러 카메라를 켜세요.');
  }, [type]);

  // 14-2. 경과 시간 타이머
  useEffect(() => {
    if (!isCameraOn || startTimeRef.current === null) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((performance.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isCameraOn]);

  // 14-3. 휴식 카운트다운 타이머
  useEffect(() => {
    if (!isResting) return;
    if (restRemaining <= 0) {
      isRestingRef.current = false;
      setIsResting(false);
      setFeedback('준비');
      return;
    }
    const timer = setTimeout(() => setRestRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [isResting, restRemaining]);

  // 14-4. 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    perfectSoundRef.current = new Audio(perfectSound);
    normalSoundRef.current = new Audio(normalSound);
  }, []);

  /* ─────────────────────────────────────────
     15. Render
  ───────────────────────────────────────── */
  return (
    <main className="exercise-page">
      <section className={`exercise-phone ${isCameraOn ? 'exercise-phone--active' : ''}`}>

        {/* 15-1. 카메라 카드 */}
        <section className="exercise-camera-card">
          <video ref={videoRef} playsInline muted className="exercise-video" />
          <canvas ref={canvasRef} className="exercise-pose-canvas" aria-hidden="true" />
          {!isCameraOn && (
            <div className="exercise-camera-placeholder">
              <span>{exercise.name}</span>
              <strong>카메라 미리보기</strong>
            </div>
          )}

          {/* 15-3. 운동 현황 패널 */}
          <div className="exercise-status-panel">
            <div className="exercise-counter-stat">
              <img className="exercise-stat-icon exercise-stat-icon--set" src={setIcon} alt="" />
              <div>
                <em>세트</em>
                <strong>{completedSets}<small>/ {targetSets}</small></strong>
              </div>
            </div>
            <div className="exercise-counter-stat">
              <img className="exercise-stat-icon exercise-stat-icon--rep" src={repIcon} alt="" />
              <div>
                <em>횟수</em>
                <strong>{count}<small>/ {targetreps}</small></strong>
              </div>
            </div>
            <div className="exercise-grade-stat">
              <img className="exercise-stat-icon exercise-stat-icon--grade" src={perfectIcon} alt="" />
              <div>
                <em>완벽</em>
                <strong>{gradeCountsRef.current.perfect}</strong>
              </div>
            </div>
            <div className="exercise-grade-stat exercise-grade-stat--normal">
              <img className="exercise-stat-icon exercise-stat-icon--normal" src={normalIcon} alt="" />
              <div>
                <em>보통</em>
                <strong>{gradeCountsRef.current.normal}</strong>
              </div>
            </div>
          </div>

          {/* 15-4. 피드백 / 등급 배지 */}
          <div key={feedback} className="exercise-feedback-badge">{feedback}</div>

          {/* 15-5. EXP 리워드 */}
          <div className="exercise-reward-slot">
            <img className="exercise-reward-cat" src={cheeringCat} alt="" />
            <strong>{totalReps} EXP</strong>
            {rewardTick > 0 && <span key={rewardTick} className="exercise-reward-pop">+1 EXP</span>}
          </div>
        </section>

        {/* 15-6. 칼로리 / 시간 / 휴식 정보 바 */}
        <section className="exercise-info-bar">
          <div className="exercise-metric">
            <img className="metric-icon" src={calorieIcon} alt="" />
            <strong>{caloriesBurned}</strong>
            <em>kcal</em>
          </div>
          <div className="exercise-metric exercise-metric--center">
            <img className="metric-icon" src={timerIcon} alt="" />
            <strong>
              {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:
              {String(elapsedTime % 60).padStart(2, '0')}
            </strong>
          </div>
          <button type="button" className="exercise-rest" onClick={skipRest} disabled={!isResting} aria-label="휴식">
            <span><img className="metric-icon" src={restIcon} alt="" />휴식</span>
            <strong>{restTimeText}</strong>
          </button>
        </section>

        {/* 15-7. 진행 바 */}
        <div className="exercise-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        {/* 15-8. 상태 메시지 */}
        <p className="exercise-message">{message}</p>

        {/* 15-9. 컨트롤 버튼 */}
        <section className={`exercise-controls ${!isCameraOn ? 'exercise-controls--setup' : ''}`}>
          {!isCameraOn ? (
            <>
              <button type="button" className="exercise-control-button exercise-control-button--pause" onClick={startCamera} aria-label="시작">
                <span className="exercise-control-icon" aria-hidden="true">▶</span>
                <span>시작</span>
              </button>
              <button type="button" className="exercise-control-button exercise-control-button--stop" onClick={() => setShowGiveUpConfirm(true)}>
                <span className="exercise-control-icon exercise-control-icon--stop" aria-hidden="true" />
                <span>포기하기</span>
              </button>
              <button type="button" className="exercise-control-button exercise-control-button--screen" onClick={startScreenCapture}>
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
            >
              <span className="exercise-control-icon" aria-hidden="true">Ⅱ</span>
              <span>{isResting ? '휴식 건너뛰기' : '일시정지'}</span>
            </button>
          )}
          {isCameraOn && (
            <button type="button" className="exercise-control-button exercise-control-button--stop" onClick={() => setShowGiveUpConfirm(true)}>
              <span className="exercise-control-icon exercise-control-icon--stop" aria-hidden="true" />
              <span>포기하기</span>
            </button>
          )}
        </section>

        {showGiveUpConfirm && (
          <div className="exercise-confirm-overlay" role="presentation">
            <section className="exercise-confirm-dialog" role="dialog" aria-modal="true" aria-label="운동 포기 확인">
              <img className="exercise-confirm-cat" src={quitCatPopup} alt="" />
              <p>정말 포기할꺼냥?</p>
              <div className="exercise-confirm-actions">
                <button type="button" onClick={() => setShowGiveUpConfirm(false)}>계속하기</button>
                <button type="button" className="exercise-confirm-give-up" onClick={() => finishExercise(true)}>포기하기</button>
              </div>
            </section>
          </div>
        )}

      </section>
    </main>
  );
}

export default Exercise;

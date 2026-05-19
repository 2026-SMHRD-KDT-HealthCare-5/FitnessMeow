import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext.jsx';
import "../css/Result.css";

/* ════════════════════════════════════════════
   레벨별 고양이 이미지 매핑
   assets 폴더에 LV_1.png / LV_2.png / LV_3.png 복사 필요
════════════════════════════════════════════ */
import catLv1 from '../assets/LV_1.png'; // LV1: 엎드린 픽셀 고양이
import catLv2 from '../assets/LV_2.png'; // LV2: 서있는 픽셀 고양이
import catLv3 from '../assets/LV_3.png'; // LV3: 앉아있는 픽셀 고양이

const ANIMAL_IMAGES = {
  cat: { '1': catLv1, '2': catLv2, '3': catLv3 },
  // 동물 추가 예시: dog: { '1': dogLv1, '2': dogLv2, '3': dogLv3 },
};

/* ════════════════════════════════════════════
   운동 종류 → EXP 적용 부위 매핑
   1회당 1 EXP 상승
════════════════════════════════════════════ */
const EXERCISE_EXP_MAP = {
  pushup: ['arm', 'chest'],  // 푸시업 → 팔, 가슴·등
  lunge:  ['core', 'lower'], // 런지   → 복근, 하체
  squat:  ['core', 'lower'], // 스쿼트 → 복근, 하체
};

/* ════════════════════════════════════════════
   운동별 칼로리 상수 (kcal_per_kg_per_rep)
   공식: 체중(kg) × 총 횟수 × 상수
════════════════════════════════════════════ */
const EXERCISE_KCAL_PER_KG_PER_REP = {
  squat:  0.004375,
  lunge:  0.003938,
  pushup: 0.003325,
};

/* ════════════════════════════════════════════
   EXP 부위별 UI 메타 정보
   dbKey: characters 테이블 컬럼명과 일치
════════════════════════════════════════════ */
const EXP_PART_META = {
  arm:   { label: '팔 EXP',      barClass: 'bar-arm',   dbKey: 'arm_exp'   },
  chest: { label: '가슴·등 EXP', barClass: 'bar-chest', dbKey: 'chest_exp' },
  core:  { label: '복근 EXP',    barClass: 'bar-core',  dbKey: 'core_exp'  },
  lower: { label: '하체 EXP',    barClass: 'bar-leg',   dbKey: 'lower_exp' },
};

/* ════════════════════════════════════════════
   EXP 상수
   - LEVEL_MAX_EXP: 부위별 최대 EXP (250)
   - 모든 부위가 250 도달 시에만 레벨업 (백엔드 처리)
   - 최대치 도달 부위는 이후 운동에도 250에서 고정
════════════════════════════════════════════ */
const LEVEL_MAX_EXP = 250;

/* ════════════════════════════════════════════
   파티클 설정
════════════════════════════════════════════ */
const PARTICLE_CONFIG = [
  { left: '8%',  color: '#ff8c42', delay: '0s'    },
  { left: '20%', color: '#ffd166', delay: '0.15s' },
  { left: '33%', color: '#34c759', delay: '0.05s' },
  { left: '47%', color: '#5b7cf7', delay: '0.25s' },
  { left: '60%', color: '#ff8c42', delay: '0.1s'  },
  { left: '72%', color: '#ffd166', delay: '0.3s'  },
  { left: '85%', color: '#ff6b9d', delay: '0.2s'  },
  { left: '93%', color: '#34c759', delay: '0.35s' },
];

/* ════════════════════════════════════════════
   유틸 함수
════════════════════════════════════════════ */

/**
 * 칼로리 계산
 * 공식: 체중(kg) × 총 횟수 × kcal_per_kg_per_rep 상수
 *
 * @param {string} exerciseKey  'pushup' | 'lunge' | 'squat'
 * @param {number} totalReps    총 횟수 (sets × reps)
 * @param {number} weightKg     체중 kg (users.weight)
 * @returns {number}            소비 칼로리 (소수점 1자리)
 */
function calcCalories(exerciseKey, totalReps, weightKg) {
  const factor = EXERCISE_KCAL_PER_KG_PER_REP[exerciseKey] ?? 0.004375;
  return Math.round(weightKg * totalReps * factor * 10) / 10;
}

/**
 * 총 점수 계산 (100점 만점)
 * PERFECT: 100점 / GOOD: 70점 / DONE: 40점 가중 평균
 * TODO: 정확도 평가 연동 후 perfect/good/done 실제 값 사용
 *       현재는 전체 횟수를 DONE으로 처리하여 임시 산출 → 항상 40점
 */
function calcScore(perfect, good, done) {
  const total = perfect + good + done;
  if (total === 0) return 0;
  return Math.round((perfect * 100 + good * 70 + done * 40) / total);
}

/**
 * 부위별 실제 획득 EXP 계산
 * - 운동 후 누적값(post)에서 운동 전 누적값(pre)을 역산
 * - 백엔드가 상한(250)을 적용한 후의 값을 반환하므로
 *   pre = max(0, post - gain) 로 근사 계산
 * - 정확한 값이 필요하면 백엔드에서 prev_exp_map 함께 반환 필요
 *
 * @param {number} postAccum  운동 후 누적 EXP (DB 값, 최대 250)
 * @param {number} rawGain    이론상 획득량 (totalReps)
 * @returns {number}          실제 반영된 획득량
 */
function calcActualGain(postAccum, rawGain) {
  const preAccum = Math.max(0, postAccum - rawGain);
  return postAccum - preAccum; // 상한 적용 후 실제 증가분
}

/* ════════════════════════════════════════════
   Result 컴포넌트
════════════════════════════════════════════ */
const Result = () => {
  const navigate = useNavigate();
  const { workoutData } = useWorkout();

  // Context에서 운동 데이터 가져오기
  const {
    exercise_key = 'pushup',
    sets = 1,
    reps = 15,
    totalReps = 15,
    perfect = 0,
    normal = 0,
    calories = 0,
  } = workoutData ?? {};

  // 임시 캐릭터 정보 (나중에 API로 연동)
  const [character, setCharacter] = useState({
    animal_type: 'cat',
    level: '1',
    arm_exp: 0,
    chest_exp: 0,
    core_exp: 0,
    lower_exp: 0,
  });
  const [prevLevel] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [barReady, setBarReady] = useState(true);

  // ── 파생 계산값 ──
  const done = Math.max(0, totalReps - perfect - normal);
  const score = calcScore(perfect, normal, done);
  const churu = totalReps;

  // ── 임시: 레벨업 없음 ──
  const isLevelUp = false;
  const affectedParts = EXERCISE_EXP_MAP[exercise_key] ?? [];
  const expBarData = affectedParts.map((part) => {
    const meta = EXP_PART_META[part];
    const accumulated = 0;
    const barWidth = '0%';
    return { ...meta, accumulated, barWidth };
  });

  const animalType = character?.animal_type ?? 'cat';
  const currentLevel = character?.level ?? '1';
  const animalMap = ANIMAL_IMAGES[animalType] ?? ANIMAL_IMAGES['cat'];
  const currentImg = animalMap[currentLevel] ?? catLv1;
  const prevImg = animalMap[prevLevel ?? currentLevel] ?? catLv1;

  // ── 메인 렌더 ──
  return (
    <div className="container">
      <div className="overlay" />

      <div className="result-card">

        {/* ── 1. 헤더 + 파티클 ── */}
        <div className="result-header">
          <h1 className="result-title">🎉 운동 완료!</h1>
          <div className="particle-wrap">
            {PARTICLE_CONFIG.map((p, i) => (
              <div
                key={i}
                className="particle"
                style={{ left: p.left, top: '10%', background: p.color, animationDelay: p.delay }}
              />
            ))}
          </div>
        </div>

        {/* ── 2. 캐릭터 + EXP 카드 ── */}
        <div className="card">

          {isLevelUp ? (
            /* 레벨업 O: 이전 → 현재 비교 + 축하 배너 */
            <>
              <div className="cat-compare">
                <div className="cat-slot">
                  <span className="lv-badge">LV. {prevLevel}</span>
                  <img src={prevImg} className="cat-img" alt={`LV${prevLevel} 고양이`} />
                </div>
                <span className="arrow">→</span>
                <div className="cat-slot">
                  <span className="lv-badge highlight">LV. {currentLevel}</span>
                  <img src={currentImg} className="cat-img glow" alt={`LV${currentLevel} 고양이`} />
                </div>
              </div>
              <div className="levelup-banner">
                ✨ 레벨업! 새로운 외형이 해금되었습니다!
              </div>
            </>
          ) : (
            /* 레벨업 X: 현재 캐릭터 단독 */
            <div className="cat-single">
              <span className="lv-badge">LV. {currentLevel}</span>
              <img src={currentImg} className="cat-img" alt={`LV${currentLevel} 고양이`} />
            </div>
          )}

          {/* EXP 바 (운동 부위만 표시) */}
          <div className="exp-list">
            {expBarData.map((item, i) => (
              <div className="exp-row" key={i}>
                <span className="exp-label">{item.label}</span>
                <div className="exp-bar-wrap">
                  <div
                    className={`exp-bar-fill ${item.barClass}`}
                    style={{ width: barReady ? item.barWidth : '0%' }}
                  />
                </div>
                <div className="exp-right">
                  {/* 누적 EXP / 최대 EXP */}
                  <span className="exp-accum">
                    {item.accumulated}/{LEVEL_MAX_EXP}
                  </span>
                  {/* 이번 획득량 — 상한 도달 시 MAX 표시 */}
                  {item.isMaxed && item.actualGain === 0 ? (
                    <span className="exp-gain maxed">MAX</span>
                  ) : (
                    <span className="exp-gain">+{item.actualGain}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 츄르 획득량 */}
          <div className="divider" />
          <div className="churu-row">
            <span className="churu-icon">🍣</span>
            <span className="churu-label">츄르</span>
            <span className="churu-gain">+{churu}</span>
          </div>
        </div>

        {/* ── 3. 정확도 평가 — TODO: 연동 후 구현 ── */}

        {/* ── 4. 총 점수 + 칼로리 카드 ── */}
        <div className="card score-card">
          <div className="score-item">
            <span className="score-label">총 점수</span>
            {/* TODO: 정확도 연동 후 실제 점수 반영 */}
            <span className="score-value orange">{score}</span>
          </div>
          <div className="vdivider" />
          <div className="score-item">
            <span className="score-label">칼로리</span>
            <div className="calorie-row">
              <span className="score-value dark">{calories ?? '-'}</span>
              <span className="score-unit">kcal</span>
            </div>
          </div>
        </div>

        {/* ── 5. 버튼 ── */}
        <div className="btn-row">
          <button
            className="btn-primary btn-full"
            onClick={() => navigate('/exerciseselect')}
          >
            로비로 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
};

export default Result; // Result.jsx

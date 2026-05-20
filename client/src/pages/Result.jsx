import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../css/Result.css";
import { CHARACTER_CONFIG } from '../config/characters.js';

/* ════════════════════════════════════════════
   캐릭터 이미지 매핑
   assets 폴더의 파일명 규칙:
   {character_name}LV_{level}.png
   예) korean_shorthairLV_1.png
════════════════════════════════════════════ */
import ks1 from '../assets/korean_shorthairLV_1.png';
import ks2 from '../assets/korean_shorthairLV_2.png';
import ks3 from '../assets/korean_shorthairLV_3.png';
import rb1 from '../assets/russian_blueLV_1.png';
import rb2 from '../assets/russian_blueLV_2.png';
import rb3 from '../assets/russian_blueLV_3.png';
import mk1 from '../assets/munchkinLV_1.png';
import mk2 from '../assets/munchkinLV_2.png';
import mk3 from '../assets/munchkinLV_3.png';

const ANIMAL_IMAGES = {
  korean_shorthair: { '1': ks1, '2': ks2, '3': ks3 },
  russian_blue:     { '1': rb1, '2': rb2, '3': rb3 },
  munchkin:         { '1': mk1, '2': mk2, '3': mk3 },
};

/* ════════════════════════════════════════════
   레벨 키 매핑 (CHARACTER_CONFIG.max_exp 참조용)
   character.level('1'|'2'|'3') → max_exp.lv1|lv2|lv3
════════════════════════════════════════════ */
const LEVEL_KEY_MAP = { '1': 'lv1', '2': 'lv2', '3': 'lv3' };

/**
 * 캐릭터 종류 + 레벨에 따른 부위별 EXP 최대값 반환
 * @param {string} characterName  'korean_shorthair' | 'russian_blue' | 'munchkin'
 * @param {string} level          '1' | '2' | '3'
 * @returns {number}              해당 레벨의 EXP 최대값
 */
function getMaxExp(characterName, level) {
  const config   = CHARACTER_CONFIG[characterName];
  const levelKey = LEVEL_KEY_MAP[level] ?? 'lv1';
  return config?.max_exp?.[levelKey] ?? 50; // fallback 50
}

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
 * 총 점수 계산 (100점 만점)
 * 완벽: 100점 기여 / 보통: 60점 기여
 * 공식: (완벽 × 100 + 보통 × 60) / totalReps
 *
 * @param {number} perfect    완벽 횟수
 * @param {number} normal     보통 횟수
 * @param {number} totalReps  총 횟수 (sets × reps)
 * @returns {number}          0~100 정수
 */
function calcScore(perfect, normal, totalReps) {
  if (totalReps === 0) return 0;
  return Math.min(100, Math.round((perfect * 100 + normal * 60) / totalReps));
}

/**
 * 부위별 실제 획득 EXP 계산
 * 백엔드가 max_exp 상한 적용 후 저장하므로 역산
 *
 * @param {number} postAccum  운동 후 누적 EXP (DB 값)
 * @param {number} rawGain    이론상 획득량 (totalReps)
 * @returns {number}          실제 반영된 획득량
 */
function calcActualGain(postAccum, rawGain) {
  const preAccum = Math.max(0, postAccum - rawGain);
  return postAccum - preAccum;
}

/* ════════════════════════════════════════════
   Result 컴포넌트
════════════════════════════════════════════ */
const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /*
    ── Exercise.jsx에서 navigate('/result', { state: {...} })로 전달받는 데이터 ──
    exercise_key : 'pushup' | 'lunge' | 'squat'
    sets         : 세트 수
    reps         : 세트당 반복 횟수
    perfect      : 완벽 횟수  (Exercise.jsx gradeCountsRef.current.perfect)
    normal       : 보통 횟수  (Exercise.jsx gradeCountsRef.current.normal)
    calories     : 칼로리     (Exercise.jsx calcCalories 결과값)
  */
  const {
    exercise_key = 'pushup',
    sets         = 2,
    reps         = 15,
    perfect      = 0,
    normal       = 0,
    calories     = null, // Exercise.jsx에서 계산한 값 그대로 수신
  } = location.state ?? {};

  const totalReps = sets * reps;

  // ── 백엔드 응답 상태 ──
  const [character, setCharacter] = useState(null);
  const [prevLevel, setPrevLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError,  setApiError]  = useState(null);
  const [barReady,  setBarReady]  = useState(false);

  // ── API 호출 ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: user_idx를 AuthContext에서 가져오도록 수정
        const user_idx = 1; // 임시 하드코딩

        const res = await fetch(`/api/characters/${user_idx}`);
        if (!res.ok) throw new Error('API 응답 오류');

        const charData = await res.json();
        setCharacter(charData.character);
        setPrevLevel(charData.prev_level ?? charData.character.level);
      } catch (err) {
        console.error('[Result] 데이터 로딩 실패:', err);
        setApiError('데이터를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
        setTimeout(() => setBarReady(true), 150);
      }
    };

    fetchData();
  }, []);

  // ── 파생 계산값 ──

  // 총 점수: 완벽/보통 기반 새 공식
  const score = calcScore(perfect, normal, totalReps);

  // 츄르: 1회당 1츄르
  const churu = totalReps;

  // 레벨업 여부
  const isLevelUp = character !== null
    && prevLevel  !== null
    && character.level !== prevLevel;

  // 캐릭터 종류 및 레벨
  const characterName = character?.character_name ?? 'korean_shorthair';
  const currentLevel  = character?.level ?? '1';

  // 현재 레벨 기준 EXP 최대값 (종류 + 레벨에 따라 다름)
  const maxExp = getMaxExp(characterName, currentLevel);

  // 이번 운동으로 EXP 오른 부위
  const affectedParts = EXERCISE_EXP_MAP[exercise_key] ?? [];

  // EXP 바 데이터
  const expBarData = affectedParts.map((part) => {
    const meta        = EXP_PART_META[part];
    const accumulated = Math.min(character?.[meta.dbKey] ?? 0, maxExp); // 상한 보정
    const actualGain  = calcActualGain(accumulated, totalReps);
    const isMaxed     = accumulated >= maxExp;
    const barWidth    = `${(accumulated / maxExp) * 100}%`;

    return { ...meta, accumulated, actualGain, isMaxed, barWidth };
  });

  // 동물 이미지
  const animalMap  = ANIMAL_IMAGES[characterName] ?? ANIMAL_IMAGES['korean_shorthair'];
  const currentImg = animalMap[currentLevel]              ?? ks1;
  const prevImg    = animalMap[prevLevel ?? currentLevel] ?? ks1;

  // ── 로딩 ──
  if (isLoading) {
    return (
      <div className="container">
        <div className="overlay" />
        <p className="status-text">결과 불러오는 중…</p>
      </div>
    );
  }

  // ── 에러 ──
  if (apiError) {
    return (
      <div className="container">
        <div className="overlay" />
        <div className="error-wrap">
          <p className="status-text error">{apiError}</p>
          <button className="btn-primary btn-full" onClick={() => navigate('/exerciseselect')}>
            로비로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
            /* 레벨업 O */
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
            /* 레벨업 X */
            <div className="cat-single">
              <span className="lv-badge">LV. {currentLevel}</span>
              <img src={currentImg} className="cat-img" alt={`LV${currentLevel} 고양이`} />
            </div>
          )}

          {/* EXP 바 */}
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
                  <span className="exp-accum">{item.accumulated}/{maxExp}</span>
                  {item.isMaxed && item.actualGain === 0 ? (
                    <span className="exp-gain maxed">MAX</span>
                  ) : (
                    <span className="exp-gain">+{item.actualGain}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 츄르 */}
          <div className="divider" />
          <div className="churu-row">
            <span className="churu-icon">🍣</span>
            <span className="churu-label">츄르</span>
            <span className="churu-gain">+{churu}</span>
          </div>
        </div>

        {/* ── 3. 정확도 평가 ── */}
        <div className="card accuracy-card">
          <p className="section-label">정확도 평가</p>
          <div className="accuracy-grid">
            <div className="acc-item">
              <span className="acc-tag tag-perfect">완벽</span>
              <span className="acc-count">{perfect}</span>
            </div>
            <div className="acc-divider" />
            <div className="acc-item">
              <span className="acc-tag tag-normal">보통</span>
              <span className="acc-count">{normal}</span>
            </div>
          </div>
        </div>

        {/* ── 4. 총 점수 + 칼로리 카드 ── */}
        <div className="card score-card">
          <div className="score-item">
            <span className="score-label">총 점수</span>
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

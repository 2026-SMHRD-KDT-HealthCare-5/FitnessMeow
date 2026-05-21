import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/Result.css";
import { CHARACTER_CONFIG } from '../config/characters.js';

/* ════════════════════════════════════════════
   캐릭터 이미지 매핑
   assets 폴더의 파일명 규칙: {character_name}LV_{level}.png
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
════════════════════════════════════════════ */
const LEVEL_KEY_MAP = { '1': 'lv1', '2': 'lv2', '3': 'lv3' };

function getMaxExp(characterName, level) {
  const config   = CHARACTER_CONFIG[characterName];
  const levelKey = LEVEL_KEY_MAP[level] ?? 'lv1';
  return config?.max_exp?.[levelKey] ?? 50;
}

/* ════════════════════════════════════════════
   운동 종류 → EXP 적용 부위
════════════════════════════════════════════ */
const EXERCISE_EXP_MAP = {
  pushup: ['arm', 'chest'],
  lunge:  ['core', 'lower'],
  squat:  ['core', 'lower'],
};

/* ════════════════════════════════════════════
   EXP 부위별 메타 정보
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
 * 부위별 실제 획득 EXP 계산 (상한 역산)
 * @param {number} postAccum  운동 후 누적 EXP (DB 값, 상한 적용)
 * @param {number} rawGain    gained_exp (workouts/latest에서 수신)
 */
function calcActualGain(postAccum, rawGain) {
  const preAccum = Math.max(0, postAccum - rawGain);
  return postAccum - preAccum;
}

/* ════════════════════════════════════════════
   Result 컴포넌트

   ── 데이터 흐름 ──
   Exercise.jsx
     POST /api/workouts → { level_up, character_unlocked, next_character_name }
     navigate('/result', { state: { level_up, character_unlocked, next_character_name } })

   Result.jsx
     GET /api/character        → 현재 캐릭터 상태
     GET /api/workouts/latest  → 최신 운동 기록
     location.state            → level_up, character_unlocked, next_character_name
════════════════════════════════════════════ */
const Result = () => {
  const navigate = useNavigate();

  /*
    Exercise.jsx의 POST /api/workouts 응답을 navigate state로 전달받음
    - level_up            : 레벨업 여부 (true/false)
    - character_unlocked  : 새 종 해금 여부 (true/false)
    - next_character_name : 해금된 종 이름 ('러시안블루' 등), character_unlocked: true 시에만
  */
  const {
    level_up           = false,
    character_unlocked = false,
    next_character_name = null,
  } = location.state ?? {};

  // ── 백엔드 응답 상태 ──
  const [character, setCharacter] = useState(null); // GET /api/character
  const [workout,   setWorkout]   = useState(null); // GET /api/workouts/latest
  const [isLoading, setIsLoading] = useState(true);
  const [apiError,  setApiError]  = useState(null);
  const [barReady,  setBarReady]  = useState(false);

  // ── API 호출 ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [charRes, workoutRes] = await Promise.all([
          /*
            GET /api/character
            응답: {
              character_name : 'korean_shorthair',
              level          : '2',
              arm_exp        : 38,
              chest_exp      : 22,
              core_exp       : 45,
              lower_exp      : 50
            }
          */
          fetch('/api/character', { credentials: 'include' }),

          /*
            GET /api/workouts/latest
            응답: {
              exercise_key  : 'pushup',
              sets          : 3,
              reps          : 10,
              total_score   : 80,
              calories      : 7.3,
              perfect_count : 18,
              normal_count  : 10,
              gained_exp    : 30    ← sets × reps (부위당 획득량 = 츄르 획득량)
            }
          */
          fetch('/api/workouts/latest', { credentials: 'include' }),
        ]);

        if (!charRes.ok || !workoutRes.ok) throw new Error('API 응답 오류');

        const charData    = await charRes.json();
        const workoutData = await workoutRes.json();

        setCharacter(charData);
        setWorkout(workoutData);
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

  // ── workout_records에서 수신한 값 ──
  const exercise_key = workout?.exercise_key  ?? 'pushup';
  const score        = workout?.total_score   ?? 0;
  const calories     = workout?.calories      ?? null;
  const perfect      = workout?.perfect_count ?? 0;
  const normal       = workout?.normal_count  ?? 0;
  const gained_exp   = workout?.gained_exp    ?? 0;

  // 츄르 = EXP 획득량과 동일
  const churu = gained_exp;

  // ── 캐릭터 파생 계산 ──
  const characterName = character?.character_name ?? 'korean_shorthair';
  const currentLevel  = character?.level          ?? '1';
  const maxExp        = getMaxExp(characterName, currentLevel);

  // level_up === true 시 이전 레벨 = 현재 레벨 - 1
  const prevLevel = level_up
    ? String(Math.max(1, parseInt(currentLevel) - 1))
    : currentLevel;

  // EXP 바 데이터 (운동 부위만 표시)
  const affectedParts = EXERCISE_EXP_MAP[exercise_key] ?? [];
  const expBarData = affectedParts.map((part) => {
    const meta        = EXP_PART_META[part];
    const accumulated = Math.min(character?.[meta.dbKey] ?? 0, maxExp);
    const actualGain  = calcActualGain(accumulated, gained_exp);
    const isMaxed     = accumulated >= maxExp;
    const barWidth    = `${(accumulated / maxExp) * 100}%`;
    return { ...meta, accumulated, actualGain, isMaxed, barWidth };
  });

  // 동물 이미지
  const animalMap  = ANIMAL_IMAGES[characterName] ?? ANIMAL_IMAGES['korean_shorthair'];
  const currentImg = animalMap[currentLevel] ?? ks1;
  const prevImg    = animalMap[prevLevel]    ?? ks1;

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

          {level_up ? (
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

          {/* 새 종 해금 배너 (character_unlocked: true 시에만) */}
          {character_unlocked && next_character_name && (
            <div className="unlock-banner">
              🎊 {next_character_name} 해금! 새로운 고양이를 만나보세요!
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

          {/* 츄르 — EXP 획득량과 동일, 누적 미표시 */}
          <div className="divider" />
          <div className="churu-row">
            <span className="churu-icon">🍣</span>
            <span className="churu-label">츄르</span>
            <span className="churu-gain">+{churu}</span>
          </div>
        </div>

        {/* ── 3. 정확도 평가 ── */}
        <div className="card">
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
            onClick={() => navigate('/mainlobby')}
          >
            로비로 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
};

export default Result; // Result.jsx

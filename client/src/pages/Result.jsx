import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../css/Result.css";
import { CHARACTER_CONFIG } from '../config/characters.js';
import coinImg from "../assets/coin.png";

/* ════════════════════════════════════════════
   캐릭터 이미지
   파일명 규칙: assets/characters/{configKey}/{configKey}_LV_{level}.png
════════════════════════════════════════════ */
const IMAGES = import.meta.glob('../assets/characters/**/*.png', { eager: true });
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getCharacterImage(configKey, level) {
  const path = `../assets/characters/${configKey}/${configKey}_LV_${level}.png`;
  return IMAGES[path]?.default ?? null;
}

/* ════════════════════════════════════════════
   운동 종류 → EXP 적용 부위
════════════════════════════════════════════ */
const EXERCISE_EXP_MAP = {
  pushup: ['chest', 'arm', 'core'],
  squat:  ['lower', 'core'],
  lunge:  ['lower', 'core'],
};

/* ════════════════════════════════════════════
   EXP 부위별 메타 정보
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

const BAR_ANIMATION_DELAY_MS = 150;
const DEFAULT_CONFIG_KEY     = 'cheese_korean_shorthair';

// level 문자열/숫자 혼재 대응
function getMaxExp(configKey, level) {
  const levelKey = { '1': 'lv1', '2': 'lv2', '3': 'lv3' }[String(level)] ?? 'lv1';
  return CHARACTER_CONFIG[configKey]?.max_exp?.[levelKey] ?? 50;
}

// DB level이 문자열/숫자 혼재할 수 있어 parseInt로 안전하게 파싱
function parseLevelSafe(level, fallback = 1) {
  const n = parseInt(level, 10);
  return Number.isFinite(n) ? n : fallback;
}

/* ════════════════════════════════════════════
   Result 컴포넌트

   ── 데이터 흐름 ──
   Exercise.jsx
     POST /api/workouts → { level_up, character_unlocked, next_character_name }
     navigate('/result', { state: { level_up, character_unlocked, next_character_name } })

   Result.jsx
     location.state  → 이벤트성 데이터 (레벨업 여부 등)
     GET /api/result → 최신 운동 기록 + 현재 캐릭터 상태
════════════════════════════════════════════ */
const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Exercise.jsx에서 navigate state로 넘겨받은 이벤트 데이터
  // character: 운동한 캐릭터의 최종 상태 (해금 직후엔 API가 새 캐릭터를 반환하므로 state 우선 사용)
  const {
    level_up              = false,
    character_unlocked    = false,
    next_character_name   = null,
    character: charFromState = null,
  } = location.state ?? {};

  const [workout,    setWorkout]   = useState(null);
  const [character,  setCharacter] = useState(null);
  const [isLoading,  setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [barReady,   setBarReady]  = useState(false); // EXP 바 애니메이션 트리거

  // GET /api/result → 운동 기록 + 캐릭터 상태 조회
  useEffect(() => {
    // location.state 없으면 URL 직접 접근 → 로비로 리다이렉트
    if (!location.state) {
      navigate('/mainlobby', { replace: true });
      return;
    }

    fetch(`${API_URL}/api/result`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`result API ${r.status}`);
        return r.json();
      })
      .then(({ workout, character }) => {
        setWorkout(workout);
        setCharacter(character);
        setIsLoading(false);
        setTimeout(() => setBarReady(true), BAR_ANIMATION_DELAY_MS); // 마운트 후 바 애니메이션 시작
      })
      .catch((err) => {
        console.error('[Result] API 실패:', err);
        setFetchError(true);
        setIsLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 조건부 return (hooks 이후에 위치) ──
  if (!location.state) return null;

  if (isLoading) {
    return (
      <div className="container">
        <div className="overlay" />
        <div className="result-card result-card--loading">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card skeleton--card-sm" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container">
        <div className="overlay" />
        <div className="error-wrap">
          <p className="status-text error">데이터를 불러오지 못했습니다.</p>
          <button className="btn-primary btn-full" onClick={() => navigate('/mainlobby')}>
            로비로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ── 파생값 계산 (실제 렌더할 때만 실행) ──
  // charFromState: 운동한 캐릭터(러시안블루 등) 최종 상태 — 해금 직후에도 올바른 캐릭터 보장
  // character (API): charFromState 없을 때 폴백용
  const displayChar     = charFromState ?? character;
  const configKey       = displayChar?.character_key ?? DEFAULT_CONFIG_KEY;
  const displayName     = CHARACTER_CONFIG[configKey]?.character_name ?? '';
  const currentLevel    = String(displayChar?.level ?? '1');
  const currentLevelNum = parseLevelSafe(currentLevel, 1);
  const maxExp          = getMaxExp(configKey, currentLevel);
  const prevLevel       = level_up ? String(Math.max(1, currentLevelNum - 1)) : currentLevel; // 레벨업 시 이전 레벨 이미지 표시용
  const currentImg      = getCharacterImage(configKey, currentLevel);
  const prevImg         = getCharacterImage(configKey, prevLevel);
  const exercise_key    = workout?.exercise_key ?? 'pushup';
  const gained_exp      = workout?.gained_exp   ?? 0;
  const gainedParts = new Set(EXERCISE_EXP_MAP[exercise_key] ?? []);

  // 모든 부위 EXP 바 데이터 생성 (획득 여부 포함)
  const expBarData = Object.entries(EXP_PART_META).map(([part, meta]) => {
    const current  = displayChar?.[meta.dbKey] ?? 0;
    const barWidth = `${Math.min((current / maxExp) * 100, 100)}%`;
    const isMaxed  = current >= maxExp;
    const gained   = gainedParts.has(part);
    return { ...meta, current, isMaxed, barWidth, gained };
  });

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

          {/* 레벨업 시 이전/현재 캐릭터 비교, 아니면 현재 캐릭터만 표시 */}
          {level_up ? (
            <>
              <div className="cat-compare">
                <div className="cat-slot">
                  <span className="lv-badge">LV. {prevLevel}</span>
                  <img src={prevImg} className="cat-img" alt={`${displayName} LV.${prevLevel}`} />
                </div>
                <span className="arrow">→</span>
                <div className="cat-slot">
                  <span className="lv-badge highlight">LV. {currentLevel}</span>
                  <img src={currentImg} className="cat-img glow" alt={`${displayName} LV.${currentLevel}`} />
                </div>
              </div>
              <div className="levelup-banner">✨ 레벨업! 고양이가 성장했습니다!</div>
            </>
          ) : (
            <div className="cat-single">
              <span className="lv-badge">LV. {currentLevel}</span>
              <img src={currentImg} className="cat-img" alt={`${displayName} LV.${currentLevel}`} />
            </div>
          )}

          {/* 새 캐릭터 종 해금 배너 */}
          {character_unlocked && next_character_name && (
            <div className="unlock-banner">
              🎊 {next_character_name} 해금! 새로운 고양이를 만나보세요!
            </div>
          )}

          {/* 부위별 EXP 바 */}
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
                  <span className="exp-accum">{item.current}/{maxExp}</span>
                    {item.isMaxed
                      ? <span className="exp-gain maxed">MAX</span>
                      : item.gained
                        ? <span className="exp-gain">+{gained_exp}</span>
                        : null
                    }
                </div>
              </div>
            ))}
          </div>

          <div className="divider" />

          {/* 코인 획득량 */}
          <div className="coin-row">
            <img src={coinImg} alt="coin" />
            <span className="coin">코인</span>
            <span className="coin-gain">+{gained_exp}</span>
          </div>
        </div>

        {/* ── 3. 정확도 평가 ── */}
        <div className="card">
          <p className="section-label">정확도 평가</p>
          <div className="accuracy-grid">
            <div className="acc-item">
              <span className="acc-tag tag-perfect">완벽</span>
              <span className="acc-count">{workout.perfect_count}</span>
            </div>
            <div className="acc-divider" />
            <div className="acc-item">
              <span className="acc-tag tag-normal">보통</span>
              <span className="acc-count">{workout.normal_count}</span>
            </div>
          </div>
        </div>

        {/* ── 4. 총 점수 + 칼로리 ── */}
        <div className="card score-card">
          <div className="score-item">
            <span className="score-label">총 점수</span>
            <span className="score-value orange">{workout.total_score}</span>
          </div>
          <div className="vdivider" />
          <div className="score-item">
            <span className="score-label">칼로리</span>
            <div className="calorie-row">
              <span className="score-value dark">{workout.calories ?? '-'}</span>
              <span className="score-unit">kcal</span>
            </div>
          </div>
        </div>

        {/* ── 5. 로비 이동 버튼 ── */}
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

export default Result;

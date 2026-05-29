/**
 * Result.jsx — 운동 결과 페이지
 *
 * 목차:
 *   1. 이미지 로드       — Vite glob으로 캐릭터 PNG 전체를 URL 맵으로 로드
 *   2. 상수 및 맵        — 운동별 EXP 적용 부위, 부위별 메타 정보, 파티클 설정
 *   3. 유틸 함수         — maxExp 조회, level 안전 파싱
 *   4. 상태 및 데이터 로드 — GET /api/result 로 운동 기록 + 캐릭터 상태 조회
 *   5. 파생값 계산       — 레벨·EXP 바·캐릭터 이미지 등 렌더용 값 계산
 *   6. 렌더             — 헤더·캐릭터 EXP 카드·정확도·점수·로비 버튼
 *
 * 데이터 흐름:
 *   Exercise.jsx → POST /api/workouts → navigate('/result', { state: data })
 *   Result.jsx   → location.state (이벤트성 데이터) + GET /api/result (최신 상태)
 *
 * API 연동:
 *   GET /api/result — 최근 운동 기록 { workout } + 현재 캐릭터 상태 { character }
 *
 * 비고:
 *   - location.state 없이 URL 직접 접근 시 /mainlobby 로 리다이렉트
 *   - charFromState: 레벨업·캐릭터 해금 직후 API가 새 캐릭터를 반환하는 경우 대비
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../css/Result.css";
import coinImg from "../assets/coin.png";

// ══════════════════════════════════════
// 1. 이미지 로드
//    빌드 타임에 캐릭터 이미지를 모두 URL 맵으로 로드
// ══════════════════════════════════════

/* ════════════════════════════════════════════
   캐릭터 이미지
   파일명 규칙: assets/characters/{configKey}/{configKey}_LV_{level}.png
════════════════════════════════════════════ */
// 캐릭터 폴더 하위 모든 PNG를 eager 로드하여 경로 → URL 맵 생성
const IMAGES = import.meta.glob('../assets/characters/**/*.png', { eager: true });
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// 캐릭터 키 + 레벨로 이미지 URL 조회 (파일 없으면 null 반환)
function getCharacterImage(configKey, level) {
  const path = `../assets/characters/${configKey}/${configKey}_LV_${level}.png`;
  return IMAGES[path]?.default ?? null;
}

// ══════════════════════════════════════
// 2. 상수 및 맵
//    운동별 EXP 부위, 부위 메타, 파티클 애니메이션 설정
// ══════════════════════════════════════

/* ════════════════════════════════════════════
   운동 종류 → EXP 적용 부위
════════════════════════════════════════════ */
// 각 운동에서 EXP가 증가하는 신체 부위 목록
const EXERCISE_EXP_MAP = {
  pushup: ['chest', 'arm', 'core'],
  squat:  ['lower', 'core'],
  lunge:  ['lower', 'core'],
};

/* ════════════════════════════════════════════
   EXP 부위별 메타 정보
════════════════════════════════════════════ */
// 각 부위의 UI 레이블·CSS 바 클래스·DB 컬럼 키 매핑
const EXP_PART_META = {
  arm:   { label: '팔 EXP',      barClass: 'bar-arm',   dbKey: 'arm_exp'   },
  chest: { label: '가슴·등 EXP', barClass: 'bar-chest', dbKey: 'chest_exp' },
  core:  { label: '복근 EXP',    barClass: 'bar-core',  dbKey: 'core_exp'  },
  lower: { label: '하체 EXP',    barClass: 'bar-leg',   dbKey: 'lower_exp' },
};

/* ════════════════════════════════════════════
   파티클 설정
════════════════════════════════════════════ */
// 결과 화면 상단 파티클 애니메이션 위치·색상·지연 설정
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

// EXP 바 애니메이션 시작 딜레이 (마운트 후 150ms 뒤 barReady=true)
const BAR_ANIMATION_DELAY_MS = 150;

// ══════════════════════════════════════
// 3. 유틸 함수
//    level 안전 파싱 (문자열/숫자 혼재 대응)
// ══════════════════════════════════════

// DB level이 문자열/숫자 혼재할 수 있어 parseInt로 안전하게 파싱
function parseLevelSafe(level, fallback = 1) {
  const n = parseInt(level, 10);
  return Number.isFinite(n) ? n : fallback;
}

// ══════════════════════════════════════
// 4. 상태 및 데이터 로드
//    location.state 검증 → GET /api/result 로 운동 기록 + 캐릭터 상태 조회
// ══════════════════════════════════════

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
        // 마운트 후 딜레이를 두고 EXP 바 애니메이션 시작
        setTimeout(() => setBarReady(true), BAR_ANIMATION_DELAY_MS);
      })
      .catch((err) => {
        console.error('[Result] API 실패:', err);
        setFetchError(true);
        setIsLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 조건부 return (hooks 이후에 위치) ──
  if (!location.state) return null;

  // 로딩 중: 스켈레톤 UI 표시
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

  // API 오류: 에러 메시지 + 로비 이동 버튼
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

  // ══════════════════════════════════════
  // 5. 파생값 계산
  //    렌더에 필요한 캐릭터·레벨·EXP 바 데이터 계산
  // ══════════════════════════════════════

  // ── 파생값 계산 (실제 렌더할 때만 실행) ──
  // charFromState: 운동한 캐릭터(러시안블루 등) 최종 상태 — 해금 직후에도 올바른 캐릭터 보장
  // character (API): charFromState 없을 때 폴백용
  const displayChar     = charFromState ?? character;
  const currentLevel    = String(displayChar?.level ?? '1');
  const currentLevelNum = parseLevelSafe(currentLevel, 1);
  const displayName     = displayChar?.character_name ?? '';
  const maxExp          = displayChar?.max_exp ?? 50;
  // 레벨업 시 이전 레벨 이미지를 비교 표시용으로 계산
  const prevLevel       = level_up ? String(Math.max(1, currentLevelNum - 1)) : currentLevel;
  const configKey       = displayChar?.character_key ?? 'cheese_korean_shorthair';
  const currentImg      = getCharacterImage(configKey, currentLevel);
  const prevImg         = getCharacterImage(configKey, prevLevel);
  const exercise_key    = workout?.exercise_key ?? 'pushup';
  const gained_exp      = workout?.gained_exp   ?? 0;
  // 이번 운동에서 EXP를 획득한 부위 집합
  const gainedParts = new Set(EXERCISE_EXP_MAP[exercise_key] ?? []);

  // 모든 부위 EXP 바 데이터 생성 (획득 여부 포함)
  const expBarData = Object.entries(EXP_PART_META).map(([part, meta]) => {
    const current  = displayChar?.[meta.dbKey] ?? 0;
    const barWidth = `${Math.min((current / maxExp) * 100, 100)}%`;
    const isMaxed  = current >= maxExp;
    const gained   = gainedParts.has(part);
    return { ...meta, current, isMaxed, barWidth, gained };
  });

  // ══════════════════════════════════════
  // 6. 렌더
  //    헤더·파티클 → 캐릭터 EXP 카드 → 정확도 → 점수·칼로리 → 로비 버튼
  // ══════════════════════════════════════

  // ── 메인 렌더 ──
  return (
    <div className="container">
      <div className="overlay" />
      <div className="result-card">

        {/* ── 1. 헤더 + 파티클 ── */}
        <div className="result-header">
          <h1 className="result-title">🎉 운동 완료!</h1>
          {/* 파티클 애니메이션 — PARTICLE_CONFIG 설정 기반 */}
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
            // 레벨업 없는 경우 현재 레벨 캐릭터만 단독 표시
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

          {/* 부위별 EXP 바 — barReady=true 시 CSS 애니메이션으로 확장 */}
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

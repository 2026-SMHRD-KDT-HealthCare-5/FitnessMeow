/**
 * ExerciseSelect.jsx — 운동 종목 선택 페이지
 *
 * 목차:
 *   1. 아이콘 로드       — Vite glob으로 icons 폴더 PNG 전체를 URL 맵으로 로드
 *   2. 운동 카드 데이터  — 스쿼트·푸시업·런지 카드 정보 (키·이름·설명·테마·아이콘) 배열
 *   3. 컴포넌트 및 렌더  — 카드 목록을 map으로 순회하여 선택 UI 구성
 *
 * Props:
 *   onSelect {function} — 카드 클릭 시 호출, 선택한 운동 key 문자열 전달
 *                         기본값: () => {} (부모 없이 단독 렌더 시 오류 방지)
 *
 * 사용처:
 *   ExerciseSetting.jsx 에서 page='select' 일 때 렌더됨
 *   onSelect 콜백으로 선택한 운동 key를 ExerciseSetting 상태에 전달
 */

import React from 'react';
import "../css/ExerciseSelect.css";
import Navbar from "../components/Navbar.jsx";

// ══════════════════════════════════════
// 1. 아이콘 로드
//    빌드 타임에 icons 폴더 전체 PNG를 URL 맵으로 로드
// ══════════════════════════════════════

//수정 편하게 운동카드 데이터를 객체로 바꾸고 map으로 화면 구성
/* ════════════════════════════════════════════
   아이콘 폴더 전체 import
════════════════════════════════════════════ */
// icons 폴더의 PNG 파일을 모두 URL 맵으로 로드 (eager: 빌드 타임에 즉시 번들링)
const ICONS = import.meta.glob('../assets/icons/*.png', { eager: true });

// 파일명으로 아이콘 URL 조회 — ICONS 맵에서 default export를 반환
function icon(filename) {
  return ICONS[`../assets/icons/${filename}`]?.default;
}

// ══════════════════════════════════════
// 2. 운동 카드 데이터
//    카드 표시에 필요한 모든 정보를 배열로 정의
// ══════════════════════════════════════

/* ════════════════════════════════════════════
   운동 카드 데이터
════════════════════════════════════════════ */
// 각 운동의 key·레이블·설명·테마 클래스·대표 고양이 이미지·관련 부위 아이콘 정의
const EXERCISES = [
  {
    key:     'squat',
    label:   '스쿼트',
    desc:    '하체를 집중적으로 강화해요!',
    theme:   'squat-theme',
    cat:     icon('s-cat.png'),
    parts:   [
      { img: icon('leg.png'),  label: '하체 강화' },
      { img: icon('core.png'), label: '코어 강화' },
    ],
  },
  {
    key:     'pushup',
    label:   '푸시업',
    desc:    '상체를 탄탄하게 만들어보세요!',
    theme:   'pushup-theme',
    cat:     icon('p-cat.png'),
    parts:   [
      { img: icon('chest.png'),  label: '상체 강화' },
      { img: icon('arm.png'),    label: '팔 강화'   },
      { img: icon('core.png'),   label: '코어 강화' },
    ],
  },
  {
    key:     'lunge',
    label:   '런지',
    desc:    '균형감 있는 하체를 만들어보세요!',
    theme:   'lunge-theme',
    cat:     icon('l-cat.png'),
    parts:   [
      { img: icon('leg.png'),  label: '하체 강화' },
      { img: icon('core.png'), label: '코어 강화' },
    ],
  },
];

// ══════════════════════════════════════
// 3. 컴포넌트 및 렌더
//    EXERCISES 배열을 map으로 순회하여 클릭 가능한 운동 카드 목록 렌더
// ══════════════════════════════════════

/* ════════════════════════════════════════════
   ExerciseSelect 컴포넌트
════════════════════════════════════════════ */
const ExerciseSelect = ({ onSelect = () => {} }) => {
  return (
    <div className="container">
      <div className="overlay" />

      <div className="login-card">
        <h1 className="select-title">운동 선택</h1>
        <p className="sub-text">오늘 수행할 운동 루틴을 결정해보세요! 🐾</p>

        {/* 운동 카드 목록 — 카드 클릭 시 onSelect(key) 콜백 호출 */}
        <div className="exercise-list">
          {EXERCISES.map(({ key, label, desc, theme, cat, parts }) => (
            <div
              key={key}
              className={`exercise-card ${theme}`}
              onClick={() => onSelect(key)}
            >
              {/* 대표 고양이 이미지 영역 */}
              <div className="cat-section">
                <img src={cat} className="cat-main-img" alt={`${label} 고양이`} />
              </div>

              {/* 운동 정보: 이름·설명·관련 부위 아이콘 */}
              <div className="info-section">
                <h3>{label}</h3>
                <p className="sub-desc">{desc}</p>
                <div className="icon-group">
                  {parts.map(({ img, label: partLabel }) => (
                    <div className="icon-item" key={partLabel}>
                      <img src={img} alt={partLabel} />
                      <span>{partLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 카드 우측 화살표 버튼 */}
              <button className="arrow-button" type="button">〉</button>
            </div>
          ))}
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default ExerciseSelect;

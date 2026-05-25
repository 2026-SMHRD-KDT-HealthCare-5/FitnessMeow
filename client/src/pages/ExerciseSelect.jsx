import React from 'react';
import "../css/ExerciseSelect.css";
import Navbar from "../components/Navbar.jsx";

//수정 편하게 운동카드 데이터를 객체로 바꾸고 map으로 화면 구성
/* ════════════════════════════════════════════
   아이콘 폴더 전체 import
════════════════════════════════════════════ */
const ICONS = import.meta.glob('../assets/icons/*.png', { eager: true });

function icon(filename) {
  return ICONS[`../assets/icons/${filename}`]?.default;
}

/* ════════════════════════════════════════════
   운동 카드 데이터
════════════════════════════════════════════ */
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

        <div className="exercise-list">
          {EXERCISES.map(({ key, label, desc, theme, cat, parts }) => (
            <div
              key={key}
              className={`exercise-card ${theme}`}
              onClick={() => onSelect(key)}
            >
              <div className="cat-section">
                <img src={cat} className="cat-main-img" alt={`${label} 고양이`} />
              </div>

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
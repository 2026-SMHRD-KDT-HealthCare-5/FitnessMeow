import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../css/Result.css";

// 고양이 이미지 – 프로젝트 assets 경로에 맞게 교체
import catLv2 from "../assets/s-cat.png"; // 레벨업 전 고양이
import catLv3 from "../assets/p-cat.png"; // 레벨업 후 고양이

/* ─────────────────────────────────────────
   파티클 설정
───────────────────────────────────────── */
const PARTICLE_CONFIG = [
  { left: "8%",  color: "#ff8c42", delay: "0s"    },
  { left: "20%", color: "#ffd166", delay: "0.15s" },
  { left: "33%", color: "#34c759", delay: "0.05s" },
  { left: "47%", color: "#5b7cf7", delay: "0.25s" },
  { left: "60%", color: "#ff8c42", delay: "0.1s"  },
  { left: "72%", color: "#ffd166", delay: "0.3s"  },
  { left: "85%", color: "#ff6b9d", delay: "0.2s"  },
  { left: "93%", color: "#34c759", delay: "0.35s" },
];

/* ─────────────────────────────────────────
   EXP 바 설정 (운동 종류별 파트 고정값)
   실제 서비스에서는 props 또는 location.state로 전달
───────────────────────────────────────── */
const EXP_DATA = [
  { label: "팔 EXP",    barClass: "bar-arm",   width: "68%", gain: "+20" },
  { label: "가슴·등 EXP", barClass: "bar-chest", width: "45%", gain: "+10" },
  { label: "복근 EXP",  barClass: "bar-core",  width: "57%", gain: "+15" },
  { label: "하체 EXP",  barClass: "bar-leg",   width: "80%", gain: "+25" },
];

/* ─────────────────────────────────────────
   Result 컴포넌트
───────────────────────────────────────── */
const Result = () => {
  const navigate = useNavigate();

  /*
    실제 연동 시:
      const location = useLocation();
      const { score, calories, perfect, good, done, isLevelUp } = location.state ?? {};
    아래는 더미 데이터
  */
  const score    = 920;
  const calories = 124;
  const perfect  = 12;
  const good     = 8;
  const done     = 3;
  const isLevelUp = true; // 레벨업 여부

  // EXP 바 애니메이션 – 마운트 직후 width 적용
  const [barReady, setBarReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBarReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="container">
      <div className="overlay"></div>

      <div className="result-card">

        {/* ── 1. 운동 완료 헤더 + 파티클 ── */}
        <div className="result-header">
          <h1 className="result-title">🎉 운동 완료!</h1>

          <div className="particle-wrap">
            {PARTICLE_CONFIG.map((p, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: p.left,
                  top: "10%",
                  background: p.color,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </div>
        </div>

        {/* ── 2. EXP 획득 + 레벨업 고양이 ── */}
        <div className="level-up-section">

          {/* 레벨업 시에만 고양이 비교 이미지 노출 */}
          {isLevelUp && (
            <>
              <div className="level-up-cats">
                <div className="cat-slot">
                  <span className="level-badge">LV. 2</span>
                  <img src={catLv2} className="cat-img" alt="레벨업 전 고양이" />
                </div>

                <span className="level-arrow">→</span>

                <div className="cat-slot">
                  <span className="level-badge active">LV. 3</span>
                  <img src={catLv3} className="cat-img leveled" alt="레벨업 후 고양이" />
                </div>
              </div>

              <div className="levelup-banner">
                ✨ 레벨업! 새로운 외형이 해금되었습니다!
              </div>
            </>
          )}

          {/* EXP 바 리스트 */}
          <div className="exp-list">
            {EXP_DATA.map((item, i) => (
              <div className="exp-row" key={i}>
                <span className="exp-label">{item.label}</span>
                <div className="exp-bar-wrap">
                  <div
                    className={`exp-bar-fill ${item.barClass}`}
                    style={{ width: barReady ? item.width : "0%" }}
                  />
                </div>
                <span className="exp-gain">{item.gain}</span>
              </div>
            ))}
          </div>

          {/* 츄르 획득량 */}
          <div className="churu-divider" />
          <div className="churu-row">
            <span className="churu-icon">🍣</span>
            <span className="churu-label">츄르</span>
            <span className="churu-gain">+300</span>
          </div>
        </div>

        {/* ── 3. 정확도 평가 대시보드 ── */}
        <div className="accuracy-section">
          <p className="section-label">정확도 평가</p>
          <div className="accuracy-grid">
            <div className="acc-item">
              <span className="acc-tag tag-perfect">PERFECT</span>
              <span className="acc-count">{perfect}</span>
            </div>
            <div className="acc-divider" />
            <div className="acc-item">
              <span className="acc-tag tag-good">GOOD</span>
              <span className="acc-count">{good}</span>
            </div>
            <div className="acc-divider" />
            <div className="acc-item">
              <span className="acc-tag tag-done">DONE</span>
              <span className="acc-count">{done}</span>
            </div>
          </div>
        </div>

        {/* ── 4. 총 점수 + 칼로리 ── */}
        <div className="score-section">
          <div className="score-item">
            <span className="score-label">총 점수</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-divider" />
          <div className="score-item">
            <span className="score-label">칼로리</span>
            <div className="calorie-row">
              <span className="score-value-sm">{calories}</span>
              <span className="score-unit">kcal</span>
            </div>
          </div>
        </div>

        {/* ── 5. 하단 버튼 ── */}
        <div className="result-buttons">
          <button
            className="result-btn-secondary"
            onClick={() => navigate('/exerciseselect')}
          >
            로비로 돌아가기
          </button>
          <button
            className="result-btn-primary"
            onClick={() => navigate('/record')}  // 기록 상세 라우트 연결
          >
            기록 상세 보기
          </button>
        </div>

      </div>
    </div>
  );
};

export default Result; // Result.jsx

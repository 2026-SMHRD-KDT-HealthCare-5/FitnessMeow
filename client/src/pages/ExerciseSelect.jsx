import React from 'react';
import "../css/ExerciseSelect.css";
import Navbar from "../components/Navbar.jsx"; // 네비게이션 바 컴포넌트 불러오기

import squatCat from "../assets/s-cat.png"; // 스쿼트 고양이 이미지
import pushupCat from "../assets/p-cat.png"; // 푸시업 고양이 이미지
import lungeCat from "../assets/l-cat.png"; // 런지 고양이 이미지
import coreIcon from "../assets/core-icon.png"; // 코어 강화 아이콘
import lowerIcon from "../assets/leg-icon.png"; // 하체 강화 아이콘
import upperIcon from "../assets/8icon.png"; // 상체 강화 아이콘

const ExerciseSelect = () => {
  return (
    <div className="container">
      <div className="overlay"></div>
      
      <div className="login-card">
        {/* 로고 대신 "운동 선택" 대형 타이틀 배치로 꽉 찬 시각적 효과 */}
        <h1 className="select-title">운동 선택</h1>
        <p className="sub-text">오늘 수행할 운동 루틴을 결정해보세요! 🐾</p>

        {/* 메인 운동 카드 리스트 */}
        <div className="exercise-list">
          
          {/* 스쿼트 카드 (하체 + 코어) */}
          <div className="exercise-card squat-theme">
            <div className="cat-section">
              <img src={squatCat} className="cat-main-img" alt="스쿼트 고양이" />
            </div>
            <div className="info-section">
              <h3>스쿼트</h3>
              <p className="sub-desc">하체를 집중적으로 강화해요!</p>
              <div className="icon-group">
                <div className="icon-item">
                  <img src={lowerIcon} alt="하체 강화" />
                  <span>하체 강화</span>
                </div>
                <div className="icon-item">
                  <img src={coreIcon} alt="코어 강화" />
                  <span>코어 강화</span>
                </div>
              </div>
            </div>
            <button className="arrow-button">〉</button>
          </div>

          {/* 푸시업 카드 (상체 + 코어) */}
          <div className="exercise-card pushup-theme">
            <div className="cat-section">
              <img src={pushupCat} className="cat-main-img" alt="푸시업 고양이" />
            </div>
            <div className="info-section">
              <h3>푸시업</h3>
              <p className="sub-desc">상체를 탄탄하게 만들어보세요!</p>
              <div className="icon-group">
                <div className="icon-item">
                  <img src={upperIcon} alt="상체 강화" />
                  <span>상체 강화</span>
                </div>
                <div className="icon-item">
                  <img src={coreIcon} alt="코어 강화" />
                  <span>코어 강화</span>
                </div>
              </div>
            </div>
            <button className="arrow-button">〉</button>
          </div>

          {/* 런지 카드 (하체 + 코어) */}
          <div className="exercise-card lunge-theme">
            <div className="cat-section">
              <img src={lungeCat} className="cat-main-img" alt="런지 고양이" />
            </div>
            <div className="info-section">
              <h3>런지</h3>
              <p className="sub-desc">균형감 있는 하체를 만들어보세요!</p>
              <div className="icon-group">
                <div className="icon-item">
                  <img src={lowerIcon} alt="하체 강화" />
                  <span>하체 강화</span>
                </div>
                <div className="icon-item">
                  <img src={coreIcon} alt="코어 강화" />
                  <span>코어 강화</span>
                </div>
              </div>
            </div>
            <button className="arrow-button">〉</button>
          </div>
        </div>
        <Navbar />
      </div>
    </div>
  );
};

export default ExerciseSelect;

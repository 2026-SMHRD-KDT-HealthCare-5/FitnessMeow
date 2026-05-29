/**
 * BodyExpPanel.jsx — 부위별 경험치 패널
 *
 * 목차:
 *   1. 부위 정의    — PARTS 배열 (팔·가슴·코어·하체)
 *   2. 컴포넌트     — character prop 기반으로 경험치 바 렌더링
 *
 * 표시 로직:
 *   - 항상 펼침 상태로 렌더링 (내부 토글 없음)
 *   - 표시 여부는 MainLobby 헤더 💪 버튼(expPanelOpen)으로 제어
 *   - 각 부위 경험치가 max_exp 이상이면 "MAX" 표시
 *
 * Props:
 *   character — { arm_exp, chest_exp, core_exp, lower_exp, max_exp, ... }
 */

import React from 'react';
import armIcon   from '../assets/icons/arm.png';
import chestIcon from '../assets/icons/chest.png';
import coreIcon  from '../assets/icons/core.png';
import legIcon   from '../assets/icons/leg.png';
import '../css/BodyExpPanel.css';

// ══════════════════════════════════════
// 1. 부위 정의
//    PARTS: 표시할 신체 부위 목록
//      - key:      character 객체에서 경험치 값을 읽는 키
//      - label:    UI 표시 이름
//      - icon:     아이콘 이미지
//      - barColor: 경험치 바 색상
// ══════════════════════════════════════
const PARTS = [
  { key: 'arm_exp',   label: '팔 EXP',   icon: armIcon,   barColor: '#FF6B6B' },
  { key: 'chest_exp', label: '가슴 EXP', icon: chestIcon, barColor: '#FF9F40' },
  { key: 'core_exp',  label: '코어 EXP', icon: coreIcon,  barColor: '#FFD166' },
  { key: 'lower_exp', label: '하체 EXP', icon: legIcon,   barColor: '#73C8F5' },
];

// ══════════════════════════════════════
// 2. 컴포넌트
//    character 의 각 부위 경험치를 max_exp 로 나눠 퍼센트 바로 표시한다.
//    max_exp 가 없으면 기본값 30 사용.
//    경험치가 max_exp 이상이면 "MAX" 문자열을 표시한다.
// ══════════════════════════════════════
const BodyExpPanel = ({ character }) => {
  // max_exp 기본값: 30 (서버 미응답 시 UI 깨짐 방지)
  const maxExp = character?.max_exp ?? 30;

  return (
    <div className="body-exp-panel">
      <h3 className="body-exp-title">부위별 경험치</h3>

      {PARTS.map(({ key, label, icon, barColor }) => {
        // character 가 null 이면 0으로 처리
        const current = character?.[key] ?? 0;
        // 경험치 바 너비 퍼센트 (100% 초과 방지)
        const pct     = Math.min((current / maxExp) * 100, 100);
        const isMaxed = current >= maxExp;

        return (
          <div key={key} className="body-exp-row">
            {/* 부위 아이콘 */}
            <img src={icon} alt={label} className="body-exp-icon" />
            {/* 부위 이름 레이블 */}
            <span className="body-exp-label">{label}</span>
            {/* 경험치 진행 바 */}
            <div className="body-exp-track">
              <div
                className="body-exp-fill"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            {/* 경험치 수치 또는 MAX 표시 */}
            <span className="body-exp-value">
              {isMaxed ? 'MAX' : `${current}/${maxExp}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BodyExpPanel;

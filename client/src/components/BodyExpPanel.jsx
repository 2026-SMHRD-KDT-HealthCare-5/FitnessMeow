/**
 * BodyExpPanel.jsx — 부위별 경험치 패널
 *
 * 역할:
 *   - 팔 / 가슴 / 코어 / 하체 4개 부위의 경험치를 진행 바와 수치로 표시
 *   - 방 캔버스 우측 상단 오버레이로 사용됨 (반투명 배경)
 *
 * Props:
 *   character — 서버에서 받은 고양이 데이터
 *               필요 필드: arm_exp, chest_exp, core_exp, lower_exp, max_exp
 *
 * 경험치 계산:
 *   - 각 부위 exp / max_exp * 100 = 진행 바 퍼센트
 *   - max_exp 는 레벨별로 다름 (character.routes.js 의 CHARACTER_CONFIG 참고)
 *   - current >= max_exp 이면 "MAX" 표시
 */

import React from 'react';
import armIcon   from '../assets/icons/arm.png';   // 팔 아이콘
import chestIcon from '../assets/icons/chest.png'; // 가슴 아이콘
import coreIcon  from '../assets/icons/core.png';  // 코어 아이콘
import legIcon   from '../assets/icons/leg.png';   // 하체 아이콘
import '../css/BodyExpPanel.css';

// 표시할 부위 정의 목록
// key      — character 객체에서 읽을 필드명
// barColor — 진행 바 색상 (부위별로 다른 색으로 구분)
const PARTS = [
  { key: 'arm_exp',   label: '팔 EXP',   icon: armIcon,   barColor: '#FF6B6B' }, // 빨강
  { key: 'chest_exp', label: '가슴 EXP', icon: chestIcon, barColor: '#FF9F40' }, // 주황
  { key: 'core_exp',  label: '코어 EXP', icon: coreIcon,  barColor: '#FFD166' }, // 노랑
  { key: 'lower_exp', label: '하체 EXP', icon: legIcon,   barColor: '#73C8F5' }, // 파랑
];

const BodyExpPanel = ({ character }) => {
  // character 가 null 이면 max_exp 기본값 30 사용
  const maxExp = character?.max_exp ?? 30;

  return (
    <div className="body-exp-panel">
      <h3 className="body-exp-title">부위별 경험치</h3>

      {PARTS.map(({ key, label, icon, barColor }) => {
        const current = character?.[key] ?? 0;                    // 현재 경험치
        const pct     = Math.min((current / maxExp) * 100, 100); // 바 채움 비율 (최대 100%)
        const isMaxed = current >= maxExp;                         // 만렙 여부

        return (
          <div key={key} className="body-exp-row">
            {/* 부위 아이콘 */}
            <img src={icon} alt={label} className="body-exp-icon" />

            {/* 부위 이름 ("팔 EXP" 등) */}
            <span className="body-exp-label">{label}</span>

            {/* 경험치 진행 바 */}
            <div className="body-exp-track">
              <div
                className="body-exp-fill"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>

            {/* 수치 표시: 만렙이면 "MAX", 아니면 "현재/최대" */}
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

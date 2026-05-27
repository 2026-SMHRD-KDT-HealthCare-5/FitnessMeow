/**
 * BodyExpPanel.jsx — 부위별 경험치 패널 (토글형)
 *
 * - 최소화 상태: 💪 아이콘 버튼만 표시
 * - 펼침 상태  : 팔 / 가슴 / 코어 / 하체 EXP 바 표시
 * - 버튼 클릭으로 두 상태 전환
 */

import React, { useState } from 'react';
import armIcon   from '../assets/icons/arm.png';
import chestIcon from '../assets/icons/chest.png';
import coreIcon  from '../assets/icons/core.png';
import legIcon   from '../assets/icons/leg.png';
import '../css/BodyExpPanel.css';

const PARTS = [
  { key: 'arm_exp',   label: '팔 EXP',   icon: armIcon,   barColor: '#FF6B6B' },
  { key: 'chest_exp', label: '가슴 EXP', icon: chestIcon, barColor: '#FF9F40' },
  { key: 'core_exp',  label: '코어 EXP', icon: coreIcon,  barColor: '#FFD166' },
  { key: 'lower_exp', label: '하체 EXP', icon: legIcon,   barColor: '#73C8F5' },
];

const BodyExpPanel = ({ character }) => {
  const [open, setOpen] = useState(false); // false = 최소화, true = 펼침

  const maxExp = character?.max_exp ?? 30;

  return (
    <div className={`body-exp-panel ${open ? 'body-exp-panel--open' : 'body-exp-panel--mini'}`}>

      {/* 토글 버튼 — 항상 표시 */}
      <button className="body-exp-toggle" onClick={() => setOpen(prev => !prev)} title="부위별 경험치">
        💪
      </button>

      {/* 펼침 상태일 때만 표시 */}
      {open && (
        <div className="body-exp-content">
          <h3 className="body-exp-title">부위별 경험치</h3>

          {PARTS.map(({ key, label, icon, barColor }) => {
            const current = character?.[key] ?? 0;
            const pct     = Math.min((current / maxExp) * 100, 100);
            const isMaxed = current >= maxExp;

            return (
              <div key={key} className="body-exp-row">
                <img src={icon} alt={label} className="body-exp-icon" />
                <span className="body-exp-label">{label}</span>
                <div className="body-exp-track">
                  <div
                    className="body-exp-fill"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <span className="body-exp-value">
                  {isMaxed ? 'MAX' : `${current}/${maxExp}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default BodyExpPanel;

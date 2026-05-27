/**
 * CarePanel.jsx — 오늘의 할일 (일일 퀘스트)
 *
 * 각 돌봄 행동은 특정 운동 완료 시 자동으로 달성됨:
 *   밥 주기      → 스쿼트 15회
 *   빗질해주기   → 푸쉬업 10회
 *   화장실 청소  → 런지 15회
 *
 * 달성 조건 충족 시 서버(workout.routes.js)가 자동으로 care_logs 기록 + 코인 +50 지급.
 * 미달성 카드에서 "운동하러 가기" 클릭 시 /exerciseselect 로 이동.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import foodImg    from '../assets/cat_items/catfoodcontainer.png';
import brushImg   from '../assets/cat_items/scratcher.png';
import toiletImg  from '../assets/cat_items/toilet.png';
import '../css/CarePanel.css';

// 돌봄 행동 정의 — quest: 달성에 필요한 운동 정보
const CARE_ACTIONS = [
  {
    type: 'feed',  label: '밥 주기',     img: foodImg,
    doneKey: 'feed_done',
    quest: { exercise: 'squat',  reps: 15, label: '스쿼트 15회' },
  },
  {
    type: 'groom', label: '빗질해주기',  img: brushImg,
    doneKey: 'groom_done',
    quest: { exercise: 'pushup', reps: 10, label: '푸쉬업 10회' },
  },
  {
    type: 'clean', label: '화장실 청소', img: toiletImg,
    doneKey: 'clean_done',
    quest: { exercise: 'lunge',  reps: 15, label: '런지 15회' },
  },
];

const CarePanel = ({ todayStatus = {} }) => {
  const navigate = useNavigate();

  return (
    <div className="care-section">

      {/* 섹션 헤더 */}
      <div className="care-section-header">
        <span className="care-section-title">오늘의 할일</span>
        <span className="care-section-note">※ 매일 00시 초기화</span>
      </div>

      {/* 카드 그리드 */}
      <div className="care-cards">

        {CARE_ACTIONS.map(({ type, label, img, doneKey, quest }) => {
          const isDone = !!todayStatus[doneKey];

          return (
            <div key={type} className={`care-card ${isDone ? 'care-card--done' : ''}`}>
              <img src={img} alt={label} className="care-card-img" />
              <p className="care-card-title">{label}</p>
              <p className="care-card-quest">{quest.label}</p>
              <p className="care-card-reward">완료 시 코인 +50</p>
              <button
                className={`care-card-btn ${isDone ? 'done' : ''}`}
                onClick={() => { if (!isDone) navigate('/exerciseselect'); }}
                disabled={isDone}
              >
                {isDone ? '완료 ✓' : '운동하러 가기'}
              </button>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default CarePanel;

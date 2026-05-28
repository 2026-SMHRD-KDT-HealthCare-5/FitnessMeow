/**
 * QuestPanel.jsx — 오늘의 할일 (일일 퀘스트)
 *
 * 퀘스트 달성 조건:
 *   밥 주기      → 스쿼트 15회
 *   빗질해주기   → 푸쉬업 10회
 *   화장실 청소  → 런지 15회
 *
 * 달성 흐름:
 *   운동 완료(POST /api/workouts)
 *   → 서버 dailyQuest.cjs 에서 조건 자동 체크
 *   → 달성 시 care_logs INSERT + 코인 +50 지급
 *   → 다음 /api/auth/me 조회 시 today_status 반영
 *
 * UI 동작:
 *   isDone = true  → 초록 카드 + "완료 ✓" (버튼 비활성)
 *   isDone = false → 흰 카드  + "운동하러 가기" → /exerciseselect 이동
 *
 * Props:
 *   todayStatus — { feed_done, groom_done, clean_done }  (MainLobby에서 전달)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import foodImg    from '../assets/furniture/catfoodbowl.png';
import brushImg   from '../assets/icons/brush.png';
import toiletImg  from '../assets/furniture/cattoilet.png';
import '../css/QuestPanel.css';

// 퀘스트 행동 정의
const QUEST_ACTIONS = [
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

const QuestPanel = ({ todayStatus = {} }) => {
  const navigate = useNavigate();

  return (
    <div className="quest-section">

      {/* 섹션 헤더 */}
      <div className="quest-section-header">
        <span className="quest-section-title">오늘의 할일</span>
        <span className="quest-section-note">※ 매일 00시 초기화</span>
      </div>

      {/* 카드 그리드 */}
      <div className="quest-cards">

        {QUEST_ACTIONS.map(({ type, label, img, doneKey, quest }) => {
          const isDone = !!todayStatus[doneKey];

          return (
            <div key={type} className={`quest-card ${isDone ? 'quest-card--done' : ''}`}>
              <img src={img} alt={label} className="quest-card-img" />
              <p className="quest-card-title">{label}</p>
              <p className="quest-card-quest">{quest.label}</p>
              <p className="quest-card-reward">완료 시 코인 +50</p>
              <button
                className={`quest-card-btn ${isDone ? 'done' : ''}`}
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

export default QuestPanel;

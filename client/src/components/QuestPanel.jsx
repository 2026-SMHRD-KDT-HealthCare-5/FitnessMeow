/**
 * QuestPanel.jsx — 오늘의 할일 (일일 퀘스트) 패널
 *
 * 목차:
 *   1. 퀘스트 정의    — QUEST_ACTIONS 배열 (퀘스트 타입·조건·이미지)
 *   2. 컴포넌트       — todayStatus 기반 카드 그리드 렌더링
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

// ══════════════════════════════════════
// 1. 퀘스트 정의
//    QUEST_ACTIONS: 퀘스트 타입별 정보 배열
//      - type:    퀘스트 고유 식별자
//      - label:   카드에 표시할 행동 이름
//      - img:     카드 아이콘 이미지
//      - doneKey: todayStatus 객체에서 완료 여부를 읽는 키
//      - quest:   연결된 운동 정보 (exercise 타입, reps 목표, label 표시명)
// ══════════════════════════════════════

// 퀘스트 행동 정의
const QUEST_ACTIONS = [
  {
    type: 'feed',  label: '밥 주기',     img: foodImg,
    doneKey: 'feed_done',
    quest: { exercise: 'squat',  reps: 15, label: '스쿼트' },
  },
  {
    type: 'groom', label: '빗질해주기',  img: brushImg,
    doneKey: 'groom_done',
    quest: { exercise: 'pushup', reps: 10, label: '푸쉬업' },
  },
  {
    type: 'clean', label: '화장실 청소', img: toiletImg,
    doneKey: 'clean_done',
    quest: { exercise: 'lunge',  reps: 15, label: '런지' },
  },
];

// ══════════════════════════════════════
// 2. 컴포넌트
//    todayStatus 의 각 done 키를 읽어 완료/미완료 상태를 카드로 렌더링한다.
//    미완료 카드의 "운동하러 가기" 버튼 클릭 시 /exerciseselect 로 이동한다.
// ══════════════════════════════════════
const QuestPanel = ({ todayStatus = {}, todayReps = {} }) => {
  const navigate = useNavigate();

  return (
    <div className="quest-section">

      <div className="quest-section-header">
        <span className="quest-section-title">오늘의 할일</span>
        <span className="quest-section-note">※ 매일 00시 초기화</span>
      </div>

      <div className="quest-cards">
        {QUEST_ACTIONS.map(({ type, label, img, doneKey, quest }) => {
          const isDone    = !!todayStatus[doneKey];
          const current   = Math.min(todayReps[quest.exercise] ?? 0, quest.reps);
          const pct       = Math.round((current / quest.reps) * 100);

          return (
            <div key={type} className={`quest-card ${isDone ? 'quest-card--done' : ''}`}>
              <img src={img} alt={label} className="quest-card-img" />
              <p className="quest-card-title">{label}</p>

              {/* 누적 횟수 진행률 */}
              <p className="quest-card-quest">
                {quest.label}&nbsp;
                <span className="quest-card-progress">
                  {isDone ? `${quest.reps}/${quest.reps}` : `${current}/${quest.reps}`}
                </span>
              </p>

              {/* 진행바 */}
              {!isDone && (
                <div className="quest-progress-bar">
                  <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              )}

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

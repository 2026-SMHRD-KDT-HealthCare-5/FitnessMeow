/**
 * CarePanel.jsx — 오늘의 할일 (돌봄 행동) 섹션
 *
 * 역할:
 *   - 밥 주기 / 빗질해주기 / 화장실 청소 — 3가지 돌봄 행동 카드 표시
 *   - 각 행동: 돌봄포인트 1 소모 + 코인 +50 획득
 *   - 하루 1회만 가능 (매일 00:00 초기화) — 완료 시 "완료 ✓" 버튼으로 변경
 *   - 돌봄포인트 현재값 카드 (우측 고정 표시)
 *   - 완료·오류 토스트 메시지 표시
 *
 * Props:
 *   carePoints      — 현재 돌봄포인트 (버튼 활성화 여부 판단에 사용)
 *   setCarePoints   — 돌봄 완료 후 포인트 감소 반영
 *   onCoinsChange   — 돌봄 완료 후 코인 증가 반영
 *   todayStatus     — 오늘 각 행동의 완료 여부 { feed_done, groom_done, clean_done }
 *   setTodayStatus  — 돌봄 완료 시 done 플래그 업데이트
 *
 * API:
 *   POST /api/care/action { action_type: 'feed'|'groom'|'clean' }
 *   응답: { care_point, coins, coin_earned }
 */

import React, { useState } from 'react';
import axios from 'axios';
import foodImg    from '../assets/Toy/catfoodcontainer.png'; // 밥 주기 이미지
import brushImg   from '../assets/Toy/scratcher.png';        // 빗질해주기 이미지
import toiletImg  from '../assets/Toy/toilet.png';           // 화장실 청소 이미지
import '../css/CarePanel.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// 돌봄 행동 정의 목록
// type    — 서버 API에 전달할 action_type 값 (DB care_logs.care_type 과 일치해야 함)
// doneKey — todayStatus 객체의 키 이름
const CARE_ACTIONS = [
  { type: 'feed',  label: '밥 주기',     img: foodImg,   doneKey: 'feed_done'  },
  { type: 'groom', label: '빗질해주기',  img: brushImg,  doneKey: 'groom_done' },
  { type: 'clean', label: '화장실 청소', img: toiletImg, doneKey: 'clean_done' },
];

const CarePanel = ({ carePoints, setCarePoints, onCoinsChange, todayStatus = {}, setTodayStatus }) => {
  const [loading, setLoading] = useState(''); // 현재 로딩 중인 action_type ('feed'|'groom'|'clean'|'')
  const [toast,   setToast]   = useState(null); // 토스트 메시지 { msg, type }

  /** 토스트 메시지 표시 (2초 후 자동 사라짐) */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  /**
   * 돌봄 행동 실행
   * 1. 중복 클릭·이미 완료·포인트 부족 → 조기 리턴
   * 2. 서버 POST /api/care/action 호출
   * 3. 성공 시: todayStatus 업데이트, 코인·포인트 갱신, 코인 획득 토스트
   * 4. 실패 시: 서버 메시지 또는 기본 오류 토스트
   */
  const handleAction = async (action_type, doneKey) => {
    if (loading || todayStatus[doneKey]) return; // 로딩 중이거나 이미 완료

    if (carePoints < 1) {
      showToast('돌봄포인트가 부족합니다!', 'error');
      return;
    }

    setLoading(action_type);
    try {
      const res = await axios.post(
        `${API}/api/care/action`,
        { action_type },
        { withCredentials: true },
      );
      setTodayStatus?.(prev => ({ ...prev, [doneKey]: true })); // 완료 플래그 ON
      setCarePoints(res.data.care_point);                        // 감소된 포인트 반영
      onCoinsChange?.(res.data.coins);                           // 증가된 코인 반영
      showToast(`+${res.data.coin_earned} 코인 획득!`);
    } catch (err) {
      showToast(err.response?.data?.message ?? '오류가 발생했습니다.', 'error');
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="care-section">

      {/* 토스트 메시지 — 섹션 상단에 절대 위치로 표시 */}
      {toast && (
        <div className={`care-toast-global ${toast.type === 'error' ? 'err' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* 섹션 헤더: 제목 + 초기화 시간 안내 */}
      <div className="care-section-header">
        <span className="care-section-title">오늘의 할일 (돌봄 행동)</span>
        <span className="care-section-note">※ 매일 00시 초기화</span>
      </div>

      {/* 카드 그리드: 돌봄 행동 3개 + 돌봄포인트 표시 1개 */}
      <div className="care-cards">

        {/* 돌봄 행동 카드 3개 (밥주기·빗질·화장실) */}
        {CARE_ACTIONS.map(({ type, label, img, doneKey }) => {
          const isDone    = !!todayStatus[doneKey];          // 오늘 완료 여부
          const canAct    = !isDone && carePoints >= 1 && !loading; // 버튼 활성화 조건
          const isLoading = loading === type;                // 이 카드가 로딩 중인지

          return (
            <div key={type} className={`care-card ${isDone ? 'care-card--done' : ''}`}>
              <img src={img} alt={label} className="care-card-img" />
              <p className="care-card-title">{label}</p>
              <p className="care-card-cost">돌봄포인트 1 소모</p>
              <p className="care-card-reward">코인 +50</p>
              <button
                className={`care-card-btn ${isDone ? 'done' : ''} ${!canAct && !isDone ? 'disabled' : ''}`}
                onClick={() => handleAction(type, doneKey)}
                disabled={!canAct || isLoading}
              >
                {/* 버튼 텍스트: 완료됨 → "완료 ✓" / 로딩 중 → "..." / 기본 → "하기" */}
                {isDone ? '완료 ✓' : isLoading ? '...' : '하기'}
              </button>
            </div>
          );
        })}

        {/* 돌봄포인트 표시 카드 (우측 고정, + 버튼 없음) */}
        <div className="care-point-card">
          <span className="care-point-icon">🐾</span>
          <p className="care-point-label">돌봄포인트</p>
          <p className="care-point-value">{carePoints}</p>
          <p className="care-point-note">(운동 1세트 완료 시 +1)</p>
        </div>
      </div>
    </div>
  );
};

export default CarePanel;

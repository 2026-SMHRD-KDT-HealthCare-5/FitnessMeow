/**
 * TestCoinButton.jsx — 개발용 코인·돌봄포인트·경험치 즉시 증가 버튼
 *
 * ⚠️  경고: 이 컴포넌트는 개발 편의를 위한 임시 UI 입니다.
 *          배포(프로덕션) 시 MainLobby.jsx 에서 반드시 제거해야 합니다.
 *          서버의 /api/test/* 라우트도 함께 비활성화해야 합니다.
 *
 * 역할:
 *   화면 우하단에 세 개의 원형 버튼을 고정 위치(fixed)로 표시
 *   🐾 버튼: POST /api/test/add-care-points → 돌봄포인트 즉시 증가
 *   ✨ 버튼: POST /api/test/add-exp         → 경험치 즉시 증가 (레벨업 자동 처리)
 *   🪙 버튼: POST /api/test/add-coins       → 코인 즉시 증가
 *
 * Props:
 *   onCoinsChange      — (newCoins: number) => void       코인 상태 갱신 콜백
 *   onCarePointsChange — (newCarePoints: number) => void  돌봄포인트 상태 갱신 콜백
 *   onExpChange        — (character: object) => void      캐릭터 전체 상태 갱신 콜백
 *                        (경험치·레벨이 모두 바뀔 수 있으므로 character 객체 통째로 전달)
 *   coinAmount         — 한 번에 증가할 코인 (기본: 500)
 *   careAmount         — 한 번에 증가할 돌봄포인트 (기본: 5)
 *   expAmount          — 한 번에 증가할 경험치 (기본: 5, 서버 최대: 99)
 */

import React, { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const TestCoinButton = ({
  onCoinsChange,
  onCarePointsChange,
  onExpChange,
  coinAmount = 500,
  careAmount = 5,
  expAmount  = 5,
}) => {
  // 현재 API 호출 중인 버튼 식별자 ('coin' | 'care' | 'exp' | '')
  const [loading, setLoading] = useState('');
  const [toast,   setToast]   = useState(null); // { msg, type: 'ok'|'err' }

  /** 토스트 표시 후 2.2초 뒤 자동 숨김 */
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  // ── 🪙 코인 증가 ─────────────────────────────────────────────────────────
  const handleCoin = async () => {
    if (loading) return;
    setLoading('coin');
    try {
      const res = await axios.post(
        `${API}/api/test/add-coins`,
        { amount: coinAmount },
        { withCredentials: true },
      );
      onCoinsChange?.(res.data.coins);
      showToast(`🪙 +${coinAmount} 코인! (잔액: ${res.data.coins})`);
    } catch (err) {
      showToast(err.response?.data?.message ?? '오류 발생', 'err');
    } finally {
      setLoading('');
    }
  };

  // ── 🐾 돌봄포인트 증가 ────────────────────────────────────────────────────
  const handleCare = async () => {
    if (loading) return;
    setLoading('care');
    try {
      const res = await axios.post(
        `${API}/api/test/add-care-points`,
        { amount: careAmount },
        { withCredentials: true },
      );
      onCarePointsChange?.(res.data.care_point);
      showToast(`🐾 +${careAmount} 돌봄포인트! (잔액: ${res.data.care_point})`);
    } catch (err) {
      showToast(err.response?.data?.message ?? '오류 발생', 'err');
    } finally {
      setLoading('');
    }
  };

  // ── ✨ 경험치 증가 ─────────────────────────────────────────────────────────
  // 서버가 레벨업 여부를 함께 반환 → 레벨업이면 토스트 메시지 다르게 표시
  const handleExp = async () => {
    if (loading) return;
    setLoading('exp');
    try {
      const res = await axios.post(
        `${API}/api/test/add-exp`,
        { amount: expAmount },
        { withCredentials: true },
      );
      // character 전체 객체를 부모(MainLobby)에게 전달해 character 상태 즉시 갱신
      onExpChange?.(res.data.character);

      if (res.data.leveled_up) {
        showToast(`🎉 레벨 업! Lv.${res.data.character.level} 달성!`);
      } else {
        const avg = (
          (res.data.character.arm_exp   ?? 0) +
          (res.data.character.chest_exp ?? 0) +
          (res.data.character.core_exp  ?? 0) +
          (res.data.character.lower_exp ?? 0)
        ) / 4;
        showToast(`✨ +${expAmount} 경험치! (평균: ${Math.round(avg)}/${res.data.character.max_exp})`);
      }
    } catch (err) {
      showToast(err.response?.data?.message ?? '오류 발생', 'err');
    } finally {
      setLoading('');
    }
  };

  // 버튼 공통 인라인 스타일
  const btnBase = {
    width:          '52px',
    height:         '52px',
    borderRadius:   '50%',
    border:         'none',
    cursor:         loading ? 'not-allowed' : 'pointer',
    fontSize:       '22px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    transition:     'transform 0.15s, opacity 0.15s',
    opacity:        loading ? 0.6 : 1,
  };

  return (
    <>
      {/* 버튼 묶음 — 우하단 고정 (Navbar 위: bottom: 80px) */}
      <div style={{
        position:     'fixed',
        bottom:       '270px',
        left:         '16px',
        zIndex:        9999,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '10px',
      }}>

        {/* ✨ 경험치 버튼 */}
        <button
          onClick={handleExp}
          disabled={!!loading}
          title={`경험치 +${expAmount} (개발용)`}
          style={{
            ...btnBase,
            background: loading === 'exp' ? '#ccc' : 'linear-gradient(135deg,#34d399,#059669)',
            boxShadow:  '0 4px 14px rgba(5,150,105,0.4)',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {loading === 'exp' ? '⏳' : '✨'}
        </button>

        {/* 🪙 코인 버튼 */}
        <button
          onClick={handleCoin}
          disabled={!!loading}
          title={`코인 +${coinAmount} (개발용)`}
          style={{
            ...btnBase,
            background: loading === 'coin' ? '#ccc' : 'linear-gradient(135deg,#ffd700,#ff9f00)',
            boxShadow:  '0 4px 14px rgba(255,160,0,0.4)',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {loading === 'coin' ? '⏳' : '🪙'}
        </button>
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <div style={{
          position:     'fixed',
          bottom:       '250px',
          right:        '16px',
          zIndex:       9999,
          background:   toast.type === 'err' ? '#ff3b30' : '#2b2b2b',
          color:        '#fff',
          fontSize:     '12px',
          fontWeight:   '700',
          padding:      '8px 14px',
          borderRadius: '20px',
          whiteSpace:   'nowrap',
          boxShadow:    '0 4px 12px rgba(0,0,0,0.2)',
          animation:    'fadeInUp 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </>
  );
};

export default TestCoinButton;

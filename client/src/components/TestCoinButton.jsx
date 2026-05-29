/**
 * TestCoinButton.jsx — 개발용 코인·돌봄포인트·경험치 즉시 증가 버튼
 *
 * 목차:
 *   1. API 설정 및 상태   — API URL, loading·toast 상태
 *   2. handleCoin        — 코인 즉시 증가 API 호출
 *   3. handleExp         — 경험치 즉시 증가 API 호출 (레벨업 처리 포함)
 *   4. 렌더링             — 고정 위치 버튼 2개 + 토스트 알림
 *
 * ⚠️  경고: 이 컴포넌트는 개발 편의를 위한 임시 UI 입니다.
 *          배포(프로덕션) 시 MainLobby.jsx 에서 반드시 제거해야 합니다.
 *          서버의 /api/test/* 라우트도 함께 비활성화해야 합니다.
 *
 * Props:
 *   onCoinsChange — (newCoins: number) => void       코인 상태 갱신 콜백
 *   onExpChange   — (character: object) => void      캐릭터 전체 상태 갱신 콜백
 *                   (경험치·레벨이 모두 바뀔 수 있으므로 character 객체 통째로 전달)
 *   coinAmount    — 한 번에 증가할 코인 (기본: 500)
 *   expAmount     — 한 번에 증가할 경험치 (기본: 5, 서버 최대: 99)
 */

import React, { useState } from 'react';
import axios from 'axios';

// ══════════════════════════════════════
// 1. API 설정 및 상태
//    API: VITE_API_URL 환경변수 우선, 없으면 localhost:3001 폴백
//    loading: 현재 호출 중인 버튼 식별자 ('coin' | 'care' | 'exp' | '')
//    toast:   성공/오류 피드백 메시지 { msg, type: 'ok'|'err' }
// ══════════════════════════════════════

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const TestCoinButton = ({
  onCoinsChange,
  onExpChange,
  coinAmount = 500,
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

  // ══════════════════════════════════════
  // 2. handleCoin — 코인 즉시 증가
  //    POST /api/test/add-coins → 응답의 coins 값으로 부모 상태 갱신
  // ══════════════════════════════════════
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

  // ══════════════════════════════════════
  // 3. handleExp — 경험치 즉시 증가 (레벨업 처리 포함)
  //    POST /api/test/add-exp → 응답의 leveled_up 여부에 따라 토스트 메시지 분기
  //    서버가 레벨업 여부를 함께 반환 → 레벨업이면 토스트 메시지 다르게 표시
  // ══════════════════════════════════════
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
        // 레벨업 달성 시 레벨 표시
        showToast(`🎉 레벨 업! Lv.${res.data.character.level} 달성!`);
      } else {
        // 레벨업 없을 때: 4개 부위 경험치 평균으로 현황 표시
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

  // ══════════════════════════════════════
  // 4. 렌더링
  //    버튼 묶음: 화면 좌하단 고정 (Navbar 위: bottom 270px)
  //    버튼 공통 인라인 스타일 (btnBase) 적용
  //    토스트: 화면 우하단 고정, 성공(#2b2b2b) / 오류(#ff3b30) 배경색 구분
  // ══════════════════════════════════════

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
      {/* 버튼 묶음 — 좌하단 고정 (Navbar 위: bottom: 270px) */}
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

      {/* 토스트 알림 — 성공/오류에 따라 배경색 다르게 적용 */}
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

      {/* fadeInUp 애니메이션 키프레임 정의 */}
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

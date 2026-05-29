/**
 * ToastMessage.jsx — 일시적 알림 토스트 컴포넌트
 *
 * 목차:
 *   1. 자동 닫기 효과   — toast 표시 후 3초 뒤 onClose 호출
 *   2. 렌더링          — toast 타입별 CSS 클래스 적용
 */

import React, { useEffect } from 'react';
import '../css/Toast.css';

// ══════════════════════════════════════
// 1. 자동 닫기 효과
//    toast 가 변경될 때마다 3000ms 타이머를 설정하고, 언마운트 또는 toast 변경 시 타이머를 정리한다.
//
//    Props:
//      toast   — { type: 'success'|'error'|..., message: string } | null
//      onClose — () => void  타이머 만료 또는 외부에서 닫을 때 호출
// ══════════════════════════════════════
const ToastMessage = ({ toast, onClose }) => {
  // toast 값이 바뀔 때마다 3초 자동 닫기 타이머 등록
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => onClose(), 3000);
    // 컴포넌트 언마운트 또는 toast 재변경 시 이전 타이머 정리
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  // ══════════════════════════════════════
  // 2. 렌더링
  //    toast 가 null 이면 아무것도 렌더링하지 않음.
  //    toast.type 으로 CSS 클래스를 결정해 성공/오류 등 시각적 구분.
  // ══════════════════════════════════════

  // toast 없으면 렌더링 생략
  if (!toast) return null;

  return (
    // toast-success / toast-error 등 타입별 스타일 적용
    <div className={`toast toast-${toast.type}`}>
      {toast.message}
    </div>
  );
};

export default ToastMessage;

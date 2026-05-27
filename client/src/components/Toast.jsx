import React, { useEffect, useState } from 'react';
import '../css/Toast.css';

/**
 * 토스트 알림 컴포넌트
 * @param {string}  message  - 표시할 메시지
 * @param {number}  duration - 표시 시간 (ms), 기본 3000
 * @param {string}  type     - 'error' | 'success' | 'info'
 */
const Toast = ({ message, duration = 3000, type = 'error' }) => {
  const [visible, setVisible] = useState(true);

  // duration 이후 자동으로 사라짐
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  // 평소에는 -> null 로 비표시
  if (!visible || !message) return null;

  return (
    <div className={`toast toast--${type}`}>
      {message}
    </div>
  );
};

export default Toast;
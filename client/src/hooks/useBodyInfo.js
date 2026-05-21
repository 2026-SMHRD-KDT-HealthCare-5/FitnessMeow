// src/hooks/useBodyInfo.js
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function useBodyInfo() {
  const [bodyInfo, setBodyInfo] = useState({ weightKg: '', heightCm: '' });

  useEffect(() => {
    // AbortController로 컴포넌트 언마운트 시 요청 취소 (보안/메모리 누수 방지)
    const controller = new AbortController();

    fetch(`${API_URL}/api/auth/me`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        setBodyInfo({ weightKg: parseFloat(data.data.weight), heightCm: parseFloat(data.data.height) });
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return bodyInfo;
}
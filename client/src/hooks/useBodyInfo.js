/**
 * useBodyInfo.js — 사용자 신체 정보 커스텀 훅
 *
 * 목차:
 *   1. 상태 초기화   — bodyInfo 상태 (weightKg, heightCm)
 *   2. 데이터 fetch  — 마운트 시 /api/auth/me 에서 신체 정보 로드
 *
 * 반환값:
 *   bodyInfo — { weightKg: number, heightCm: number }
 *              (아직 로드 중이면 '' 빈 문자열, 로드 후 float 숫자)
 *
 * 사용처:
 *   칼로리 계산이 필요한 운동 화면 (ExerciseSession.jsx 등)
 */

import { useState, useEffect } from 'react';

// 환경변수 VITE_API_URL 우선 사용, 없으면 localhost:3001 폴백
const API_URL = import.meta.env.VITE_API_URL ?? '';

// ══════════════════════════════════════
// 1. 상태 초기화
//    weightKg, heightCm 를 빈 문자열로 초기화한다.
//    fetch 완료 후 parseFloat 으로 숫자 변환하여 저장한다.
// ══════════════════════════════════════

// ══════════════════════════════════════
// 2. 데이터 fetch
//    마운트 시 GET /api/auth/me 를 호출해 사용자 weight·height 를 가져온다.
//    AbortController 로 컴포넌트 언마운트 시 진행 중인 요청을 취소해
//    메모리 누수 및 setState-after-unmount 경고를 방지한다.
// ══════════════════════════════════════
export function useBodyInfo() {
  // 초기값: 빈 문자열 (로딩 중 상태를 표현)
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
        // 응답 실패 또는 로그인 필요 시 상태 유지
        if (!data.success) return;
        // weight, height 를 float 으로 파싱 후 상태에 저장
        setBodyInfo({ weightKg: parseFloat(data.data.weight), heightCm: parseFloat(data.data.height) });
      })
      .catch(() => {}); // AbortError 포함 모든 오류 무시

    // 컴포넌트 언마운트 시 진행 중인 fetch 취소
    return () => controller.abort();
  }, []);

  return bodyInfo;
}

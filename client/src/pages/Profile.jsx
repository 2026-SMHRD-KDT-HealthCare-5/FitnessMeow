/**
 * Profile.jsx — 최근 운동 기록 페이지
 *
 * 목차:
 *   1. 상수 및 임포트   — API URL 설정, 운동 종목 한글 변환 맵
 *   2. 상태 선언        — 운동 기록·로딩·에러 상태
 *   3. 데이터 로드      — 마운트 시 GET /api/result 로 최근 운동 기록 1건 조회
 *   4. 렌더             — 로딩/에러 처리 → 운동 기록 테이블 표시
 *
 * API 연동:
 *   GET /api/result — 최근 운동 기록 1건 { exercise_key, sets, reps, total_score, calories }
 *
 * 비고:
 *   - 현재는 최근 1건만 표시하는 단순 테이블 구조
 *   - 히스토리 목록 등 확장 시 workout을 배열로 변경 필요
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import "../App.css";

// ══════════════════════════════════════
// 1. 상수 및 임포트
//    API URL 및 운동 종목 한글 변환 맵 정의
// ══════════════════════════════════════

// 서버 주소: .env 에 VITE_API_URL 이 있으면 사용, 없으면 로컬 3001포트
const API = '';

// 운동 종목 키 → 한글 이름 변환 맵
const EXERCISE_LABEL = {
  squat:  '스쿼트',
  pushup: '푸쉬업',
  lunge:  '런지',
};

const Profile = () => {
  // ══════════════════════════════════════
  // 2. 상태 선언
  //    운동 기록 단건, 로딩 여부, 에러 메시지
  // ══════════════════════════════════════

  const [workout,  setWorkout]  = useState(null);  // 최근 운동 기록 (단건)
  const [loading,  setLoading]  = useState(true);  // 로딩 상태
  const [error,    setError]    = useState(null);   // 에러 메시지

  // ══════════════════════════════════════
  // 3. 데이터 로드
  //    마운트 시 최근 운동 기록 1건 조회
  // ══════════════════════════════════════

  // 마운트 시 최근 운동 기록 1건 조회
  useEffect(() => {
    axios
      .get(`${API}/api/result`, { withCredentials: true })
      .then((res) => {
        setWorkout(res.data.workout ?? null); // workout 필드만 사용
        setLoading(false);
      })
      .catch(() => {
        setError("운동 기록을 불러오지 못했어요 😿");
        setLoading(false);
      });
  }, []);

  // ══════════════════════════════════════
  // 4. 렌더
  //    로딩 → 에러 → 운동 기록 테이블 순으로 조건부 렌더
  // ══════════════════════════════════════
  return (
    <div className="app-layout">
      <div className="main-content">

        <h2 style={{ padding: "20px" }}>최근 운동 기록</h2>

        {/* 로딩 중 */}
        {loading && <p style={{ padding: "20px" }}>불러오는 중...</p>}

        {/* 에러 발생 */}
        {error && <p style={{ padding: "20px", color: "tomato" }}>{error}</p>}

        {/* 데이터 표시 */}
        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse", padding: "20px" }}>
            <thead>
              <tr>
                <th>종목</th>
                <th>세트</th>
                <th>반복</th>
                <th>점수</th>
                <th>칼로리</th>
              </tr>
            </thead>
            <tbody>
              {!workout ? (
                // 운동 기록이 없는 경우
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                    운동 기록이 없어요 😿
                  </td>
                </tr>
              ) : (
                // 최근 운동 기록 1건 표시
                <tr>
                  <td>{EXERCISE_LABEL[workout.exercise_key] ?? workout.exercise_key}</td>
                  <td>{workout.sets}</td>
                  <td>{workout.reps}</td>
                  <td>{workout.total_score}</td>
                  <td>{workout.calories}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

      </div>

      <Navbar />
    </div>
  );
};

export default Profile;

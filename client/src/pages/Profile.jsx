import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";
import "../App.css";

// 서버 주소: .env 에 VITE_API_URL 이 있으면 사용, 없으면 로컬 3001포트
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// 운동 종목 키 → 한글 이름 변환 맵
const EXERCISE_LABEL = {
  squat:  '스쿼트',
  pushup: '푸쉬업',
  lunge:  '런지',
};

const Profile = () => {
  const [workout,  setWorkout]  = useState(null);  // 최근 운동 기록 (단건)
  const [loading,  setLoading]  = useState(true);  // 로딩 상태
  const [error,    setError]    = useState(null);   // 에러 메시지

  // 마운트 시 최근 운동 기록 1건 조회
  useEffect(() => {
    axios
      .get(`${API_URL}/api/result`, { withCredentials: true })
      .then((res) => {
        setWorkout(res.data.workout ?? null); // workout 필드만 사용
        setLoading(false);
      })
      .catch(() => {
        setError("운동 기록을 불러오지 못했어요 😿");
        setLoading(false);
      });
  }, []);

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

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import "../App.css";

const Profile = () => {
  const [currentTab, setCurrentTab] = useState("info");
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getWorkouts()
      .then((res) => {
        console.log(res.data); // 데이터 확인용 (나중에 지워도 됨)
        setWorkouts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("운동 기록을 불러오지 못했어요 😿");
        setLoading(false);
      });
  }, []);

  return (
    <div className="app-layout">
      <div className="main-content">

        <h2 style={{ padding: "20px" }}>내 운동 기록</h2>

        {loading && <p style={{ padding: "20px" }}>불러오는 중...</p>}
        {error   && <p style={{ padding: "20px" }}>{error}</p>}

        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse", padding: "20px" }}>
            <thead>
              <tr>
                <th>종목</th>
                <th>세트</th>
                <th>반복</th>
                <th>점수</th>
                <th>칼로리</th>
                <th>날짜</th>
              </tr>
            </thead>
            <tbody>
              {workouts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                    운동 기록이 없어요 😿
                  </td>
                </tr>
              ) : (
                workouts.map((w) => (
                  <tr key={w.workout_idx}>
                    <td>{w.exercise_key}</td>
                    <td>{w.sets}</td>
                    <td>{w.reps}</td>
                    <td>{w.total_score}</td>
                    <td>{w.calories}</td>
                    <td>{w.performed_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

      </div>

      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
};

export default Profile;
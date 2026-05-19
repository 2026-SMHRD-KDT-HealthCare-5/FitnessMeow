import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import { getCollection } from "../services/characterService.js";
import "../App.css";

const Collection = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCollection()
      .then((res) => {
        console.log(res.data);
        setCharacters(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("도감을 불러오지 못했어요 😿");
        setLoading(false);
      });
  }, []);

  return (
    <div className="app-layout">
      <div className="main-content" style={{ padding: "20px" }}>

        <h2>동물 도감 📖</h2>
        <p style={{ color: "gray", fontSize: "14px", marginBottom: "20px" }}>
          운동해서 새로운 친구를 해금해보세요!
        </p>

        {loading && <p>불러오는 중...</p>}
        {error   && <p>{error}</p>}

        {!loading && !error && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}>
            {characters.map((c) => (
              <div
                key={c.character_idx}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                  backgroundColor: c.is_unlocked ? "#fff" : "#f0f0f0",
                  opacity: c.is_unlocked ? 1 : 0.5,
                }}
              >
                {/* 해금 여부에 따라 이미지 or 물음표 */}
                <div style={{ fontSize: "48px", marginBottom: "8px" }}>
                  {c.is_unlocked ? "🐱" : "❓"}
                </div>

                <p style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {c.is_unlocked ? c.animal_type : "???"}
                </p>

                <p style={{ fontSize: "12px", color: "gray" }}>
                  {c.is_unlocked ? `Lv. ${c.level}` : "미해금"}
                </p>
              </div>
            ))}

            {characters.length === 0 && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center" }}>
                아직 캐릭터가 없어요 😿
              </p>
            )}
          </div>
        )}

      </div>

      <Navbar />
    </div>
  );
};

export default Collection;
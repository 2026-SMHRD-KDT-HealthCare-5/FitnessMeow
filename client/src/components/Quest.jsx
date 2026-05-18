import React, { useState, useEffect } from "react";

const Quest = () => {
  const [squatCount, setSquatCount] = useState(0);
  const [quests, setQuests] = useState([
    { id: 1, text: "스쿼트 10회 달성", target: 10, completed: false },
    { id: 2, text: "푸쉬업 10회 달성", target: 10, completed: false },
    { id: 3, text: "런지 10회 달성", target: 10, completed: false },
  ]);

  // 스쿼트 카운트 감시용 트리거
  useEffect(() => {
    if (squatCount >= 10) {
      setQuests((prev) =>
        prev.map((q) => (q.id === 1 ? { ...q, completed: true } : q))
      );
    }
  }, [squatCount]);

  return (
    <div className="transparent-quest-overlay">
      <h3 className="quest-title">일간 퀘스트</h3>
      <div className="text-quest-list">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`text-quest-item ${quest.completed ? "completed" : ""}`}
          >
            {quest.completed ? "■ " : "□ "}
            {quest.text}
            {quest.id === 1 && ` (${squatCount}/${quest.target})`}
          </div>
        ))}
      </div>

      {/* 개발자용 임시 버튼 */}
      <div className="test-btn-box">
        <button onClick={() => setSquatCount((prev) => prev + 2)}>
          🏋️ 스쿼트 +2회 테스트
        </button>
      </div>
    </div>
  );
};

export default Quest;
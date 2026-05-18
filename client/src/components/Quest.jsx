import React, { useState, useEffect } from "react";

const Quest = ({ onReward }) => {
  const [squatCount, setSquatCount] = useState(0);
  const [quests, setQuests] = useState([
    { id: 1, text: "스쿼트 10회 달성", target: 10, completed: false },
    { id: 2, text: "푸쉬업 10회 달성", target: 10, completed: false },
    { id: 3, text: "런지 10회 달성", target: 10, completed: false },
  ]);

  // 스쿼트 카운트 감시용 트리거
  useEffect(() => {
    if (squatCount >= 10) {
      // 이미 완료된 퀘스트라면 중복 실행 방지
      const isAlreadyCompleted = quests.find(q => q.id === 1)?.completed;
      if (isAlreadyCompleted) return;

      // 1. 퀘스트 완료 상태로 변경
      setQuests((prev) =>
        prev.map((q) => (q.id === 1 ? { ...q, completed: true } : q))
      );

      // 2. 🎉 화면에 퀘스트 완료창(알림 팝업) 띄우기!
      alert("🎉 퀘스트 완료! 스쿼트 10회를 달성하여 🍊 츄르 100개를 획득했습니다!");

      // 3. 💰 부모(MyRoom)에게 돈 올려달라고 신호 쏘기 (100원 보상)
      if (onReward) {
        onReward(100);
      }
    }
  }, [squatCount, quests, onReward]);

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
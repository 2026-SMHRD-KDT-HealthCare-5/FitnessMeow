/**
 * UserCoin.jsx — 사용자 보유 코인 표시 컴포넌트
 *
 * 목차:
 *   1. 컴포넌트   — 코인 아이콘 + 잔액 숫자 렌더링
 */

import React from "react";
import coinImg from "../assets/coin.png";

// ══════════════════════════════════════
// 1. 컴포넌트
//    코인 아이콘 이미지와 보유 코인 수량을 가로로 배치한다.
//    coins 가 number 타입이면 toLocaleString() 으로 천 단위 구분 표시,
//    그 외(string 등)는 그대로 출력한다.
//
//    Props:
//      coins — number | string  현재 보유 코인 수
// ══════════════════════════════════════
const UserCoin = ({ coins }) => {
  return (
    <div className="user-coin">
      {/* 코인 아이콘 */}
      <img src={coinImg} alt="coin" />
      {/* 코인 수량 — number이면 천 단위 쉼표 포맷 */}
      <span>{typeof coins === 'number' ? coins.toLocaleString() : coins}</span>
    </div>
  );
};

export default UserCoin;

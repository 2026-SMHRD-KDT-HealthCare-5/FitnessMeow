import React from "react";
import coinImg from "../assets/coin.png";

const UserCoin = ({ coins }) => {
  return (
    <div className="currency-box">
      <img
        src={coinImg}
        alt="coin"
        className="currency-img"
      />

      <span className="currency-label">
        츄르코인
      </span>

      <span className="currency-amount">
        {coins.toLocaleString()}
      </span>
    </div>
  );
};

export default UserCoin;
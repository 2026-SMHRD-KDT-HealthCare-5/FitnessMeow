import React from "react";
import coinImg from "../assets/coin.png";

const UserCoin = ({ coins }) => {
  return (
    <div className="user-coin">
      <img src={coinImg} alt="coin" />
      <span>{typeof coins === 'number' ? coins.toLocaleString() : coins}</span>
    </div>
  );
};

export default UserCoin;

import React from "react";
import MyRoom from "../components/MyRoom.jsx";
import Navbar from "../components/Navbar.jsx";
import "../App.css";

const MainLobby = () => {
  return (
    <div className="app-layout">
      <div className="main-content">
        <MyRoom />
      </div>
      <Navbar />
    </div>
  );
};

export default MainLobby;
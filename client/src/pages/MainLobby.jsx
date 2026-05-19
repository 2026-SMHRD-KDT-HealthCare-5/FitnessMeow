import React, { useState } from "react";
import MyRoom from "../components/MyRoom.jsx";
import ExerciseSelect from "./ExerciseSelect.jsx";
//import Shop from "./Shop.jsx";           // 주석 해제 시 필요
///import Collection from "./Collection.jsx";
//import MyInfo from "./MyInfo.jsx";
import Navbar from "../components/Navbar.jsx";
import "../App.css";

const MainLobby = () => {
  const [currentTab, setCurrentTab] = useState("home");

  return (
    <div className="app-layout">
      <div className="main-content">
        {currentTab === "home"       && <MyRoom />}
        {currentTab === "exercise"   && <ExerciseSelect />}
        {/*currentTab === "shop"       && <Shop />*/}
        {/*currentTab === "collection" && <Collection />*/}
        {/*currentTab === "info"       && <MyInfo />*/}
      </div>

      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
};

export default MainLobby;
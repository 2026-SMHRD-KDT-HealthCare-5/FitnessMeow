import React, { useState } from "react";
import MyRoom from "../components/MyRoom.jsx";
import ExerciseSelect from "./ExerciseSelect.jsx";
//import Shop from "./Shop.jsx";           // 주석 해제 시 필요
///import Collection from "./Collection.jsx";
//import MyInfo from "./MyInfo.jsx";
import Navbar from "../components/Navbar.jsx";
import "../App.css";

const MainLobby = () => {
  const [currentTab, setCurrentTab] = useState("mainlobby");

  return (
    <div className="app-layout">
      <div className="main-content">
        
        {/* ⭐️ 홈("home")이거나 꾸미기("shop") 일 때 마이룸을 보여줍니다. */}
        {/* 이제 Shop 컴포넌트는 MyRoom 내부에서 아름답게 띄워줄 겁니다. */}
        {(currentTab === "home" || currentTab === "shop") && (
          <MyRoom currentTab={currentTab} />
        )}
        

      {/* 📱 2. 하단 고정 네비게이션 바 */}
        {currentTab === "mainlobby"       && <MyRoom />}
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
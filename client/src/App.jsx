import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom' 

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MainLobby from './pages/MainLobby.jsx'
import ExerciseSelect from './pages/ExerciseSelect.jsx'
import Result from './pages/Result.jsx'
import ExerciseSetting from './pages/ExerciseSetting.jsx'
import Profile from './pages/Profile.jsx'
import Collection from './pages/Collection.jsx'
import Shop from "./pages/Shop.jsx";
import Info from "./pages/Info.jsx";

function App() {
  return (

      <Routes>
        {/* 1. 처음 들어오면 로그인 페이지로 이동 */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* 2. 로그인 및 회원가입 페이지 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 3. 메인 로비 홈 화면 */}
        <Route path="/mainlobby" element={<MainLobby />} />
        
        {/* 4. 운동 선택 및 설정 화면 */}
        <Route path="/exerciseselect" element={<ExerciseSetting page="select" />} />
        <Route path="/exercisesetting" element={<ExerciseSetting page="setting" />} />
        <Route path="/exercise" element={<ExerciseSetting page="exercise" />} />
        <Route path="/result" element={<Result />} />

        {/* 5. 프로필 */}
        <Route path="/profile" element={<Profile />} />

        {/* 6. 도감 */}
        <Route path="/collection" element={<Collection />} />

        
        {/* 7. 상점 */}
        <Route path="/shop" element={<Shop />} />

        {/* 8. 내 정보 */}
        <Route path="/info" element={<Info />} />
      </Routes>

  )
}

export default App

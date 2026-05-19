import ExerciseSetting from './pages/ExerciseSetting.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom' // 💡 여기에 있던 BrowserRouter 지우기!
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MainLobby from './pages/MainLobby.jsx'
import ExerciseSelect from './pages/ExerciseSelect.jsx'
import { Routes, Route, Navigate } from 'react-router-dom';
import Result from './pages/Result.jsx'

function App() {
  return (
    <Routes>
      {/* 1. 처음 들어오면 로그인 페이지로 이동 */}
      <Route path="/" element={<Navigate to="/login" />} />
      
      {/* 2. 로그인 및 회원가입 페이지 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/exerciseselect" element={<ExerciseSetting page="select" />} />
      <Route path="/exercisesetting" element={<ExerciseSetting page="setting" />} />
      <Route path="/exercise" element={<ExerciseSetting page="exercise" />} />
      
      {/* 3. 메인 로비 홈 화면 */}
      <Route path="/mainlobby" element={<MainLobby />} />
      
      {/* 4. 운동 선택 화면 개별 주소 */}
      <Route path="/exerciseselect" element={<ExerciseSelect />} />
    </Routes>
  )
}

export default App
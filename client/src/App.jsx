import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MainLobby from './pages/MainLobby.jsx'
import ExerciseSelect from './pages/ExerciseSelect.jsx'

function App() {
  return (
    <BrowserRouter>
      {/* 로비 컴포넌트가 하단바와 상단 화면 전환을 총괄하게 만듭니다 */}
      {/* <Login/> */}
      {/* <Register/> */}
      {/* <ExerciseSelect /> */}
      <MainLobby />
    </BrowserRouter>
  )
}

export default App
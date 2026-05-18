import { useState } from 'react'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ExerciseSelect from './pages/ExerciseSelect.jsx'
import { Routes, Route, Navigate } from 'react-router-dom';
import Result from './pages/Result.jsx'

function App() {

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/exerciseselect" element={<ExerciseSelect />} />
      <Route path="/result" element={<Result />} />
    </Routes>
  )
}

export default App // App.jsx

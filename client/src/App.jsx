import { useState } from 'react'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ExerciseSelect from './pages/ExerciseSelect.jsx'
import { Router,Routes,Route } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

function App() {

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/exerciseselect" element={<ExerciseSelect />} />
    </Routes>
  )
}

export default App

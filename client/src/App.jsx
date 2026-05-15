import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ExerciseSelect from './pages/ExerciseSelect.jsx'

function App() {

  return (
    <BrowserRouter>

      {/* <Login></Login>
      <Register></Register> */}
      <ExerciseSelect></ExerciseSelect>
    </BrowserRouter>
  )
}

export default App

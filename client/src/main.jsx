import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'; // BrowserRouter 임포트

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* App 컴포넌트를 BrowserRouter로 감싸기 */}
      <App />
    </BrowserRouter>
  </StrictMode>,
) // main.jsx

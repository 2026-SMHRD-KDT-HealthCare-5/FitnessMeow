/**
 * App.jsx — 앱 루트 라우팅 컴포넌트
 *
 * 목차:
 *   1. 임포트            — 페이지 컴포넌트 전체 임포트
 *   2. 라우트 정의       — path별 컴포넌트 매핑 (총 11개 경로)
 *
 * 라우트 구조:
 *   /               → /login 리다이렉트 (기본 진입점)
 *   /login          → Login           (로그인)
 *   /register       → Register        (회원가입)
 *   /mainlobby      → MainLobby       (메인 로비 홈)
 *   /exerciseselect → ExerciseSetting (운동 선택, page='select')
 *   /exercisesetting→ ExerciseSetting (운동 설정, page='setting')
 *   /exercise       → ExerciseSetting (운동 실행, page='exercise')
 *   /result         → Result          (운동 결과)
 *   /profile        → Profile         (최근 운동 기록)
 *   /collection     → Collection      (동물 도감)
 *   /shop           → Shop            (상점)
 *   /info           → Info            (내 정보)
 *
 * 비고:
 *   - ExerciseSetting 컴포넌트가 page prop 값에 따라
 *     운동 선택·설정·실행 세 화면을 모두 담당
 */

import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// ══════════════════════════════════════
// 1. 임포트
//    앱에서 사용하는 모든 페이지 컴포넌트 임포트
// ══════════════════════════════════════

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

// ══════════════════════════════════════
// 2. 라우트 정의
//    path → 컴포넌트 매핑, BrowserRouter는 main.jsx에서 감쌈
// ══════════════════════════════════════
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

        {/* 4. 운동 선택 및 설정 화면 — ExerciseSetting이 page prop으로 단계 분기 */}
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

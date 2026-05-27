/**
 * Info.jsx — 내 정보 페이지
 *
 * 전체 화면 구성 (위 → 아래):
 *   ① info-profile-card : 캐릭터 이미지 + 닉네임·아이디 + 레벨 뱃지 + EXP 바
 *   ② info-stats-grid   : 코인·돌봄포인트·BMI·키·몸무게·총경험치 통계 카드
 *   ③ info-account-card : 이메일·아이디 계정 정보
 *   ④ info-logout-btn   : 로그아웃 버튼
 *   ⑤ Navbar            : 하단 탭 바
 *
 * 상태(state):
 *   user       — 유저 기본 정보 { name, id, email, bmi, height, weight }
 *   character  — 고양이 정보 { character_key, level, exp, max_exp, ... }
 *   coins      — 현재 보유 코인
 *   carePoints — 현재 돌봄포인트
 *
 * API 연동:
 *   GET  /api/auth/me       — 유저 기본 정보 (이름·이메일·신체 정보)
 *   GET  /api/character     — 고양이 레벨·경험치 정보
 *   GET  /api/care/status   — 코인·돌봄포인트 조회
 *   POST /api/auth/logout   — 로그아웃 (세션 삭제 후 /login 으로 이동)
 *
 * EXP 바 계산:
 *   character.exp / character.max_exp × 100 = 퍼센트 (100% 초과 방지)
 *
 * 스탯 카드 목록 (STATS 배열):
 *   코인, 돌봄포인트, BMI, 키(cm), 몸무게(kg), 총 경험치
 *   각 항목은 { icon, value, unit?, label } 형식
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';
import { CHARACTER_CONFIG } from '../config/characters.js'; // 캐릭터 이름 조회용
import stampImg from '../assets/icons/stamp.png';
import '../css/Info.css';

// 서버 주소: .env 에 VITE_API_URL 이 있으면 사용, 없으면 로컬 3001포트
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/* ── 캐릭터 이미지 번들 ───────────────────────────────────────────────────────
   빌드 시점에 모든 캐릭터 PNG를 URL 맵으로 로드.
   프로필 카드에 현재 캐릭터 이미지(현재 레벨 기준)를 표시하는 데 사용.
─────────────────────────────────────────────────────────────────────────── */
const CAT_IMAGES = import.meta.glob(
  '../assets/characters/**/*.png',
  { eager: true, import: 'default' },
);

/**
 * 캐릭터 키와 레벨로 이미지 URL 반환
 * @param {string} key   — 캐릭터 키 (예: "cheese_korean_shorthair")
 * @param {number} level — 레벨 1·2·3
 * @returns {string|null}
 */
function getCatUrl(key, level = 1) {
  return CAT_IMAGES[`../assets/characters/${key}/${key}_LV_${level}.png`] ?? null;
}

/* ══════════════════════════════════════════════════════════════
   Info 컴포넌트
══════════════════════════════════════════════════════════════ */
const Info = () => {
  const navigate = useNavigate();

  // ── 상태 선언 ─────────────────────────────────────────────────────────────
  const [user,       setUser]       = useState(null); // 유저 기본 정보
  const [character,  setCharacter]  = useState(null); // 고양이 정보
  const [coins,      setCoins]      = useState(0);    // 보유 코인

  // 캘린더 상태
  const today      = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1); // 1~12
  const [activeDays, setActiveDays] = useState([]);                // 운동한 날 배열

  // 스트릭 상태
  const [streak, setStreak] = useState({ current_streak: 0, max_streak: 0, total_days: 0 });

  // 키·몸무게 편집 상태
  const [editOpen,    setEditOpen]    = useState(false);
  const [editHeight,  setEditHeight]  = useState('');
  const [editWeight,  setEditWeight]  = useState('');
  const [editSaving,  setEditSaving]  = useState(false);

  // ── 초기 데이터 로드 (3개 API 병렬 호출) ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, charRes, careRes] = await Promise.all([
          axios.get(`${API}/api/auth/me`,       { withCredentials: true }),
          axios.get(`${API}/api/character`,     { withCredentials: true }),
          axios.get(`${API}/api/care/status`,   { withCredentials: true }),
        ]);
        setUser(meRes.data.data);
        setCharacter(charRes.data);
        setCoins(careRes.data.coins ?? 0);

        // 스트릭 조회
        try {
          const strRes = await axios.get(`${API}/api/attendance/streak`, { withCredentials: true });
          setStreak(strRes.data);
        } catch { /* 기본값 유지 */ }
      } catch {
        // 비로그인 등 오류 시 기본값(null/0) 유지 → UI 에서 '---' 로 표시됨
      }
    };
    load();
  }, []);

  // ── 캘린더 월 변경 시 운동 기록 조회 ─────────────────────────────────────
  const loadCalendar = useCallback(async (year, month) => {
    try {
      const res = await axios.get(
        `${API}/api/calendar?year=${year}&month=${month}`,
        { withCredentials: true },
      );
      setActiveDays(res.data.activeDays ?? []);
    } catch {
      setActiveDays([]);
    }
  }, []);

  useEffect(() => {
    loadCalendar(calYear, calMonth);
  }, [calYear, calMonth, loadCalendar]);

  // ── 이전/다음 달 이동 ─────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else                { setCalMonth(m => m - 1); }
  };
  const nextMonth = () => {
    // 미래 달은 이동 불가
    if (calYear === today.getFullYear() && calMonth === today.getMonth() + 1) return;
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else                 { setCalMonth(m => m + 1); }
  };

  // ── 캘린더 날짜 배열 생성 ─────────────────────────────────────────────────
  // 해당 월의 1일 요일(0=일) 과 총 일수 계산
  const firstDay  = new Date(calYear, calMonth - 1, 1).getDay(); // 0(일)~6(토)
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  // 앞 빈칸 + 날짜 배열 (null = 빈칸)
  const calCells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const activeSet = new Set(activeDays);

  // ── 로그아웃 핸들러 ──────────────────────────────────────────────────────
  // 서버에 로그아웃 요청 후 성공·실패 관계없이 /login 으로 이동
  const handleLogout = async () => {
    try {
      await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
    } finally {
      navigate('/login');
    }
  };

  // ── 키·몸무게 편집 ────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditHeight(user?.height ?? '');
    setEditWeight(user?.weight ?? '');
    setEditOpen(true);
  };

  const saveBodyInfo = async () => {
    setEditSaving(true);
    try {
      const res = await axios.patch(
        `${API}/api/auth/me`,
        { height: editHeight, weight: editWeight },
        { withCredentials: true },
      );
      setUser(prev => ({ ...prev, height: res.data.height, weight: res.data.weight, bmi: res.data.bmi }));
      setEditOpen(false);
    } catch {
      alert('저장 실패. 올바른 값을 입력해주세요.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── 표시용 계산값 ────────────────────────────────────────────────────────
  const charConfig = character ? CHARACTER_CONFIG[character.character_key] : null;
  const catImg     = character ? getCatUrl(character.character_key, character.level ?? 1) : null;

  // ── 스탯 카드 목록 ────────────────────────────────────────────────────────
  // 이 배열을 수정해 표시할 통계 항목을 추가·제거·순서 변경 가능
  const STATS = [
    { icon: '🪙', value: coins.toLocaleString(),   label: '코인'      },
    { icon: '⚖️', value: user?.bmi    ?? '--',     label: 'BMI'       },
    { icon: '📏', value: user?.height ?? '--', unit: 'cm', label: '키'    },
    { icon: '💪', value: user?.weight ?? '--', unit: 'kg', label: '몸무게' },
    { icon: '✨', value: user?.point  ?? 0,        label: '총 경험치'  },
  ];

  // ── 렌더 ──────────────────────────────────────────────────────────────────
  return (
    <div className="info-page">
      {/* 최대 너비 제한 + 가운데 정렬 (PC 화면에서도 보기 좋게) */}
      <div className="info-content">

        {/* ── ① 프로필 카드 ── */}
        <div className="info-profile-card">
          {/* 캐릭터 이미지 */}
          <div className="info-cat-wrap">
            {catImg
              ? <img src={catImg} alt="캐릭터" className="info-cat-img" />
              : <span className="info-cat-emoji">🐱</span>  /* 이미지 없으면 이모지 대체 */
            }
          </div>

          {/* 유저·캐릭터 정보 */}
          <div className="info-user-detail">
            <p className="info-username">{user?.name ?? '---'}</p>
            <p className="info-userid">@{user?.id ?? '---'}</p>

            {/* 레벨 뱃지 + 캐릭터 이름 */}
            <div className="info-level-row">
              <span className="info-level-badge">Lv.{character?.level ?? 1}</span>
              <span className="info-char-name">{charConfig?.character_name ?? '---'}</span>
            </div>

          </div>
        </div>

        {/* ── ② 스탯 그리드 ── */}
        <div className="info-section-title">
          내 스탯
          <button className="info-edit-btn" onClick={openEdit}>편집</button>
        </div>

        {editOpen && (
          <div className="info-edit-form">
            <div className="info-edit-row">
              <label>키</label>
              <input
                type="number"
                value={editHeight}
                onChange={e => setEditHeight(e.target.value)}
                placeholder="cm"
              />
              <span>cm</span>
            </div>
            <div className="info-edit-row">
              <label>몸무게</label>
              <input
                type="number"
                value={editWeight}
                onChange={e => setEditWeight(e.target.value)}
                placeholder="kg"
              />
              <span>kg</span>
            </div>
            <div className="info-edit-actions">
              <button className="info-edit-cancel" onClick={() => setEditOpen(false)}>취소</button>
              <button className="info-edit-save" onClick={saveBodyInfo} disabled={editSaving}>
                {editSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}
        <div className="info-stats-grid">
          {STATS.map(({ icon, value, unit, label }) => (
            <div key={label} className="info-stat-card">
              <span className="info-stat-icon">{icon}</span>
              <p className="info-stat-value">
                {value}
                {/* 단위(cm, kg 등)는 작은 글씨로 표시 */}
                {unit && <small>{unit}</small>}
              </p>
              <p className="info-stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* ── ③ 출석 캘린더 + 스트릭 ── */}
        <div className="info-section-title">출석 캘린더</div>
        <div className="info-calendar-row">

        <div className="info-calendar-card">
          {/* 월 네비게이션 */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
            <span className="cal-title">{calYear}년 {calMonth}월</span>
            <button
              className="cal-nav-btn"
              onClick={nextMonth}
              disabled={calYear === today.getFullYear() && calMonth === today.getMonth() + 1}
            >›</button>
          </div>

          {/* 요일 헤더 */}
          <div className="cal-grid">
            {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} className="cal-weekday">{d}</div>
            ))}

            {/* 날짜 셀 */}
            {calCells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const isToday   = calYear === today.getFullYear()
                             && calMonth === today.getMonth() + 1
                             && day === today.getDate();
              const isActive  = activeSet.has(day);
              return (
                <div
                  key={day}
                  className={`cal-day${isActive ? ' active' : ''}${isToday ? ' today' : ''}`}
                >
                  {day}
                  {isActive && <img src={stampImg} alt="출석" className="cal-stamp" />}
                </div>
              );
            })}
          </div>

          {/* 이번 달 운동 횟수 */}
          <div className="cal-summary">
            이번 달 <strong>{activeDays.length}일</strong> 운동했어요 🐱
          </div>
        </div>

          {/* 연속 출석 스트릭 카드 */}
          <div className="info-streak-card">
            <div className="streak-fire">🔥</div>
            <div className="streak-current">{streak.current_streak}<span>일</span></div>
            <div className="streak-label">연속 출석</div>
            <div className="streak-divider" />
            <div className="streak-stat">
              <span className="streak-stat-val">{streak.max_streak}</span>
              <span className="streak-stat-label">최고 기록</span>
            </div>
            <div className="streak-stat">
              <span className="streak-stat-val">{streak.total_days}</span>
              <span className="streak-stat-label">총 출석일</span>
            </div>
          </div>

        </div>{/* info-calendar-row */}

        {/* ── ④ 계정 정보 ── */}
        <div className="info-section-title">계정 정보</div>
        <div className="info-account-card">
          <div className="info-account-row">
            <span className="info-account-key">이메일</span>
            <span className="info-account-val">{user?.email ?? '---'}</span>
          </div>
          <div className="info-account-row">
            <span className="info-account-key">아이디</span>
            <span className="info-account-val">{user?.id ?? '---'}</span>
          </div>
        </div>

        {/* ── ④ 로그아웃 버튼 ── */}
        <button className="info-logout-btn" onClick={handleLogout}>
          로그아웃
        </button>

      </div>

      {/* ── ⑤ 하단 탭 바 ── */}
      <Navbar />
    </div>
  );
};

export default Info;

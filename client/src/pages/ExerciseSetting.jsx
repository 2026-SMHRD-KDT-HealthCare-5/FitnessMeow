/**
 * ExerciseSetting.jsx — 운동 설정 페이지 (라우터 분기 허브)
 *
 * 목차:
 *   1. 상수 정의         — 운동별 정보(이름·설명·힌트), 기본 설정값
 *   2. 유틸 함수         — 설정값 정규화·유효성 검사·숫자 변환 헬퍼
 *   3. ExerciseSettingForm — 세트·횟수·휴식 시간 입력 폼 + 운동 가이드 섹션
 *   4. ExerciseSetting   — page prop 기반으로 select/setting/exercise 중 하나 렌더
 *
 * Props (ExerciseSetting):
 *   page {string} — 'select' | 'setting' | 'exercise', 기본값 'select'
 *                   App.jsx 라우트에서 각 경로마다 다른 page 값을 전달
 *
 * 라우팅 구조:
 *   /exerciseselect  → page='select'   → ExerciseSelect 렌더 (운동 선택)
 *   /exercisesetting → page='setting'  → ExerciseSettingForm 렌더 (세트·횟수·휴식 설정)
 *   /exercise        → page='exercise' → Exercise 렌더 (실제 운동 실행)
 *
 * 데이터 흐름:
 *   선택한 운동 key와 설정값을 navigate state로 다음 단계에 전달
 */

import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/ExerciseSetting.css';
import ExerciseSelect from './ExerciseSelect.jsx';
import Exercise from './Exercise.jsx';

// ══════════════════════════════════════
// 1. 상수 정의
//    운동별 ID·이름·설명·GIF·힌트 정보 및 기본 설정값
// ══════════════════════════════════════

// 운동 종목별 상세 정보 (설정 페이지 가이드 섹션에 사용)
const EXERCISE_INFO = {
  squat: {
    id: "squat",
    name: "스쿼트",
    description: "하체와 코어를 함께 강화하는 기본 운동입니다.",
    gif: "",
    hint: "발을 어깨너비로 벌리고 무릎이 발끝을 넘지 않도록 내려가세요.",
  },
  pushup: {
    id: "pushup",
    name: "푸시업",
    description: "가슴과 팔, 코어를 함께 쓰는 전신 체중 운동입니다.",
    gif: "",
    hint: "몸을 일직선으로 유지하고 팔꿈치를 자연스럽게 굽혀 내려가세요.",
  },
  lunge: {
    id: "lunge",
    name: "런지",
    description: "하체 균형과 다리 힘을 동시에 기르는 운동입니다.",
    gif: "",
    hint: "앞발에 체중을 싣고 뒷무릎이 바닥에 닿기 직전까지 내려가세요.",
  },
};

// 운동 설정 기본값 (처음 설정 페이지 진입 시 적용)
const DEFAULT_SETTINGS = {
  sets: 3,
  reps: 12,
  rest: 60,
};

// ══════════════════════════════════════
// 2. 유틸 함수
//    입력값 정규화, 유효성 검사, 숫자 변환 헬퍼
// ══════════════════════════════════════

// 설정값을 양의 정수로 정규화 (소수·음수 방지)
const normalizeSettingValue = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(1, Math.floor(numberValue)) : 1;
};

// 양의 정수 입력 여부 확인 — 빈 문자열 또는 1 이상의 정수만 허용
const isPositiveIntegerInput = (value) => value === '' || /^[1-9]\d*$/.test(value);
// 모든 설정 필드가 유효한 양의 정수인지 검사
const hasValidSettings = (settings) => {
  return Object.values(settings).every((value) => /^[1-9]\d*$/.test(String(value)));
};
// 폼 문자열 설정값을 숫자 객체로 변환
const toNumericSettings = (settings) => ({
  sets: Number(settings.sets),
  reps: Number(settings.reps),
  rest: Number(settings.rest),
});

// ══════════════════════════════════════
// 3. ExerciseSettingForm
//    세트·횟수·휴식 시간 입력 폼 + 운동 가이드 섹션
// ══════════════════════════════════════

function ExerciseSettingForm({
  selectedType = 'squat',
  initialSettings = DEFAULT_SETTINGS,
  onBack,
  onStart,
  onSettingsChange,
}) {
  // 선택된 운동 정보 (이름·설명·힌트)
  const exercise = useMemo(() => {
    return EXERCISE_INFO[selectedType] || EXERCISE_INFO.squat;
  }, [selectedType]);

  // 세트·횟수·휴식 시간 입력 상태 — 초기값에서 정규화하여 시작
  const [settings, setSettings] = useState({
    sets: normalizeSettingValue(initialSettings.sets || DEFAULT_SETTINGS.sets),
    reps: normalizeSettingValue(initialSettings.reps || DEFAULT_SETTINGS.reps),
    rest: normalizeSettingValue(initialSettings.rest || DEFAULT_SETTINGS.rest),
  });

  // 설정 필드 업데이트 — 유효한 입력값만 상태 반영, 전체 유효 시 부모에 알림
  const updateSetting = (field, value) => {
    if (!isPositiveIntegerInput(value)) return;

    const nextSettings = { ...settings, [field]: value };
    setSettings(nextSettings);
    // 모든 필드가 유효한 경우에만 부모 컴포넌트에 변경 알림
    if (hasValidSettings(nextSettings)) {
      onSettingsChange?.(toNumericSettings(nextSettings));
    }
  };

  // 운동 시작 — 유효성 검사 후 onStart 콜백으로 exercise ID와 설정 전달
  const startExercise = () => {
    if (!hasValidSettings(settings)) return;

    const nextSettings = toNumericSettings(settings);
    onStart?.(exercise.id, nextSettings);
  };

  return (
    <div className="setting-page">
      <div className="setting-card">
        {/* 이전 페이지(운동 선택)로 돌아가기 버튼 */}
        <button type="button" className="setting-back-button" onClick={onBack}>
          이전
        </button>

        {/* 운동 정보 헤더: 레이블·이름·설명·선택 배지 */}
        <div className="setting-hero">
          <div>
            <p className="setting-label">운동 설정</p>
            <h1>{exercise.name}</h1>
            <p className="setting-description">{exercise.description}</p>
          </div>
          <div className="setting-badge">선택: {exercise.id.toUpperCase()}</div>
        </div>

        {/* 가이드 섹션: GIF 애니메이션 + 자세 힌트 텍스트 */}
        <div className="guide-section">
          <div className="guide-media">
            {exercise.gif ? (
              <img src={exercise.gif} alt={`${exercise.name} 운동 가이드`} />
            ) : (
              // GIF 데이터가 없는 경우 빈 상태 안내
              <div className="guide-empty">GIF 정보가 없습니다.</div>
            )}
          </div>
          <div className="guide-info">
            <h2>가이드</h2>
            <p>{exercise.hint}</p>
          </div>
        </div>

        {/* 운동 설정 폼: 세트 수·횟수·휴식 시간 입력 */}
        <div className="setting-form">
          <div className="field-row">
            <label htmlFor="sets">세트 수</label>
            <input
              id="sets"
              type="number"
              min="1"
              step="1"
              value={settings.sets}
              onChange={(event) => updateSetting('sets', event.target.value)}
            />
          </div>

          <div className="field-row">
            <label htmlFor="reps">횟수</label>
            <input
              id="reps"
              type="number"
              min="1"
              step="1"
              value={settings.reps}
              onChange={(event) => updateSetting('reps', event.target.value)}
            />
          </div>

          <div className="field-row">
            <label htmlFor="rest">휴식 시간 (초)</label>
            <input
              id="rest"
              type="number"
              min="1"
              step="1"
              value={settings.rest}
              onChange={(event) => updateSetting('rest', event.target.value)}
            />
          </div>
        </div>

        {/* 운동 시작 버튼 — 모든 설정값이 유효해야 활성화 */}
        <button
          type="button"
          className="primary-button"
          onClick={startExercise}
          disabled={!hasValidSettings(settings)}
        >
          운동 시작하기
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// 4. ExerciseSetting
//    page prop에 따라 select/setting/exercise 중 하나를 렌더하는 라우터 허브
// ══════════════════════════════════════

export default function ExerciseSetting({ page = 'select' }) {
  const navigate = useNavigate();
  const location = useLocation();
  // 이전 페이지에서 navigate state로 넘어온 운동 key·설정값 복원
  const [selectedType, setSelectedType] = useState(location.state?.selectedType || 'squat');
  const [exerciseSettings, setExerciseSettings] = useState(location.state?.exerciseSettings || DEFAULT_SETTINGS);

  return (
    <>
      {/* page='select': 운동 종목 선택 화면 */}
      {page === 'select' && (
        <ExerciseSelect
          onSelect={(type) => {
            setSelectedType(type);
            navigate('/exercisesetting', {
              state: { selectedType: type, exerciseSettings },
            });
          }}
        />
      )}

      {/* page='setting': 세트·횟수·휴식 설정 화면 */}
      {page === 'setting' && (
        <ExerciseSettingForm
          selectedType={selectedType}
          initialSettings={exerciseSettings}
          onBack={() => navigate(-1)}   // 히스토리에서 이전 페이지(운동선택)로 이동
          onSettingsChange={(nextSettings) => setExerciseSettings(nextSettings)}
          onStart={(type, nextSettings) => {
            setSelectedType(type);
            setExerciseSettings(nextSettings);
            navigate('/exercise', {
              state: { selectedType: type, exerciseSettings: nextSettings },
            });
          }}
        />
      )}

      {/* page='exercise': 실제 운동 실행 화면 */}
      {page === 'exercise' && (
        <Exercise
          type={selectedType}
          settings={exerciseSettings}
          onFinish={(resultState) => navigate('/result', { state: resultState })}
          onBack={() => navigate(-1)}   // 히스토리에서 이전 페이지(운동설정)로 이동
        />
      )}
    </>
  );
}

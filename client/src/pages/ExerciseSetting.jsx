import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/ExerciseSetting.css';
import ExerciseSelect from './ExerciseSelect.jsx';
import Exercise from './Exercise.jsx';

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

const DEFAULT_SETTINGS = {
  sets: 3,
  reps: 12,
  rest: 60,
};

const normalizeSettingValue = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(1, Math.floor(numberValue)) : 1;
};

const isPositiveIntegerInput = (value) => value === '' || /^[1-9]\d*$/.test(value);
const hasValidSettings = (settings) => {
  return Object.values(settings).every((value) => /^[1-9]\d*$/.test(String(value)));
};
const toNumericSettings = (settings) => ({
  sets: Number(settings.sets),
  reps: Number(settings.reps),
  rest: Number(settings.rest),
});

function ExerciseSettingForm({
  selectedType = 'squat',
  initialSettings = DEFAULT_SETTINGS,
  onBack,
  onStart,
  onSettingsChange,
}) {
  const exercise = useMemo(() => {
    return EXERCISE_INFO[selectedType] || EXERCISE_INFO.squat;
  }, [selectedType]);

  const [settings, setSettings] = useState({
    sets: normalizeSettingValue(initialSettings.sets || DEFAULT_SETTINGS.sets),
    reps: normalizeSettingValue(initialSettings.reps || DEFAULT_SETTINGS.reps),
    rest: normalizeSettingValue(initialSettings.rest || DEFAULT_SETTINGS.rest),
  });

  const updateSetting = (field, value) => {
    if (!isPositiveIntegerInput(value)) return;

    const nextSettings = { ...settings, [field]: value };
    setSettings(nextSettings);
    if (hasValidSettings(nextSettings)) {
      onSettingsChange?.(toNumericSettings(nextSettings));
    }
  };

  const startExercise = () => {
    if (!hasValidSettings(settings)) return;

    const nextSettings = toNumericSettings(settings);
    onStart?.(exercise.id, nextSettings);
  };

  return (
    <div className="setting-page">
      <div className="setting-card">
        <button type="button" className="setting-back-button" onClick={onBack}>
          이전
        </button>

        <div className="setting-hero">
          <div>
            <p className="setting-label">운동 설정</p>
            <h1>{exercise.name}</h1>
            <p className="setting-description">{exercise.description}</p>
          </div>
          <div className="setting-badge">선택: {exercise.id.toUpperCase()}</div>
        </div>

        <div className="guide-section">
          <div className="guide-media">
            {exercise.gif ? (
              <img src={exercise.gif} alt={`${exercise.name} 운동 가이드`} />
            ) : (
              <div className="guide-empty">GIF 정보가 없습니다.</div>
            )}
          </div>
          <div className="guide-info">
            <h2>가이드</h2>
            <p>{exercise.hint}</p>
          </div>
        </div>

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

export default function ExerciseSetting({ page = 'select' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedType, setSelectedType] = useState(location.state?.selectedType || 'squat');
  const [exerciseSettings, setExerciseSettings] = useState(location.state?.exerciseSettings || DEFAULT_SETTINGS);

  return (
    <>
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

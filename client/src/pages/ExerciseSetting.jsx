import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/ExerciseSetting.css';
import ExerciseSelect from './ExerciseSelect.jsx';
import Exercise from './Exercise.jsx';

const EXERCISE_INFO = {
  squat: {
    id: 'squat',
    name: '스쿼트',
    description: '하체와 코어를 함께 강화하는 기본 운동입니다.',
    gif: '',
    hint: '발을 어깨너비로 벌리고 무릎이 발끝을 넘지 않도록 내려주세요.',
  },
  pushup: {
    id: 'pushup',
    name: '푸시업',
    description: '가슴과 어깨, 코어를 다지는 전신 체중 운동입니다.',
    gif: '',
    hint: '몸은 일직선을 유지하고 팔꿈치를 뒤쪽으로 붙여 내립니다.',
  },
  lunge: {
    id: 'lunge',
    name: '런지',
    description: '하체 균형과 다리 힘을 동시에 기르는 운동입니다.',
    gif: '',
    hint: '앞발에 체중을 싣고 뒷무릎이 바닥에 닿기 직전까지 내려가세요.',
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
    const nextValue = normalizeSettingValue(value);
    const nextSettings = { ...settings, [field]: nextValue };
    setSettings(nextSettings);
    onSettingsChange?.(nextSettings);
  };

  return (
    <div className="setting-page">
      <div className="setting-card">
        <button type="button" className="setting-back-button" onClick={onBack}>
          ← 이전
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

        <div className="summary-card">
          <h2>운동 요약</h2>
          <p>운동 종류: {exercise.name}</p>
          <p>세트: {settings.sets}회</p>
          <p>횟수: {settings.reps}회</p>
          <p>휴식: {settings.rest}초</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => onStart?.(exercise.id, settings)}
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
          onBack={() => navigate('/exerciseselect')}
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
          onBack={() => navigate('/exercisesetting', {
            state: { selectedType, exerciseSettings },
          })}
        />
      )}
    </>
  );
}

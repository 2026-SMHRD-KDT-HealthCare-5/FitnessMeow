import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/ExerciseSetting.css';
import ExerciseSelect from './ExerciseSelect.jsx';
import Exercise from './Exercise.jsx';

const EXERCISE_INFO = {
  squat: {
    id: "squat",
    name: "\uC2A4\uCFFC\uD2B8",
    description: "\uD558\uCCB4\uC640 \uCF54\uC5B4\uB97C \uD568\uAED8 \uAC15\uD654\uD558\uB294 \uAE30\uBCF8 \uC6B4\uB3D9\uC785\uB2C8\uB2E4.",
    gif: "",
    hint: "\uBC1C\uC744 \uC5B4\uAE68\uB108\uBE44\uB85C \uBC8C\uB9AC\uACE0 \uBB34\uB98E\uC774 \uBC1C\uB05D\uC744 \uB118\uC9C0 \uC54A\uB3C4\uB85D \uB0B4\uB824\uAC00\uC138\uC694.",
  },
  pushup: {
    id: "pushup",
    name: "\uD478\uC2DC\uC5C5",
    description: "\uAC00\uC2B4\uACFC \uD314, \uCF54\uC5B4\uB97C \uD568\uAED8 \uC4F0\uB294 \uC804\uC2E0 \uCCB4\uC911 \uC6B4\uB3D9\uC785\uB2C8\uB2E4.",
    gif: "",
    hint: "\uBAB8\uC744 \uC77C\uC9C1\uC120\uC73C\uB85C \uC720\uC9C0\uD558\uACE0 \uD314\uAFC8\uCE58\uB97C \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uAD7D\uD600 \uB0B4\uB824\uAC00\uC138\uC694.",
  },
  lunge: {
    id: "lunge",
    name: "\uB7F0\uC9C0",
    description: "\uD558\uCCB4 \uADE0\uD615\uACFC \uB2E4\uB9AC \uD798\uC744 \uB3D9\uC2DC\uC5D0 \uAE30\uB974\uB294 \uC6B4\uB3D9\uC785\uB2C8\uB2E4.",
    gif: "",
    hint: "\uC55E\uBC1C\uC5D0 \uCCB4\uC911\uC744 \uC2E3\uACE0 \uB4B7\uBB34\uB98E\uC774 \uBC14\uB2E5\uC5D0 \uB2FF\uAE30 \uC9C1\uC804\uAE4C\uC9C0 \uB0B4\uB824\uAC00\uC138\uC694.",
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
          {"\uC774\uC804"}
        </button>

        <div className="setting-hero">
          <div>
            <p className="setting-label">{"\uC6B4\uB3D9 \uC124\uC815"}</p>
            <h1>{exercise.name}</h1>
            <p className="setting-description">{exercise.description}</p>
          </div>
          <div className="setting-badge">{"\uC120\uD0DD"}: {exercise.id.toUpperCase()}</div>
        </div>

        <div className="guide-section">
          <div className="guide-media">
            {exercise.gif ? (
              <img src={exercise.gif} alt={exercise.name + " \uC6B4\uB3D9 \uAC00\uC774\uB4DC"} />
            ) : (
              <div className="guide-empty">{"GIF \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}</div>
            )}
          </div>
          <div className="guide-info">
            <h2>{"\uAC00\uC774\uB4DC"}</h2>
            <p>{exercise.hint}</p>
          </div>
        </div>

        <div className="setting-form">
          <div className="field-row">
            <label htmlFor="sets">{"\uC138\uD2B8 \uC218"}</label>
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
            <label htmlFor="reps">{"\uD69F\uC218"}</label>
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
            <label htmlFor="rest">{"\uD734\uC2DD \uC2DC\uAC04 (\uCD08)"}</label>
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
          {"\uC6B4\uB3D9 \uC2DC\uC791\uD558\uAE30"}
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
          onFinish={(resultState) => navigate('/result', { state: resultState })}
          onBack={() => navigate('/exercisesetting', {
            state: { selectedType, exerciseSettings },
          })}
        />
      )}
    </>
  );
}

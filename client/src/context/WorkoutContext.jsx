import React, { createContext, useState, useCallback } from 'react';

export const WorkoutContext = createContext();

export function WorkoutProvider({ children }) {
  const [workoutData, setWorkoutData] = useState(null);

  const setWorkout = useCallback((data) => {
    setWorkoutData(data);
  }, []);

  const clearWorkout = useCallback(() => {
    setWorkoutData(null);
  }, []);

  return (
    <WorkoutContext.Provider value={{ workoutData, setWorkout, clearWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = React.useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within WorkoutProvider');
  }
  return context;
}

import api from "./api";

export const saveWorkout = (data) => api.post("/api/workouts", data);
export const getWorkouts = () => api.get("/api/workouts");
export const getBestRecord = (exerciseKey) => api.get(`/api/workouts/best/${exerciseKey}`);
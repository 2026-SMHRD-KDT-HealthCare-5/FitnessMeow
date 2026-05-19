import api from "./api";

// 월별 출석 조회 (month 예: "2026-05")
export const getAttendance = (month) => api.get("/api/attendance", { params: { month } });

// 출석 처리 (운동 완료 시 호출)
export const checkAttendance = () => api.post("/api/attendance/check");
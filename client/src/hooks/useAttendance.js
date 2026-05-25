import { useState, useEffect } from "react";
import { getAttendance } from "../services/attendanceService";

export function useAttendance(month) {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    getAttendance(month)
      .then((res) => setAttendance(res.data))
      .catch((err) => console.error(err));
  }, [month]);

  return { attendance };
}
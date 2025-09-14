import api from './api';

/**
 * Attendance Service
 * Handles all attendance-related API calls
 */
const attendanceService = {
  /**
   * Mark attendance for a session
   * @param {number} sessionId - Session ID
   * @param {number} studentId - Student ID
   * @param {string} status - Attendance status (present, absent, late)
   * @returns {Promise} API response
   */
  markAttendance: async (sessionId, studentId, status = 'present') => {
    return await api.post('/attendance/mark', { sessionId, studentId, status });
  },

  /**
   * Get attendance for a specific session
   * @param {number} sessionId - Session ID
   * @returns {Promise} API response
   */
  getSessionAttendance: async (sessionId) => {
    return await api.get(`/attendance/session/${sessionId}`);
  },

  /**
   * Get attendance history for a student
   * @param {number} studentId - Student ID (optional for current user)
   * @returns {Promise} API response
   */
  getStudentAttendance: async (studentId = null) => {
    const url = studentId ? `/attendance/student/${studentId}` : '/attendance/student/';
    return await api.get(url);
  },

  /**
   * Get attendance statistics
   * @returns {Promise} API response
   */
  getAttendanceStats: async () => {
    return await api.get('/attendance/stats');
  },

  /**
   * Get attendance report for teacher's sessions
   * @param {number} teacherId - Teacher ID (optional for current user)
   * @returns {Promise} API response
   */
  getTeacherAttendanceReport: async (teacherId = null) => {
    const url = teacherId ? `/attendance/teacher/${teacherId}` : '/attendance/teacher/';
    return await api.get(url);
  },

  /**
   * Update attendance status
   * @param {number} attendanceId - Attendance ID
   * @param {string} status - New status (present, absent, late)
   * @returns {Promise} API response
   */
  updateAttendanceStatus: async (attendanceId, status) => {
    return await api.put(`/attendance/${attendanceId}/status`, { status });
  },

  /**
   * Check in for attendance with code
   * @param {number} sessionId - Session ID
   * @param {string} attendanceCode - Attendance code for verification
   * @returns {Promise} API response
   */
  checkInWithCode: async (sessionId, attendanceCode) => {
    return await api.post('/attendance/checkin', { sessionId, attendanceCode });
  },

  /**
   * Verify attendance code
   * @param {string} attendanceCode - Attendance code to verify
   * @returns {Promise} API response
   */
  verifyAttendanceCode: async (attendanceCode) => {
    return await api.post('/attendance/verify-code', { attendanceCode });
  },
};

export default attendanceService;
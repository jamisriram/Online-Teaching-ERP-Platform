import api from './api';

/**
 * Session Service
 * Handles all session-related API calls
 */
const sessionService = {
  /**
   * Get all sessions (role-based filtering)
   * @returns {Promise} API response
   */
  getAllSessions: async () => {
    return await api.get('/sessions');
  },

  /**
   * Get session by ID
   * @param {number} sessionId - Session ID
   * @returns {Promise} API response
   */
  getSessionById: async (sessionId) => {
    return await api.get(`/sessions/${sessionId}`);
  },

  /**
   * Create new session
   * @param {Object} sessionData - Session data
   * @returns {Promise} API response
   */
  createSession: async (sessionData) => {
    return await api.post('/sessions', sessionData);
  },

  /**
   * Update session
   * @param {number} sessionId - Session ID
   * @param {Object} sessionData - Updated session data
   * @returns {Promise} API response
   */
  updateSession: async (sessionId, sessionData) => {
    return await api.put(`/sessions/${sessionId}`, sessionData);
  },

  /**
   * Delete session
   * @param {number} sessionId - Session ID
   * @returns {Promise} API response
   */
  deleteSession: async (sessionId) => {
    return await api.delete(`/sessions/${sessionId}`);
  },

  /**
   * Join session (for students)
   * @param {number} sessionId - Session ID
   * @returns {Promise} API response
   */
  joinSession: async (sessionId) => {
    return await api.post(`/sessions/${sessionId}/join`);
  },

  /**
   * Get teacher's sessions (alias for getAllSessions)
   * @returns {Promise} API response
   */
  getTeacherSessions: async () => {
    return await api.get('/sessions');
  },

  /**
   * Start live session with attendance code
   * @param {number} sessionId - Session ID
   * @param {string} attendanceCode - Generated attendance code
   * @returns {Promise} API response
   */
  startLiveSession: async (sessionId, attendanceCode) => {
    return await api.post(`/sessions/${sessionId}/start-live`, { attendanceCode });
  },

  /**
   * End live session
   * @param {number} sessionId - Session ID
   * @returns {Promise} API response
   */
  endLiveSession: async (sessionId) => {
    return await api.post(`/sessions/${sessionId}/end-live`);
  },

  /**
   * Get live sessions for teacher
   * @returns {Promise} API response
   */
  getLiveSessions: async () => {
    return await api.get('/sessions/live');
  },
};

export default sessionService;
import api from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
const authService = {
  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} API response
   */
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  /**
   * Register user
   * @param {Object} userData - User registration data
   * @returns {Promise} API response
   */
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  /**
   * Get current user profile
   * @returns {Promise} API response
   */
  getProfile: async () => {
    return await api.get('/auth/profile');
  },

  /**
   * Verify JWT token
   * @returns {Promise} API response
   */
  verifyToken: async () => {
    return await api.get('/auth/verify');
  },

  /**
   * Logout user (client-side only)
   */
  logout: () => {
    localStorage.removeItem('token');
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} API response
   */
  updateProfile: async (profileData) => {
    return await api.put('/auth/profile', profileData);
  },

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise} API response
   */
  changePassword: async (passwordData) => {
    return await api.put('/auth/change-password', passwordData);
  },
};

export default authService;
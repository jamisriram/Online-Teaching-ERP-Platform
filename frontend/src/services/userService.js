import api from './api';

/**
 * User Service
 * Handles all user management API calls (admin functionality)
 */
const userService = {
  /**
   * Get all users
   * @returns {Promise} API response
   */
  getAllUsers: async () => {
    return await api.get('/users');
  },

  /**
   * Get user statistics
   * @returns {Promise} API response
   */
  getUserStats: async () => {
    return await api.get('/users/stats');
  },

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise} API response
   */
  getUserById: async (userId) => {
    return await api.get(`/users/${userId}`);
  },

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise} API response
   */
  createUser: async (userData) => {
    return await api.post('/users', userData);
  },

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} API response
   */
  updateUser: async (userId, userData) => {
    return await api.put(`/users/${userId}`, userData);
  },

  /**
   * Delete user
   * @param {number} userId - User ID
   * @returns {Promise} API response
   */
  deleteUser: async (userId) => {
    return await api.delete(`/users/${userId}`);
  },
};

export default userService;
const express = require('express');
const router = express.Router();

const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireTeacher } = require('../middleware/rbac');
const { validateUserUpdate } = require('../middleware/validation');

/**
 * User Management Routes
 * Handles user CRUD operations (admin only)
 */

/**
 * @route   GET /api/users/students
 * @desc    Get all students (for teachers)
 * @access  Private (teacher and admin)
 */
router.get('/students', authenticateToken, requireTeacher, UserController.getStudents);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (admin only)
 */
router.post('/', authenticateToken, requireAdmin, UserController.createUser);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (admin only)
 */
router.get('/', authenticateToken, requireAdmin, UserController.getAllUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (admin only)
 */
router.get('/stats', authenticateToken, requireAdmin, UserController.getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (admin only)
 */
router.get('/:id', authenticateToken, requireAdmin, UserController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, validateUserUpdate, UserController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, UserController.deleteUser);

module.exports = router;
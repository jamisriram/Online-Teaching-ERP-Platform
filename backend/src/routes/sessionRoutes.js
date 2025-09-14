const express = require('express');
const router = express.Router();

const SessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');
const { requireTeacherOrAdmin, requireStudentOrAdmin } = require('../middleware/rbac');
const { validateSessionCreation } = require('../middleware/validation');

/**
 * Session Management Routes
 * Handles session CRUD operations and student joining
 */

/**
 * @route   GET /api/sessions
 * @desc    Get sessions (role-based filtering)
 * @access  Private (authenticated users)
 */
router.get('/', authenticateToken, SessionController.getAllSessions);

/**
 * @route   POST /api/sessions
 * @desc    Create a new session
 * @access  Private (teachers and admins only)
 */
router.post('/', authenticateToken, requireTeacherOrAdmin, validateSessionCreation, SessionController.createSession);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session by ID
 * @access  Private (authenticated users)
 */
router.get('/:id', authenticateToken, SessionController.getSessionById);

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session
 * @access  Private (teachers and admins only)
 */
router.put('/:id', authenticateToken, requireTeacherOrAdmin, SessionController.updateSession);

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Delete session
 * @access  Private (teachers and admins only)
 */
router.delete('/:id', authenticateToken, requireTeacherOrAdmin, SessionController.deleteSession);

/**
 * @route   POST /api/sessions/:id/join
 * @desc    Join a session (students only)
 * @access  Private (students and admins only)
 */
router.post('/:id/join', authenticateToken, requireStudentOrAdmin, SessionController.joinSession);

/**
 * @route   POST /api/sessions/:id/start-live
 * @desc    Start live session with attendance code
 * @access  Private (teachers and admins only)
 */
router.post('/:id/start-live', authenticateToken, requireTeacherOrAdmin, SessionController.startLiveSession);

/**
 * @route   POST /api/sessions/:id/end-live
 * @desc    End live session
 * @access  Private (teachers and admins only)
 */
router.post('/:id/end-live', authenticateToken, requireTeacherOrAdmin, SessionController.endLiveSession);

/**
 * @route   GET /api/sessions/live
 * @desc    Get live sessions for teacher
 * @access  Private (teachers and admins only)
 */
router.get('/live', authenticateToken, requireTeacherOrAdmin, SessionController.getLiveSessions);

module.exports = router;
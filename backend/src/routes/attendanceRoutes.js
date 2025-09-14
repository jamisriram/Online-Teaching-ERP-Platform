const express = require('express');
const router = express.Router();

const AttendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');
const { requireTeacherOrAdmin, requireAdmin } = require('../middleware/rbac');
const { validateAttendanceStatus } = require('../middleware/validation');

/**
 * Attendance Management Routes
 * Handles attendance tracking and reporting
 */

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance for a session (teachers and admins only)
 * @access  Private (teachers and admins only)
 */
router.post('/mark', authenticateToken, requireTeacherOrAdmin, AttendanceController.markAttendance);

/**
 * @route   GET /api/attendance/session/:sessionId
 * @desc    Get attendance for a specific session
 * @access  Private (teachers and admins only)
 */
router.get('/session/:sessionId', authenticateToken, requireTeacherOrAdmin, AttendanceController.getSessionAttendance);

/**
 * @route   GET /api/attendance/student/:studentId?
 * @desc    Get attendance history for a student
 * @access  Private (students can view their own, admins can view any)
 */
router.get('/student/:studentId?', authenticateToken, AttendanceController.getStudentAttendance);

/**
 * @route   GET /api/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private (admins only)
 */
router.get('/stats', authenticateToken, requireAdmin, AttendanceController.getAttendanceStats);

/**
 * @route   GET /api/attendance/teacher/:teacherId?
 * @desc    Get attendance report for teacher's sessions
 * @access  Private (teachers can view their own, admins can view any)
 */
router.get('/teacher/:teacherId?', authenticateToken, requireTeacherOrAdmin, AttendanceController.getTeacherAttendanceReport);

/**
 * @route   PUT /api/attendance/:attendanceId/status
 * @desc    Update attendance status
 * @access  Private (teachers and admins only)
 */
router.put('/:attendanceId/status', authenticateToken, requireTeacherOrAdmin, validateAttendanceStatus, AttendanceController.updateAttendanceStatus);

/**
 * @route   POST /api/attendance/checkin
 * @desc    Check in for attendance with code
 * @access  Private (students only)
 */
router.post('/checkin', authenticateToken, AttendanceController.checkInWithCode);

/**
 * @route   POST /api/attendance/verify-code
 * @desc    Verify attendance code
 * @access  Private (authenticated users)
 */
router.post('/verify-code', authenticateToken, AttendanceController.verifyAttendanceCode);

module.exports = router;
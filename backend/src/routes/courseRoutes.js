const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

/**
 * Course Routes
 * Handles all course-related endpoints
 */

// @route   POST /api/courses
// @desc    Create a new course
// @access  Teacher, Admin
router.post('/', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  CourseController.createCourse
);

// @route   GET /api/courses
// @desc    Get all courses (filtered by role)
// @access  Authenticated users
router.get('/', 
  authenticateToken, 
  CourseController.getAllCourses
);

// @route   GET /api/courses/notifications
// @desc    Get teacher notifications about new enrollments
// @access  Teacher
router.get('/notifications', 
  authenticateToken, 
  requireRole(['teacher']), 
  CourseController.getTeacherNotifications
);

// @route   GET /api/courses/student/enrolled
// @desc    Get student's enrolled courses
// @access  Student
router.get('/student/enrolled', 
  authenticateToken, 
  requireRole(['student']), 
  CourseController.getStudentCourses
);

// @route   GET /api/courses/teacher/my-courses
// @desc    Get teacher's courses
// @access  Teacher
router.get('/teacher/my-courses', 
  authenticateToken, 
  requireRole(['teacher']), 
  CourseController.getTeacherCourses
);

// @route   GET /api/courses/:id
// @desc    Get course by ID with enrolled students
// @access  Teacher (own courses), Admin, Student (enrolled)
router.get('/:id', 
  authenticateToken, 
  CourseController.getCourseById
);

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Teacher (own courses), Admin
router.put('/:id', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  CourseController.updateCourse
);

// @route   POST /api/courses/:courseId/enroll
// @desc    Enroll student in a course
// @access  Student
router.post('/:courseId/enroll', 
  authenticateToken, 
  requireRole(['student']), 
  CourseController.enrollInCourse
);

// @route   POST /api/courses/:courseId/sessions/:sessionId/attendance
// @desc    Mark attendance for course session
// @access  Teacher (own courses)
router.post('/:courseId/sessions/:sessionId/attendance', 
  authenticateToken, 
  requireRole(['teacher']), 
  CourseController.markAttendance
);

// @route   GET /api/courses/:courseId/attendance
// @desc    Get course attendance report
// @access  Teacher (own courses), Admin
router.get('/:courseId/attendance', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  CourseController.getCourseAttendance
);

// @route   GET /api/courses/:courseId/students
// @desc    Get students enrolled in a course
// @access  Teacher (own courses), Admin
router.get('/:courseId/students', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  CourseController.getCourseStudents
);

// @route   GET /api/courses/:courseId/sessions
// @desc    Get sessions for a specific course
// @access  Teacher (own courses), Student (enrolled), Admin
router.get('/:courseId/sessions', 
  authenticateToken, 
  CourseController.getCourseSessions
);

// @route   PATCH /api/courses/notifications/:notificationId/read
// @desc    Mark a notification as read
// @access  Teacher
router.patch('/notifications/:notificationId/read', 
  authenticateToken, 
  requireRole(['teacher']), 
  CourseController.markNotificationAsRead
);

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Admin
router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin']), 
  CourseController.deleteCourse
);

// @route   GET /api/courses/:courseId/attendance-stats
// @desc    Get course attendance statistics
// @access  Teacher (own courses), Admin
router.get('/:courseId/attendance-stats', 
  authenticateToken, 
  requireRole(['teacher', 'admin']), 
  CourseController.getCourseAttendanceStats
);

module.exports = router;
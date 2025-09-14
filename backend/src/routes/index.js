const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const sessionRoutes = require('./sessionRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const courseRoutes = require('./courseRoutes');

/**
 * Main API Routes
 * Centralizes all route definitions
 */

// Authentication routes
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);

// Session management routes
router.use('/sessions', sessionRoutes);

// Course management routes
router.use('/courses', courseRoutes);

// Attendance management routes
router.use('/attendance', attendanceRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Online Teaching ERP API',
    version: '1.0.0',
    documentation: {
      auth: {
        'POST /auth/register': 'Register a new user',
        'POST /auth/login': 'Login user',
        'GET /auth/profile': 'Get current user profile',
        'GET /auth/verify': 'Verify token validity'
      },
      users: {
        'GET /users': 'Get all users (admin only)',
        'GET /users/stats': 'Get user statistics (admin only)',
        'GET /users/:id': 'Get user by ID (admin only)',
        'PUT /users/:id': 'Update user (admin only)',
        'DELETE /users/:id': 'Delete user (admin only)'
      },
      sessions: {
        'GET /sessions': 'Get sessions (role-based filtering)',
        'POST /sessions': 'Create session (teacher/admin only)',
        'GET /sessions/:id': 'Get session by ID',
        'PUT /sessions/:id': 'Update session (teacher/admin only)',
        'DELETE /sessions/:id': 'Delete session (teacher/admin only)',
        'POST /sessions/:id/join': 'Join session (student only)'
      },
      courses: {
        'GET /courses': 'Get courses (available for students, own for teachers)',
        'POST /courses': 'Create course (teacher/admin only)',
        'GET /courses/:id': 'Get course with enrolled students',
        'PUT /courses/:id': 'Update course (teacher/admin only)',
        'POST /courses/:courseId/enroll': 'Enroll in course (student only)',
        'GET /courses/student/enrolled': 'Get student enrolled courses',
        'POST /courses/:courseId/sessions/:sessionId/attendance': 'Mark attendance (teacher only)',
        'GET /courses/:courseId/attendance': 'Get course attendance report (teacher/admin only)'
      },
      attendance: {
        'GET /attendance/session/:sessionId': 'Get session attendance (teacher/admin only)',
        'GET /attendance/student/:studentId?': 'Get student attendance',
        'GET /attendance/stats': 'Get attendance statistics (admin only)',
        'GET /attendance/teacher/:teacherId?': 'Get teacher attendance report',
        'PUT /attendance/:attendanceId/status': 'Update attendance status (teacher/admin only)'
      }
    },
    authentication: 'Include "Authorization: Bearer <token>" header for protected routes',
    roles: ['admin', 'teacher', 'student']
  });
});

module.exports = router;
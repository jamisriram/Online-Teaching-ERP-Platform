const Attendance = require('../models/Attendance');

/**
 * Attendance Controller
 * Handles attendance tracking and reporting
 */
class AttendanceController {
  /**
   * Mark attendance for a student in a session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async markAttendance(req, res) {
    try {
      const { sessionId, studentId, status = 'present' } = req.body;

      // Validate required fields
      if (!sessionId || !studentId) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Session ID and Student ID are required'
        });
      }

      // Validate status
      const validStatuses = ['present', 'absent', 'late'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be one of: present, absent, late'
        });
      }

      const attendance = await Attendance.markAttendance(sessionId, studentId, status);

      res.status(201).json({
        message: 'Attendance marked successfully',
        attendance
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({
        error: 'Failed to mark attendance',
        message: 'An error occurred while marking attendance'
      });
    }
  }

  /**
   * Get attendance for a specific session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSessionAttendance(req, res) {
    try {
      const { sessionId } = req.params;
      
      const attendance = await Attendance.findBySessionId(sessionId);
      
      res.json({
        message: 'Session attendance retrieved successfully',
        sessionId,
        attendance,
        totalAttendees: attendance.length
      });
    } catch (error) {
      console.error('Get session attendance error:', error);
      res.status(500).json({
        error: 'Failed to fetch session attendance',
        message: 'An error occurred while fetching session attendance'
      });
    }
  }

  /**
   * Get attendance history for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getStudentAttendance(req, res) {
    try {
      let studentId;
      
      // Students can only view their own attendance, admins can view any student's
      if (req.user.role === 'student') {
        studentId = req.user.userId;
      } else if (req.user.role === 'admin' && req.params.studentId) {
        studentId = req.params.studentId;
      } else {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Student ID is required for admin users'
        });
      }

      const attendance = await Attendance.findByStudentId(studentId);
      
      res.json({
        message: 'Student attendance retrieved successfully',
        studentId,
        attendance,
        totalSessions: attendance.length
      });
    } catch (error) {
      console.error('Get student attendance error:', error);
      res.status(500).json({
        error: 'Failed to fetch student attendance',
        message: 'An error occurred while fetching student attendance'
      });
    }
  }

  /**
   * Get attendance statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAttendanceStats(req, res) {
    try {
      const stats = await Attendance.getStats();
      
      res.json({
        message: 'Attendance statistics retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Get attendance stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch attendance statistics',
        message: 'An error occurred while fetching attendance statistics'
      });
    }
  }

  /**
   * Update attendance status (admin/teacher only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateAttendanceStatus(req, res) {
    try {
      const { attendanceId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['present', 'absent', 'late'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be one of: present, absent, late'
        });
      }

      const updatedAttendance = await Attendance.updateStatus(attendanceId, status);

      if (!updatedAttendance) {
        return res.status(404).json({
          error: 'Attendance record not found',
          message: 'Attendance record with the specified ID does not exist'
        });
      }

      res.json({
        message: 'Attendance status updated successfully',
        attendance: updatedAttendance
      });
    } catch (error) {
      console.error('Update attendance status error:', error);
      res.status(500).json({
        error: 'Failed to update attendance status',
        message: 'An error occurred while updating attendance status'
      });
    }
  }

  /**
   * Get attendance report for teacher's sessions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getTeacherAttendanceReport(req, res) {
    try {
      let teacherId;
      
      // Teachers can only view their own sessions, admins can view any teacher's
      if (req.user.role === 'teacher') {
        teacherId = req.user.userId;
      } else if (req.user.role === 'admin' && req.params.teacherId) {
        teacherId = req.params.teacherId;
      } else {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Teacher ID is required for admin users'
        });
      }

      const report = await Attendance.getTeacherReport(teacherId);
      
      res.json({
        message: 'Teacher attendance report retrieved successfully',
        teacherId,
        report
      });
    } catch (error) {
      console.error('Get teacher attendance report error:', error);
      res.status(500).json({
        error: 'Failed to fetch teacher attendance report',
        message: 'An error occurred while fetching teacher attendance report'
      });
    }
  }

  /**
   * Check in for attendance with code (students)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async checkInWithCode(req, res) {
    try {
      const { sessionId, attendanceCode } = req.body;
      const studentId = req.user.userId;

      if (!sessionId || !attendanceCode) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Session ID and attendance code are required'
        });
      }

      // Verify the session exists and the attendance code matches
      const Session = require('../models/Session');
      const session = await Session.findById(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'The specified session does not exist'
        });
      }

      if (!session.is_live) {
        return res.status(400).json({
          error: 'Session not live',
          message: 'This session is not currently accepting attendance'
        });
      }

      if (session.attendance_code !== attendanceCode) {
        return res.status(400).json({
          error: 'Invalid attendance code',
          message: 'The attendance code provided is incorrect'
        });
      }

      // Mark attendance as present
      const attendance = await Attendance.markAttendance(sessionId, studentId, 'present');

      res.status(201).json({
        message: 'Successfully checked in',
        attendance,
        session: {
          id: session.id,
          title: session.title,
          meeting_link: session.meeting_link
        }
      });
    } catch (error) {
      console.error('Check in with code error:', error);
      res.status(500).json({
        error: 'Failed to check in',
        message: 'An error occurred while checking in'
      });
    }
  }

  /**
   * Verify attendance code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async verifyAttendanceCode(req, res) {
    try {
      const { attendanceCode } = req.body;

      if (!attendanceCode) {
        return res.status(400).json({
          error: 'Missing attendance code',
          message: 'Attendance code is required'
        });
      }

      const Session = require('../models/Session');
      const session = await Session.findByAttendanceCode(attendanceCode);

      if (!session) {
        return res.status(404).json({
          error: 'Invalid code',
          message: 'No active session found with this attendance code'
        });
      }

      res.json({
        message: 'Attendance code verified',
        valid: true,
        session: {
          id: session.id,
          title: session.title,
          description: session.description,
          date_time: session.date_time,
          teacher_name: session.teacher_name
        }
      });
    } catch (error) {
      console.error('Verify attendance code error:', error);
      res.status(500).json({
        error: 'Failed to verify code',
        message: 'An error occurred while verifying the attendance code'
      });
    }
  }
}

module.exports = AttendanceController;
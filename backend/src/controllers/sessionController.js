const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const db = require('../config/database');

/**
 * Session Controller
 * Handles session management operations
 */
class SessionController {
  /**
   * Create a new session (teacher/admin)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createSession(req, res) {
    try {
      const { title, description, date_time, meeting_link, recording_link } = req.body;
      
      // Validate required fields
      if (!title || !description || !date_time || !meeting_link) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Title, description, date_time, and meeting_link are required'
        });
      }

      // For teachers, use their own ID; for admins, allow specifying teacher_id
      let teacherId = req.user.userId;
      if (req.user.role === 'admin' && req.body.teacher_id) {
        teacherId = req.body.teacher_id;
      }

      const sessionData = {
        title,
        description,
        date_time,
        meeting_link,
        recording_link: recording_link || null,
        teacher_id: teacherId
      };

      const newSession = await Session.create(sessionData);

      res.status(201).json({
        message: 'Session created successfully',
        session: newSession
      });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({
        error: 'Failed to create session',
        message: 'An error occurred while creating the session'
      });
    }
  }

  /**
   * Get all sessions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllSessions(req, res) {
    try {
      let sessions;
      
      // Role-based access
      if (req.user.role === 'admin') {
        sessions = await Session.findAll();
      } else if (req.user.role === 'teacher') {
        sessions = await Session.findByTeacherId(req.user.userId);
      } else {
        // Students see all upcoming sessions
        sessions = await Session.findUpcoming();
      }

      res.json({
        message: 'Sessions retrieved successfully',
        sessions,
        count: sessions.length
      });
    } catch (error) {
      console.error('Get all sessions error:', error);
      res.status(500).json({
        error: 'Failed to fetch sessions',
        message: 'An error occurred while fetching sessions'
      });
    }
  }

  /**
   * Get session by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSessionById(req, res) {
    try {
      const { id } = req.params;
      const session = await Session.findById(id);

      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Session with the specified ID does not exist'
        });
      }

      // Check access permissions
      if (req.user.role === 'teacher' && session.teacher_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own sessions'
        });
      }

      res.json({
        session
      });
    } catch (error) {
      console.error('Get session by ID error:', error);
      res.status(500).json({
        error: 'Failed to fetch session',
        message: 'An error occurred while fetching the session'
      });
    }
  }

  /**
   * Update session (teacher/admin)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateSession(req, res) {
    try {
      const { id } = req.params;
      const { title, description, date_time, meeting_link, recording_link } = req.body;

      // Check if session exists
      const existingSession = await Session.findById(id);
      if (!existingSession) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Session with the specified ID does not exist'
        });
      }

      // Check permissions
      if (req.user.role === 'teacher' && existingSession.teacher_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own sessions'
        });
      }

      // Prepare update data
      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (date_time) updateData.date_time = date_time;
      if (meeting_link) updateData.meeting_link = meeting_link;
      if (recording_link !== undefined) updateData.recording_link = recording_link;

      const updatedSession = await Session.update(id, updateData);

      res.json({
        message: 'Session updated successfully',
        session: updatedSession
      });
    } catch (error) {
      console.error('Update session error:', error);
      res.status(500).json({
        error: 'Failed to update session',
        message: 'An error occurred while updating the session'
      });
    }
  }

  /**
   * Delete session (teacher/admin)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteSession(req, res) {
    try {
      const { id } = req.params;

      // Check if session exists
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Session with the specified ID does not exist'
        });
      }

      // Check permissions
      if (req.user.role === 'teacher' && session.teacher_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own sessions'
        });
      }

      await Session.delete(id);

      res.json({
        message: 'Session deleted successfully'
      });
    } catch (error) {
      console.error('Delete session error:', error);
      res.status(500).json({
        error: 'Failed to delete session',
        message: 'An error occurred while deleting the session'
      });
    }
  }

  /**
   * Join session (student)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async joinSession(req, res) {
    try {
      const { id } = req.params;
      const studentId = req.user.userId;

      // Check if session exists
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Session with the specified ID does not exist'
        });
      }

      // Check if session is upcoming or ongoing
      const sessionDate = new Date(session.date_time);
      const currentDate = new Date();
      const timeDifference = sessionDate - currentDate;
      
      // Allow joining 15 minutes before and 2 hours after session start
      if (timeDifference < -15 * 60 * 1000 || timeDifference > 2 * 60 * 60 * 1000) {
        return res.status(400).json({
          error: 'Session not available',
          message: 'You can only join sessions that are starting soon or currently ongoing'
        });
      }

      // Record attendance
      await Attendance.markAttendance(id, studentId);

      res.json({
        message: 'Successfully joined session',
        session: {
          id: session.id,
          title: session.title,
          meeting_link: session.meeting_link
        },
        redirect_url: session.meeting_link
      });
    } catch (error) {
      console.error('Join session error:', error);
      res.status(500).json({
        error: 'Failed to join session',
        message: 'An error occurred while joining the session'
      });
    }
  }

  /**
   * Start live session with attendance code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async startLiveSession(req, res) {
    try {
      const { id } = req.params;
      const { attendanceCode } = req.body;

      if (!attendanceCode) {
        return res.status(400).json({
          error: 'Missing attendance code',
          message: 'Attendance code is required to start live session'
        });
      }

      // Verify session ownership for teachers
      if (req.user.role === 'teacher') {
        const session = await Session.findById(id);
        if (!session || session.teacher_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only start your own sessions'
          });
        }
      }

      const updatedSession = await Session.startLiveSession(id, attendanceCode);
      
      res.json({
        message: 'Live session started successfully',
        session: updatedSession,
        attendanceCode
      });
    } catch (error) {
      console.error('Start live session error:', error);
      res.status(500).json({
        error: 'Failed to start live session',
        message: 'An error occurred while starting the live session'
      });
    }
  }

  /**
   * End live session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async endLiveSession(req, res) {
    try {
      const { id } = req.params;

      // Verify session ownership for teachers
      if (req.user.role === 'teacher') {
        const session = await Session.findById(id);
        if (!session || session.teacher_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You can only end your own sessions'
          });
        }
      }

      const updatedSession = await Session.endLiveSession(id);
      
      res.json({
        message: 'Live session ended successfully',
        session: updatedSession
      });
    } catch (error) {
      console.error('End live session error:', error);
      res.status(500).json({
        error: 'Failed to end live session',
        message: 'An error occurred while ending the live session'
      });
    }
  }

  /**
   * Get live sessions for teacher
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getLiveSessions(req, res) {
    try {
      let liveSessions;

      if (req.user.role === 'admin') {
        // Admins can see all live sessions
        const query = `
          SELECT s.*, u.name as teacher_name, u.email as teacher_email
          FROM sessions s
          LEFT JOIN users u ON s.teacher_id = u.id
          WHERE s.is_live = true
          ORDER BY s.date_time DESC
        `;
        const result = await db.query(query);
        liveSessions = result.rows;
      } else {
        // Teachers see only their live sessions
        liveSessions = await Session.findLiveByTeacherId(req.user.userId);
      }

      res.json({
        message: 'Live sessions retrieved successfully',
        sessions: liveSessions,
        count: liveSessions.length
      });
    } catch (error) {
      console.error('Get live sessions error:', error);
      res.status(500).json({
        error: 'Failed to fetch live sessions',
        message: 'An error occurred while fetching live sessions'
      });
    }
  }
}

module.exports = SessionController;
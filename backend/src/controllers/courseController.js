const Course = require('../models/Course');
const db = require('../config/database');

/**
 * Course Controller
 * Handles course management and enrollment operations
 */
class CourseController {
  /**
   * Create a new course (teacher/admin)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createCourse(req, res) {
    try {
      const { title, description, course_code, max_students, start_date, end_date } = req.body;
      
      // Validate required fields
      if (!title || !course_code) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Title and course code are required'
        });
      }

      // For teachers, use their own ID; for admins, allow specifying teacher_id
      let teacherId = req.user.userId;
      if (req.user.role === 'admin' && req.body.teacher_id) {
        teacherId = req.body.teacher_id;
      }

      const courseData = {
        title,
        description,
        course_code,
        teacher_id: teacherId,
        max_students: max_students || 50,
        start_date,
        end_date
      };

      const newCourse = await Course.create(courseData);

      res.status(201).json({
        message: 'Course created successfully',
        course: newCourse
      });
    } catch (error) {
      console.error('Create course error:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          error: 'Course code already exists',
          message: 'Please choose a different course code'
        });
      }
      
      res.status(500).json({
        error: 'Failed to create course',
        message: 'An error occurred while creating the course'
      });
    }
  }

  /**
   * Get all courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllCourses(req, res) {
    try {
      let courses;
      
      if (req.user.role === 'admin') {
        courses = await Course.findAll();
      } else if (req.user.role === 'teacher') {
        courses = await Course.findByTeacherId(req.user.userId);
      } else {
        // Students see available courses (not enrolled in)
        courses = await Course.findAvailableForStudent(req.user.userId);
      }

      res.json({
        message: 'Courses retrieved successfully',
        courses,
        count: courses.length
      });
    } catch (error) {
      console.error('Get all courses error:', error);
      res.status(500).json({
        error: 'Failed to fetch courses',
        message: 'An error occurred while fetching courses'
      });
    }
  }

  /**
   * Get course by ID with enrolled students (for teachers)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCourseById(req, res) {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);

      if (!course) {
        return res.status(404).json({
          error: 'Course not found',
          message: 'Course with the specified ID does not exist'
        });
      }

      // Check access permissions
      if (req.user.role === 'teacher' && course.teacher_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own courses'
        });
      }

      // Get enrolled students if teacher or admin
      let enrolledStudents = [];
      if (req.user.role === 'teacher' || req.user.role === 'admin') {
        enrolledStudents = await Course.getEnrolledStudents(id);
      }

      res.json({
        course,
        enrolledStudents
      });
    } catch (error) {
      console.error('Get course by ID error:', error);
      res.status(500).json({
        error: 'Failed to fetch course',
        message: 'An error occurred while fetching the course'
      });
    }
  }

  /**
   * Enroll student in a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async enrollInCourse(req, res) {
    try {
      const { courseId } = req.params;
      const studentId = req.user.userId;

      // Only students can enroll themselves
      if (req.user.role !== 'student') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only students can enroll in courses'
        });
      }

      const enrollment = await Course.enrollStudent(studentId, courseId);

      res.status(201).json({
        message: 'Successfully enrolled in course',
        enrollment
      });
    } catch (error) {
      console.error('Enroll in course error:', error);
      
      if (error.message.includes('already enrolled')) {
        return res.status(400).json({
          error: 'Already enrolled',
          message: error.message
        });
      }
      
      if (error.message.includes('full') || error.message.includes('not found')) {
        return res.status(400).json({
          error: 'Enrollment failed',
          message: error.message
        });
      }
      
      res.status(500).json({
        error: 'Failed to enroll',
        message: 'An error occurred while enrolling in the course'
      });
    }
  }

  /**
   * Get student's enrolled courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getStudentCourses(req, res) {
    try {
      const studentId = req.user.userId;
      const courses = await Course.getStudentCourses(studentId);

      res.json({
        message: 'Student courses retrieved successfully',
        courses,
        count: courses.length
      });
    } catch (error) {
      console.error('Get student courses error:', error);
      res.status(500).json({
        error: 'Failed to fetch courses',
        message: 'An error occurred while fetching student courses'
      });
    }
  }

  /**
   * Mark attendance for students in a course session (teacher only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async markAttendance(req, res) {
    try {
      const { courseId, sessionId } = req.params;
      const { attendanceData } = req.body; // Array of {studentId, status}
      const teacherId = req.user.userId;

      // Verify teacher owns the course
      const course = await Course.findById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only mark attendance for your own courses'
        });
      }

      const client = await db.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete existing attendance for this session
        await client.query(
          'DELETE FROM attendance WHERE session_id = $1 AND course_id = $2',
          [sessionId, courseId]
        );
        
        // Insert new attendance records
        for (const { studentId, status } of attendanceData) {
          if (status === 'present') {
            await client.query(
              `INSERT INTO attendance (session_id, student_id, course_id, status, marked_by, marked_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [sessionId, studentId, courseId, 'present', teacherId]
            );
            
            // Create notification for student
            await client.query(
              `INSERT INTO notifications (user_id, type, title, message, data)
               VALUES ($1, 'attendance', $2, $3, $4)`,
              [studentId, 'Attendance Marked', 
               `Your attendance has been marked as present for ${course.title}`,
               JSON.stringify({ courseId, sessionId, status: 'present' })]
            );
          }
        }
        
        await client.query('COMMIT');
        
        res.json({
          message: 'Attendance marked successfully',
          markedCount: attendanceData.filter(a => a.status === 'present').length
        });
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({
        error: 'Failed to mark attendance',
        message: 'An error occurred while marking attendance'
      });
    }
  }

  /**
   * Get course attendance report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCourseAttendance(req, res) {
    try {
      const { courseId } = req.params;
      const teacherId = req.user.userId;

      // Verify teacher owns the course
      const course = await Course.findById(courseId);
      if (!course || course.teacher_id !== teacherId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view attendance for your own courses'
        });
      }

      const query = `
        SELECT s.id as session_id, s.title as session_title, s.date_time,
               u.id as student_id, u.name as student_name, u.email,
               a.status, a.marked_at
        FROM sessions s
        CROSS JOIN enrollments e
        JOIN users u ON e.student_id = u.id
        LEFT JOIN attendance a ON s.id = a.session_id AND u.id = a.student_id
        WHERE s.course_id = $1 AND e.course_id = $1 AND e.status = 'active'
        ORDER BY s.date_time DESC, u.name
      `;
      
      const result = await db.query(query, [courseId]);
      
      res.json({
        message: 'Course attendance retrieved successfully',
        course: course,
        attendance: result.rows
      });
      
    } catch (error) {
      console.error('Get course attendance error:', error);
      res.status(500).json({
        error: 'Failed to fetch attendance',
        message: 'An error occurred while fetching course attendance'
      });
    }
  }

  /**
   * Update course (teacher/admin)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const { title, description, max_students, start_date, end_date } = req.body;

      // Check if course exists
      const existingCourse = await Course.findById(id);
      if (!existingCourse) {
        return res.status(404).json({
          error: 'Course not found',
          message: 'Course with the specified ID does not exist'
        });
      }

      // Check permissions
      if (req.user.role === 'teacher' && existingCourse.teacher_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own courses'
        });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (max_students) updateData.max_students = max_students;
      if (start_date) updateData.start_date = start_date;
      if (end_date) updateData.end_date = end_date;

      const updatedCourse = await Course.update(id, updateData);

      res.json({
        message: 'Course updated successfully',
        course: updatedCourse
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        error: 'Failed to update course',
        message: 'An error occurred while updating the course'
      });
    }
  }

  /**
   * Get teacher's courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getTeacherCourses(req, res) {
    try {
      const teacherId = req.user.userId;
      
      const query = `
        SELECT 
          c.*,
          u.name as teacher_name,
          COUNT(DISTINCT e.id) as enrolled_students
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
        WHERE c.teacher_id = $1
        GROUP BY c.id, u.name
        ORDER BY c.created_at DESC
      `;
      
      const result = await db.query(query, [teacherId]);
      
      res.json({
        message: 'Teacher courses retrieved successfully',
        courses: result.rows
      });
    } catch (error) {
      console.error('Get teacher courses error:', error);
      res.status(500).json({
        error: 'Failed to fetch teacher courses',
        message: 'An error occurred while fetching courses'
      });
    }
  }

  /**
   * Get students enrolled in a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCourseStudents(req, res) {
    try {
      const { courseId } = req.params;
      
      // Check if course exists and user has permission
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          error: 'Course not found',
          message: 'Course with the specified ID does not exist'
        });
      }

      if (req.user.role === 'teacher' && course.teacher_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view students from your own courses'
        });
      }

      const query = `
        SELECT 
          u.id as user_id,
          u.name as full_name,
          u.email,
          e.enrollment_date,
          e.status as enrollment_status
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.course_id = $1
        ORDER BY e.enrollment_date DESC
      `;
      
      const result = await db.query(query, [courseId]);
      
      res.json({
        message: 'Course students retrieved successfully',
        students: result.rows
      });
    } catch (error) {
      console.error('Get course students error:', error);
      res.status(500).json({
        error: 'Failed to fetch course students',
        message: 'An error occurred while fetching students'
      });
    }
  }

  /**
   * Get sessions for a specific course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCourseSessions(req, res) {
    try {
      const { courseId } = req.params;
      
      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          error: 'Course not found',
          message: 'Course with the specified ID does not exist'
        });
      }

      // Check permissions
      if (req.user.role === 'teacher' && course.teacher_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view sessions from your own courses'
        });
      }

      if (req.user.role === 'student') {
        // Check if student is enrolled
        const enrollmentQuery = 'SELECT * FROM enrollments WHERE course_id = $1 AND student_id = $2 AND status = $3';
        const enrollmentResult = await db.query(enrollmentQuery, [courseId, req.user.userId, 'active']);
        
        if (enrollmentResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You must be enrolled in this course to view sessions'
          });
        }
      }

      const query = `
        SELECT 
          s.*,
          u.name as teacher_name,
          (
            SELECT json_agg(
              json_build_object(
                'student_id', a.student_id,
                'status', a.status,
                'timestamp', a.timestamp
              )
            )
            FROM attendance a 
            WHERE a.session_id = s.id
          ) as attendance
        FROM sessions s
        LEFT JOIN users u ON s.teacher_id = u.id
        WHERE s.id IN (
          SELECT DISTINCT session_id 
          FROM course_sessions 
          WHERE course_id = $1
        )
        ORDER BY s.scheduled_start_time DESC
      `;
      
      const result = await db.query(query, [courseId]);
      
      res.json({
        message: 'Course sessions retrieved successfully',
        sessions: result.rows
      });
    } catch (error) {
      console.error('Get course sessions error:', error);
      res.status(500).json({
        error: 'Failed to fetch course sessions',
        message: 'An error occurred while fetching sessions'
      });
    }
  }

  /**
   * Get teacher notifications about new enrollments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getTeacherNotifications(req, res) {
    try {
      const teacherId = req.user.userId;
      
      const query = `
        SELECT 
          n.*,
          c.title as course_title,
          u.name as student_name
        FROM notifications n
        LEFT JOIN courses c ON n.course_id = c.id
        LEFT JOIN users u ON n.student_id = u.id
        WHERE n.teacher_id = $1 AND n.is_read = false
        ORDER BY n.created_at DESC
        LIMIT 20
      `;
      
      const result = await db.query(query, [teacherId]);
      
      res.json({
        message: 'Teacher notifications retrieved successfully',
        notifications: result.rows
      });
    } catch (error) {
      console.error('Get teacher notifications error:', error);
      res.status(500).json({
        error: 'Failed to fetch notifications',
        message: 'An error occurred while fetching notifications'
      });
    }
  }

  /**
   * Mark a notification as read
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const teacherId = req.user.userId;
      
      const query = `
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE id = $1 AND teacher_id = $2
        RETURNING *
      `;
      
      const result = await db.query(query, [notificationId, teacherId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Notification not found',
          message: 'Notification not found or you do not have permission to modify it'
        });
      }
      
      res.json({
        message: 'Notification marked as read',
        notification: result.rows[0]
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read',
        message: 'An error occurred while updating the notification'
      });
    }
  }

  /**
   * Delete a course (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({
          error: 'Course not found',
          message: 'Course with the specified ID does not exist'
        });
      }

      // Check if there are enrollments
      const enrollmentQuery = 'SELECT COUNT(*) FROM enrollments WHERE course_id = $1';
      const enrollmentResult = await db.query(enrollmentQuery, [id]);
      const enrollmentCount = parseInt(enrollmentResult.rows[0].count);

      if (enrollmentCount > 0) {
        return res.status(400).json({
          error: 'Cannot delete course',
          message: 'Course has active enrollments and cannot be deleted'
        });
      }

      await Course.delete(id);
      
      res.json({
        message: 'Course deleted successfully'
      });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({
        error: 'Failed to delete course',
        message: 'An error occurred while deleting the course'
      });
    }
  }

  /**
   * Get course attendance statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCourseAttendanceStats(req, res) {
    try {
      const { courseId } = req.params;
      
      // Check if course exists and user has permission
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          error: 'Course not found',
          message: 'Course with the specified ID does not exist'
        });
      }

      if (req.user.role === 'teacher' && course.teacher_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view statistics from your own courses'
        });
      }

      const statsQuery = `
        SELECT 
          COUNT(DISTINCT e.student_id) as total_students,
          COUNT(DISTINCT s.id) as total_sessions,
          COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) as total_attendance,
          ROUND(
            (COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)::float / 
             NULLIF(COUNT(DISTINCT e.student_id) * COUNT(DISTINCT s.id), 0)) * 100, 2
          ) as overall_attendance_rate
        FROM enrollments e
        CROSS JOIN sessions s
        LEFT JOIN attendance a ON e.student_id = a.student_id AND s.id = a.session_id
        WHERE e.course_id = $1 AND e.status = 'active'
          AND s.id IN (SELECT session_id FROM course_sessions WHERE course_id = $1)
      `;
      
      const result = await db.query(statsQuery, [courseId]);
      
      res.json({
        message: 'Course attendance statistics retrieved successfully',
        stats: result.rows[0]
      });
    } catch (error) {
      console.error('Get course attendance stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch attendance statistics',
        message: 'An error occurred while fetching statistics'
      });
    }
  }
}

module.exports = CourseController;
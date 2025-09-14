const db = require('../config/database');

/**
 * Course Model
 * Handles all database operations related to courses and enrollments
 */
class Course {
  /**
   * Create a new course
   * @param {Object} courseData - Course data object
   * @returns {Object} Created course object
   */
  static async create(courseData) {
    const { title, description, course_code, teacher_id, max_students, start_date, end_date } = courseData;
    
    const query = `
      INSERT INTO courses (title, description, course_code, teacher_id, max_students, start_date, end_date, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [title, description, course_code, teacher_id, max_students, start_date, end_date];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find course by ID with teacher info
   * @param {number} id - Course ID
   * @returns {Object|null} Course object or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT c.*, u.name as teacher_name, u.email as teacher_email,
             COUNT(e.id) as enrolled_students
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.id = $1
      GROUP BY c.id, u.name, u.email
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all courses with enrollment count
   * @returns {Array} Array of course objects
   */
  static async findAll() {
    const query = `
      SELECT c.*, u.name as teacher_name, u.email as teacher_email,
             COUNT(e.id) as enrolled_students
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.is_active = true
      GROUP BY c.id, u.name, u.email
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Find courses by teacher ID
   * @param {number} teacherId - Teacher ID
   * @returns {Array} Array of course objects
   */
  static async findByTeacherId(teacherId) {
    const query = `
      SELECT c.*, COUNT(e.id) as enrolled_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.teacher_id = $1 AND c.is_active = true
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }

  /**
   * Find available courses for students (not enrolled)
   * @param {number} studentId - Student ID
   * @returns {Array} Array of available course objects
   */
  static async findAvailableForStudent(studentId) {
    const query = `
      SELECT c.*, u.name as teacher_name, 
             COUNT(e.id) as enrolled_students
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.is_active = true 
      AND c.id NOT IN (
        SELECT course_id FROM enrollments 
        WHERE student_id = $1 AND status = 'active'
      )
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [studentId]);
    return result.rows;
  }

  /**
   * Enroll student in a course
   * @param {number} studentId - Student ID
   * @param {number} courseId - Course ID
   * @returns {Object} Enrollment object
   */
  static async enrollStudent(studentId, courseId) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if already enrolled
      const existingEnrollment = await client.query(
        'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );
      
      if (existingEnrollment.rows.length > 0) {
        throw new Error('Student already enrolled in this course');
      }
      
      // Check course capacity
      const courseCheck = await client.query(
        `SELECT c.max_students, COUNT(e.id) as current_enrolled
         FROM courses c
         LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
         WHERE c.id = $1
         GROUP BY c.id, c.max_students`,
        [courseId]
      );
      
      if (courseCheck.rows.length === 0) {
        throw new Error('Course not found');
      }
      
      const { max_students, current_enrolled } = courseCheck.rows[0];
      if (current_enrolled >= max_students) {
        throw new Error('Course is full');
      }
      
      // Create enrollment
      const enrollmentResult = await client.query(
        `INSERT INTO enrollments (student_id, course_id, enrollment_date)
         VALUES ($1, $2, NOW())
         RETURNING *`,
        [studentId, courseId]
      );
      
      // Get course and student info for notification
      const notificationData = await client.query(
        `SELECT c.title as course_title, c.teacher_id, s.name as student_name, s.email as student_email
         FROM courses c, users s
         WHERE c.id = $1 AND s.id = $2`,
        [courseId, studentId]
      );
      
      const { course_title, teacher_id, student_name, student_email } = notificationData.rows[0];
      
      // Create notification for teacher
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, 'enrollment', $2, $3, $4)`,
        [teacher_id, 'New Student Enrollment', 
         `${student_name} has enrolled in your course: ${course_title}`,
         JSON.stringify({ studentId, courseId, student_name, student_email })]
      );
      
      await client.query('COMMIT');
      return enrollmentResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get enrolled students for a course
   * @param {number} courseId - Course ID
   * @returns {Array} Array of enrolled students
   */
  static async getEnrolledStudents(courseId) {
    const query = `
      SELECT u.id, u.name, u.email, e.enrollment_date, e.status,
             COUNT(a.id) as sessions_attended
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN attendance a ON a.student_id = u.id AND a.course_id = e.course_id
      WHERE e.course_id = $1 AND e.status = 'active'
      GROUP BY u.id, u.name, u.email, e.enrollment_date, e.status
      ORDER BY e.enrollment_date DESC
    `;
    const result = await db.query(query, [courseId]);
    return result.rows;
  }

  /**
   * Get courses a student is enrolled in
   * @param {number} studentId - Student ID
   * @returns {Array} Array of enrolled courses
   */
  static async getStudentCourses(studentId) {
    const query = `
      SELECT c.*, u.name as teacher_name, e.enrollment_date,
             COUNT(s.id) as total_sessions,
             COUNT(a.id) as attended_sessions
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN sessions s ON s.course_id = c.id
      LEFT JOIN attendance a ON a.student_id = e.student_id AND a.course_id = c.id
      WHERE e.student_id = $1 AND e.status = 'active'
      GROUP BY c.id, u.name, e.enrollment_date
      ORDER BY e.enrollment_date DESC
    `;
    const result = await db.query(query, [studentId]);
    return result.rows;
  }

  /**
   * Update course
   * @param {number} id - Course ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated course object
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE courses 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete course
   * @param {number} id - Course ID
   * @returns {boolean} True if course was deleted
   */
  static async delete(id) {
    const query = 'DELETE FROM courses WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }
}

module.exports = Course;
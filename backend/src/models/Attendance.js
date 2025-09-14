const db = require('../config/database');

/**
 * Attendance Model
 * Handles all database operations related to attendance
 */
class Attendance {
  /**
   * Mark attendance for a student in a session
   * @param {number} sessionId - Session ID
   * @param {number} studentId - Student ID
   * @param {string} status - Attendance status (default: 'present')
   * @returns {Object} Created attendance record
   */
  static async markAttendance(sessionId, studentId, status = 'present') {
    // Check if attendance already exists
    const existingQuery = `
      SELECT * FROM attendance 
      WHERE session_id = $1 AND student_id = $2
    `;
    const existing = await db.query(existingQuery, [sessionId, studentId]);
    
    if (existing.rows.length > 0) {
      // Update existing attendance
      const updateQuery = `
        UPDATE attendance 
        SET status = $1, timestamp = NOW(), updated_at = NOW()
        WHERE session_id = $2 AND student_id = $3
        RETURNING *
      `;
      const result = await db.query(updateQuery, [status, sessionId, studentId]);
      return result.rows[0];
    } else {
      // Create new attendance record
      const insertQuery = `
        INSERT INTO attendance (session_id, student_id, status, timestamp, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW(), NOW())
        RETURNING *
      `;
      const result = await db.query(insertQuery, [sessionId, studentId, status]);
      return result.rows[0];
    }
  }

  /**
   * Find attendance by session ID
   * @param {number} sessionId - Session ID
   * @returns {Array} Array of attendance records
   */
  static async findBySessionId(sessionId) {
    const query = `
      SELECT 
        a.*,
        u.name as student_name,
        u.email as student_email,
        s.title as session_title,
        s.date_time as session_date_time
      FROM attendance a
      LEFT JOIN users u ON a.student_id = u.id
      LEFT JOIN sessions s ON a.session_id = s.id
      WHERE a.session_id = $1
      ORDER BY a.timestamp DESC
    `;
    const result = await db.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Find attendance by student ID
   * @param {number} studentId - Student ID
   * @returns {Array} Array of attendance records
   */
  static async findByStudentId(studentId) {
    const query = `
      SELECT 
        a.*,
        s.title as session_title,
        s.description as session_description,
        s.date_time as session_date_time,
        u.name as teacher_name
      FROM attendance a
      LEFT JOIN sessions s ON a.session_id = s.id
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE a.student_id = $1
      ORDER BY s.date_time DESC
    `;
    const result = await db.query(query, [studentId]);
    return result.rows;
  }

  /**
   * Update attendance status
   * @param {number} attendanceId - Attendance ID
   * @param {string} status - New status
   * @returns {Object|null} Updated attendance record
   */
  static async updateStatus(attendanceId, status) {
    const query = `
      UPDATE attendance 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, attendanceId]);
    return result.rows[0] || null;
  }

  /**
   * Get attendance statistics
   * @returns {Object} Attendance statistics
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_attendance_records,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as total_present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as total_absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as total_late,
        COUNT(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as attendance_this_week,
        COUNT(CASE WHEN timestamp >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as attendance_this_month,
        ROUND(
          (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
        ) as attendance_rate
      FROM attendance
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Get teacher attendance report
   * @param {number} teacherId - Teacher ID
   * @returns {Object} Teacher attendance report
   */
  static async getTeacherReport(teacherId) {
    const query = `
      SELECT 
        s.id as session_id,
        s.title as session_title,
        s.date_time as session_date_time,
        COUNT(a.id) as total_attendees,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0)), 2
        ) as attendance_rate
      FROM sessions s
      LEFT JOIN attendance a ON s.id = a.session_id
      WHERE s.teacher_id = $1
      GROUP BY s.id, s.title, s.date_time
      ORDER BY s.date_time DESC
    `;
    
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }

  /**
   * Get student attendance summary
   * @param {number} studentId - Student ID
   * @returns {Object} Student attendance summary
   */
  static async getStudentSummary(studentId) {
    const query = `
      SELECT 
        COUNT(*) as total_sessions_attended,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as sessions_present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as sessions_absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as sessions_late,
        ROUND(
          (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
        ) as attendance_rate
      FROM attendance
      WHERE student_id = $1
    `;
    
    const result = await db.query(query, [studentId]);
    return result.rows[0];
  }

  /**
   * Find attendance by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of attendance records
   */
  static async findByDateRange(startDate, endDate) {
    const query = `
      SELECT 
        a.*,
        u.name as student_name,
        u.email as student_email,
        s.title as session_title,
        s.date_time as session_date_time,
        t.name as teacher_name
      FROM attendance a
      LEFT JOIN users u ON a.student_id = u.id
      LEFT JOIN sessions s ON a.session_id = s.id
      LEFT JOIN users t ON s.teacher_id = t.id
      WHERE a.timestamp BETWEEN $1 AND $2
      ORDER BY a.timestamp DESC
    `;
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Check if student attended session
   * @param {number} sessionId - Session ID
   * @param {number} studentId - Student ID
   * @returns {Object|null} Attendance record if exists
   */
  static async checkAttendance(sessionId, studentId) {
    const query = `
      SELECT * FROM attendance 
      WHERE session_id = $1 AND student_id = $2
    `;
    const result = await db.query(query, [sessionId, studentId]);
    return result.rows[0] || null;
  }

  /**
   * Delete attendance record
   * @param {number} id - Attendance ID
   * @returns {boolean} True if attendance was deleted
   */
  static async delete(id) {
    const query = 'DELETE FROM attendance WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Delete all attendance for a session
   * @param {number} sessionId - Session ID
   * @returns {boolean} True if attendance records were deleted
   */
  static async deleteBySessionId(sessionId) {
    const query = 'DELETE FROM attendance WHERE session_id = $1';
    const result = await db.query(query, [sessionId]);
    return result.rowCount > 0;
  }
}

module.exports = Attendance;
const db = require('../config/database');

/**
 * Session Model
 * Handles all database operations related to sessions
 */
class Session {
  /**
   * Create a new session
   * @param {Object} sessionData - Session data object
   * @returns {Object} Created session object
   */
  static async create(sessionData) {
    const { title, description, date_time, meeting_link, recording_link, teacher_id, attendance_code, is_live } = sessionData;
    
    const query = `
      INSERT INTO sessions (title, description, date_time, meeting_link, recording_link, teacher_id, attendance_code, is_live, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [title, description, date_time, meeting_link, recording_link, teacher_id, attendance_code || null, is_live || false];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find session by ID
   * @param {number} id - Session ID
   * @returns {Object|null} Session object or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all sessions
   * @returns {Array} Array of session objects
   */
  static async findAll() {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      ORDER BY s.date_time DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Find sessions by teacher ID
   * @param {number} teacherId - Teacher ID
   * @returns {Array} Array of session objects
   */
  static async findByTeacherId(teacherId) {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.teacher_id = $1
      ORDER BY s.date_time DESC
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }

  /**
   * Find upcoming sessions
   * @returns {Array} Array of upcoming session objects
   */
  static async findUpcoming() {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.date_time > NOW()
      ORDER BY s.date_time ASC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Find past sessions
   * @returns {Array} Array of past session objects
   */
  static async findPast() {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.date_time <= NOW()
      ORDER BY s.date_time DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Update session by ID
   * @param {number} id - Session ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated session object
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    });

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE sessions 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete session by ID
   * @param {number} id - Session ID
   * @returns {boolean} True if session was deleted
   */
  static async delete(id) {
    // First delete related attendance records
    await db.query('DELETE FROM attendance WHERE session_id = $1', [id]);
    
    // Then delete the session
    const query = 'DELETE FROM sessions WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN date_time > NOW() THEN 1 END) as upcoming_sessions,
        COUNT(CASE WHEN date_time <= NOW() THEN 1 END) as past_sessions,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as sessions_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as sessions_this_month
      FROM sessions
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Find sessions by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of session objects
   */
  static async findByDateRange(startDate, endDate) {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.date_time BETWEEN $1 AND $2
      ORDER BY s.date_time ASC
    `;
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Check if session exists
   * @param {number} id - Session ID
   * @returns {boolean} True if session exists
   */
  static async exists(id) {
    const query = 'SELECT 1 FROM sessions WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Find sessions with attendance count
   * @param {number} teacherId - Optional teacher ID filter
   * @returns {Array} Array of session objects with attendance count
   */
  static async findWithAttendanceCount(teacherId = null) {
    let query = `
      SELECT 
        s.*,
        u.name as teacher_name,
        u.email as teacher_email,
        COUNT(a.id) as attendance_count
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      LEFT JOIN attendance a ON s.id = a.session_id
    `;
    
    const values = [];
    if (teacherId) {
      query += ' WHERE s.teacher_id = $1';
      values.push(teacherId);
    }
    
    query += `
      GROUP BY s.id, u.name, u.email
      ORDER BY s.date_time DESC
    `;
    
    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Start live session with attendance code
   * @param {number} id - Session ID
   * @param {string} attendanceCode - Generated attendance code
   * @returns {Object} Updated session object
   */
  static async startLiveSession(id, attendanceCode) {
    const query = `
      UPDATE sessions 
      SET attendance_code = $1, is_live = true, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [attendanceCode, id]);
    return result.rows[0];
  }

  /**
   * End live session
   * @param {number} id - Session ID
   * @returns {Object} Updated session object
   */
  static async endLiveSession(id) {
    const query = `
      UPDATE sessions 
      SET attendance_code = NULL, is_live = false, session_ended_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Find session by attendance code
   * @param {string} attendanceCode - Attendance code
   * @returns {Object|null} Session object or null if not found
   */
  static async findByAttendanceCode(attendanceCode) {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.attendance_code = $1 AND s.is_live = true
    `;
    const result = await db.query(query, [attendanceCode]);
    return result.rows[0] || null;
  }

  /**
   * Get live sessions for a teacher
   * @param {number} teacherId - Teacher ID
   * @returns {Array} Array of live session objects
   */
  static async findLiveByTeacherId(teacherId) {
    const query = `
      SELECT s.*, u.name as teacher_name, u.email as teacher_email
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      WHERE s.teacher_id = $1 AND s.is_live = true
      ORDER BY s.date_time DESC
    `;
    const result = await db.query(query, [teacherId]);
    return result.rows;
  }
}

module.exports = Session;
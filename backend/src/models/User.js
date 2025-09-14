const db = require('../config/database');

/**
 * User Model
 * Handles all database operations related to users
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @returns {Object} Created user object
   */
  static async create(userData) {
    const { name, email, password, role } = userData;
    
    const query = `
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, email, role, created_at
    `;
    
    const values = [name, email, password, role];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null if not found
   */
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Object|null} User object or null if not found
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all users
   * @returns {Array} Array of user objects
   */
  static async findAll() {
    const query = `
      SELECT id, name, email, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Find users by role
   * @param {string} role - User role (student, teacher, admin)
   * @returns {Array} Array of user objects
   */
  static async findByRole(role) {
    const query = 'SELECT id, name, email, role, created_at FROM users WHERE role = $1 ORDER BY name ASC';
    const result = await db.query(query, [role]);
    return result.rows;
  }

  /**
   * Update user by ID
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user object
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
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, created_at, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete user by ID
   * @param {number} id - User ID
   * @returns {boolean} Success status
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get user statistics
   * @returns {Object} User statistics
   */
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
        COUNT(CASE WHEN role = 'teacher' THEN 1 END) as total_teachers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins
      FROM users
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Check if user exists
   * @param {number} id - User ID
   * @returns {boolean} Whether user exists
   */
  static async exists(id) {
    const query = 'SELECT id FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length > 0;
  }
}

module.exports = User;
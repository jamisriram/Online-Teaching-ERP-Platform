const { Pool } = require('pg');

/**
 * Database configuration and connection pool
 * Handles PostgreSQL database connections using Neon
 */

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of connections in the pool
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000, // How long to wait when connecting a new client
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Initialize database tables
 * Creates tables if they don't exist
 */
const initializeTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create sessions table
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        date_time TIMESTAMP WITH TIME ZONE NOT NULL,
        meeting_link TEXT NOT NULL,
        recording_link TEXT,
        teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create attendance table
    const createAttendanceTable = `
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(session_id, student_id)
      );
    `;

    // Execute table creation queries
    await client.query(createUsersTable);
    await client.query(createSessionsTable);
    await client.query(createAttendanceTable);

    // Create indexes for better performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_date_time ON sessions(date_time);
      CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);
    `;

    await client.query(createIndexes);

    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database table initialization failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Create default admin user if no admin exists
 */
const createDefaultAdmin = async () => {
  try {
    const client = await pool.connect();
    
    // Check if any admin exists
    const adminCheck = await client.query(
      "SELECT COUNT(*) FROM users WHERE role = 'admin'"
    );
    
    if (parseInt(adminCheck.rows[0].count) === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, $4)`,
        ['System Administrator', 'admin@erp.com', hashedPassword, 'admin']
      );
      
      console.log('✅ Default admin user created:');
      console.log('   Email: admin@erp.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change this password after first login!');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Failed to create default admin:', error.message);
  }
};

/**
 * Execute a database query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Object} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 500ms) in development (adjusted for cloud database latency)
    if (process.env.NODE_ENV === 'development' && duration > 500) {
      console.log('Slow query detected:', {
        query: text,
        duration: `${duration}ms`,
        rows: res.rowCount
      });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', {
      query: text,
      params,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Object} Database client
 */
const getClient = async () => {
  return await pool.connect();
};

/**
 * Close the database pool
 */
const closePool = async () => {
  await pool.end();
  console.log('📦 Database pool closed');
};

module.exports = {
  query,
  getClient,
  pool,
  testConnection,
  initializeTables,
  createDefaultAdmin,
  closePool
};
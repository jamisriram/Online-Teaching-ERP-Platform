/**
 * Input Validation Middleware
 * Validates request data and sanitizes inputs
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }
  
  // Optional: Add more password strength requirements
  // if (!/(?=.*[a-z])/.test(password)) {
  //   errors.push('Password must contain at least one lowercase letter');
  // }
  
  // if (!/(?=.*[A-Z])/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter');
  // }
  
  // if (!/(?=.*\d)/.test(password)) {
  //   errors.push('Password must contain at least one number');
  // }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Validate user registration data
 */
const validateRegistration = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Name must be less than 100 characters long');
  }

  // Validate email
  if (!email || typeof email !== 'string') {
    errors.push('Email is required and must be a string');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  // Validate role
  const validRoles = ['admin', 'teacher', 'student'];
  if (role && !validRoles.includes(role)) {
    errors.push('Role must be one of: admin, teacher, student');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors
    });
  }

  // Sanitize inputs
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  
  next();
};

/**
 * Validate user login data
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Validate email
  if (!email || typeof email !== 'string') {
    errors.push('Email is required and must be a string');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  if (!password || typeof password !== 'string') {
    errors.push('Password is required and must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors
    });
  }

  // Sanitize inputs
  req.body.email = email.trim().toLowerCase();
  
  next();
};

/**
 * Validate session creation data
 */
const validateSessionCreation = (req, res, next) => {
  const { title, description, date_time, meeting_link, recording_link } = req.body;
  const errors = [];

  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  } else if (title.trim().length > 200) {
    errors.push('Title must be less than 200 characters long');
  }

  // Validate description
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  } else if (description.trim().length > 1000) {
    errors.push('Description must be less than 1000 characters long');
  }

  // Validate date_time
  if (!date_time) {
    errors.push('Date and time are required');
  } else {
    const sessionDate = new Date(date_time);
    if (isNaN(sessionDate.getTime())) {
      errors.push('Please provide a valid date and time');
    } else if (sessionDate <= new Date()) {
      errors.push('Session date and time must be in the future');
    }
  }

  // Validate meeting_link
  if (!meeting_link || typeof meeting_link !== 'string' || meeting_link.trim().length === 0) {
    errors.push('Meeting link is required and must be a non-empty string');
  } else {
    try {
      new URL(meeting_link.trim());
    } catch {
      errors.push('Meeting link must be a valid URL');
    }
  }

  // Validate recording_link (optional)
  if (recording_link && typeof recording_link === 'string' && recording_link.trim().length > 0) {
    try {
      new URL(recording_link.trim());
    } catch {
      errors.push('Recording link must be a valid URL');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors
    });
  }

  // Sanitize inputs
  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.meeting_link = meeting_link.trim();
  if (recording_link) {
    req.body.recording_link = recording_link.trim();
  }

  next();
};

/**
 * Validate user update data
 */
const validateUserUpdate = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Validate name (optional)
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Name must be a non-empty string');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (name.trim().length > 100) {
      errors.push('Name must be less than 100 characters long');
    }
  }

  // Validate email (optional)
  if (email !== undefined) {
    if (typeof email !== 'string') {
      errors.push('Email must be a string');
    } else if (!isValidEmail(email.trim())) {
      errors.push('Please provide a valid email address');
    }
  }

  // Validate password (optional)
  if (password !== undefined) {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  // Validate role (optional)
  if (role !== undefined) {
    const validRoles = ['admin', 'teacher', 'student'];
    if (!validRoles.includes(role)) {
      errors.push('Role must be one of: admin, teacher, student');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors
    });
  }

  // Sanitize inputs
  if (name !== undefined) req.body.name = name.trim();
  if (email !== undefined) req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Validate attendance status update
 */
const validateAttendanceStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  // Validate status
  const validStatuses = ['present', 'absent', 'late'];
  if (!status || !validStatuses.includes(status)) {
    errors.push('Status must be one of: present, absent, late');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateSessionCreation,
  validateUserUpdate,
  validateAttendanceStatus,
  isValidEmail,
  validatePassword
};
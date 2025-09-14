/**
 * Role-based Access Control Middleware
 * Ensures users have the required role to access specific routes
 */

/**
 * Require specific roles
 * @param {Array|string} allowedRoles - Array of allowed roles or single role string
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This resource requires ${roles.join(' or ')} role. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Require teacher role (or admin)
 */
const requireTeacher = requireRole(['teacher', 'admin']);

/**
 * Require student role (or admin)
 */
const requireStudent = requireRole(['student', 'admin']);

/**
 * Require teacher or admin role
 */
const requireTeacherOrAdmin = requireRole(['teacher', 'admin']);

/**
 * Require student or admin role
 */
const requireStudentOrAdmin = requireRole(['student', 'admin']);

/**
 * Allow any authenticated user
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }
  next();
};

/**
 * Check if user is admin
 * @param {Object} user - User object from request
 * @returns {boolean} True if user is admin
 */
const isAdmin = (user) => {
  return user && user.role === 'admin';
};

/**
 * Check if user is teacher
 * @param {Object} user - User object from request
 * @returns {boolean} True if user is teacher
 */
const isTeacher = (user) => {
  return user && user.role === 'teacher';
};

/**
 * Check if user is student
 * @param {Object} user - User object from request
 * @returns {boolean} True if user is student
 */
const isStudent = (user) => {
  return user && user.role === 'student';
};

/**
 * Check if user can access resource based on ownership
 * @param {number} resourceUserId - User ID who owns the resource
 * @param {Object} requestUser - User making the request
 * @returns {boolean} True if user can access resource
 */
const canAccessResource = (resourceUserId, requestUser) => {
  // Admin can access any resource
  if (isAdmin(requestUser)) {
    return true;
  }
  
  // User can access their own resources
  return resourceUserId === requestUser.userId;
};

/**
 * Middleware to check resource ownership or admin access
 * @param {Function} getResourceUserId - Function to extract resource user ID from request
 * @returns {Function} Express middleware function
 */
const requireOwnershipOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be logged in to access this resource'
        });
      }

      // Admin can access anything
      if (isAdmin(req.user)) {
        return next();
      }

      // Get resource user ID
      const resourceUserId = await getResourceUserId(req);
      
      if (!resourceUserId) {
        return res.status(404).json({
          error: 'Resource not found',
          message: 'The requested resource does not exist'
        });
      }

      // Check if user can access the resource
      if (!canAccessResource(resourceUserId, req.user)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources'
        });
      }

      next();
    } catch (error) {
      console.error('Resource access check error:', error);
      res.status(500).json({
        error: 'Access check failed',
        message: 'An error occurred while checking resource access'
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireTeacherOrAdmin,
  requireStudentOrAdmin,
  requireAuth,
  requireOwnershipOrAdmin,
  isAdmin,
  isTeacher,
  isStudent,
  canAccessResource
};
const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * User Controller
 * Handles user management operations (admin only)
 */
class UserController {
  /**
   * Create new user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createUser(req, res) {
    try {
      const { name, email, password, role = 'student' } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Name, email, and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
          message: 'A user with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        error: 'Failed to create user',
        message: 'An error occurred while creating the user'
      });
    }
  }

  /**
   * Get all users (admin only) or users by role (teacher/admin)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllUsers(req, res) {
    try {
      const { role } = req.query;
      let users;

      if (role) {
        // Filter users by role (e.g., /api/users?role=student)
        users = await User.findByRole(role);
      } else {
        // Get all users
        users = await User.findAll();
      }
      
      // Remove password from response
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || 'Not provided',
        role: user.role,
        created_at: user.created_at
      }));

      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        message: 'An error occurred while fetching users'
      });
    }
  }

  /**
   * Get user by ID (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User with the specified ID does not exist'
        });
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        error: 'Failed to fetch user',
        message: 'An error occurred while fetching the user'
      });
    }
  }

  /**
   * Update user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, password } = req.body;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User with the specified ID does not exist'
        });
      }

      // Prepare update data
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      
      // Hash password if provided
      if (password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(password, saltRounds);
      }

      // Update user
      const updatedUser = await User.update(id, updateData);

      res.json({
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Failed to update user',
        message: 'An error occurred while updating the user'
      });
    }
  }

  /**
   * Delete user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User with the specified ID does not exist'
        });
      }

      // Prevent admin from deleting themselves
      if (id === req.user.userId) {
        return res.status(400).json({
          error: 'Cannot delete self',
          message: 'You cannot delete your own account'
        });
      }

      await User.delete(id);

      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        message: 'An error occurred while deleting the user'
      });
    }
  }

  /**
   * Get all students (for teachers and admins)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getStudents(req, res) {
    try {
      // Get all users with student role
      const students = await User.findByRole('student');
      
      // Remove password from response and format for frontend
      const sanitizedStudents = students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone || 'Not provided',
        role: student.role,
        created_at: student.created_at
      }));

      res.json({
        message: 'Students retrieved successfully',
        students: sanitizedStudents
      });
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({
        error: 'Failed to fetch students',
        message: 'An error occurred while fetching students'
      });
    }
  }

  /**
   * Get user statistics (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserStats(req, res) {
    try {
      const stats = await User.getStats();
      
      res.json({
        message: 'User statistics retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch user statistics',
        message: 'An error occurred while fetching user statistics'
      });
    }
  }

  /**
   * Get all students (for teachers and admins)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getStudents(req, res) {
    try {
      const students = await User.findByRole('student');
      
      // Remove password from response
      const sanitizedStudents = students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone || 'Not provided',
        role: student.role,
        created_at: student.created_at
      }));

      res.json(sanitizedStudents);
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({
        error: 'Failed to fetch students',
        message: 'An error occurred while fetching students'
      });
    }
  }
}

module.exports = UserController;
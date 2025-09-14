import api from './api';

/**
 * Course Service
 * Handles all course-related API calls
 */

const courseService = {
  /**
   * Get all courses based on user role
   * - Students: Available courses to enroll
   * - Teachers: Own courses
   * - Admin: All courses
   */
  getAllCourses: async () => {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  /**
   * Get course by ID with enrolled students
   * @param {number} courseId - Course ID
   */
  getCourseById: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  },

  /**
   * Create a new course (teacher/admin)
   * @param {Object} courseData - Course information
   */
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/courses', courseData);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  /**
   * Update course (teacher/admin)
   * @param {number} courseId - Course ID
   * @param {Object} updateData - Updated course information
   */
  updateCourse: async (courseId, updateData) => {
    try {
      const response = await api.put(`/courses/${courseId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  /**
   * Enroll student in a course
   * @param {number} courseId - Course ID
   */
  enrollInCourse: async (courseId) => {
    try {
      const response = await api.post(`/courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  },

  /**
   * Get student's enrolled courses
   */
  getStudentCourses: async () => {
    try {
      const response = await api.get('/courses/student/enrolled');
      return response.data;
    } catch (error) {
      console.error('Error fetching student courses:', error);
      throw error;
    }
  },

  /**
   * Mark attendance for course session (teacher only)
   * @param {number} courseId - Course ID
   * @param {number} sessionId - Session ID
   * @param {Array} attendanceData - Array of {studentId, status}
   */
  markAttendance: async (courseId, sessionId, attendanceData) => {
    try {
      const response = await api.post(`/courses/${courseId}/sessions/${sessionId}/attendance`, {
        attendanceData
      });
      return response.data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  },

  /**
   * Get course attendance report (teacher/admin)
   * @param {number} courseId - Course ID
   */
  getCourseAttendance: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/attendance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course attendance:', error);
      throw error;
    }
  },

  /**
   * Get teacher's courses
   */
  getTeacherCourses: async () => {
    try {
      const response = await api.get('/courses/teacher/my-courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      throw error;
    }
  },

  /**
   * Get students enrolled in a course (for teachers)
   * @param {number} courseId - Course ID
   */
  getCourseStudents: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/students`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course students:', error);
      throw error;
    }
  },

  /**
   * Get sessions for a specific course
   * @param {number} courseId - Course ID
   */
  getCourseSessions: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/sessions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course sessions:', error);
      throw error;
    }
  },

  /**
   * Get teacher notifications about new enrollments
   */
  getTeacherNotifications: async () => {
    try {
      const response = await api.get('/courses/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification ID
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/courses/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Delete a course (admin only)
   * @param {number} courseId - Course ID
   */
  deleteCourse: async (courseId) => {
    try {
      const response = await api.delete(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  /**
   * Get course attendance statistics
   * @param {number} courseId - Course ID
   */
  getCourseAttendanceStats: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/attendance-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course attendance stats:', error);
      throw error;
    }
  }
};

export default courseService;
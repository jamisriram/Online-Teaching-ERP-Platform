import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import courseService from '../services/courseService';

/**
 * Course Enrollment Component
 * Allows students to browse and enroll in available courses
 */
const CourseEnrollment = () => {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [availableResponse, enrolledResponse] = await Promise.all([
        courseService.getAllCourses(),
        courseService.getStudentCourses()
      ]);
      
      setAvailableCourses(availableResponse.courses || []);
      setEnrolledCourses(enrolledResponse.courses || []);
      setError('');
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollClick = (course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const handleEnrollConfirm = async () => {
    if (!selectedCourse) return;

    try {
      setEnrolling(true);
      await courseService.enrollInCourse(selectedCourse.id);
      
      setSuccess(`Successfully enrolled in ${selectedCourse.title}!`);
      setShowEnrollModal(false);
      setSelectedCourse(null);
      
      // Refresh courses list
      await fetchCourses();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error enrolling in course:', err);
      setError(err.response?.data?.message || 'Failed to enroll in course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const getCourseStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { status: 'upcoming', color: 'primary', text: 'Upcoming' };
    } else if (now >= start && now <= end) {
      return { status: 'active', color: 'success', text: 'Active' };
    } else {
      return { status: 'completed', color: 'secondary', text: 'Completed' };
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading courses...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><i className="bi bi-book me-2"></i>Course Enrollment</h2>
          <p className="text-muted mb-0">Browse and enroll in available courses</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Enrolled Courses */}
      {enrolledCourses.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-3">
            <i className="bi bi-bookmark-check me-2"></i>
            My Enrolled Courses ({enrolledCourses.length})
          </h4>
          <Row>
            {enrolledCourses.map((course) => {
              const courseStatus = getCourseStatus(course.start_date, course.end_date);
              const attendanceRate = course.total_sessions > 0 
                ? Math.round((course.attended_sessions / course.total_sessions) * 100) 
                : 0;

              return (
                <Col md={6} lg={4} key={course.id} className="mb-4">
                  <Card className="h-100 border-success">
                    <Card.Header className="bg-success text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{course.course_code}</h6>
                        <Badge bg="light" text="dark">Enrolled</Badge>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <h5 className="card-title">{course.title}</h5>
                      <p className="card-text text-muted">{course.description}</p>
                      
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="bi bi-person me-1"></i>
                          Instructor: {course.teacher_name}
                        </small>
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="bi bi-calendar me-1"></i>
                          Enrolled: {new Date(course.enrollment_date).toLocaleDateString()}
                        </small>
                      </div>
                      
                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="bi bi-graph-up me-1"></i>
                          Attendance: {attendanceRate}% ({course.attended_sessions}/{course.total_sessions})
                        </small>
                      </div>
                      
                      <Badge bg={courseStatus.color}>
                        {courseStatus.text}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}

      {/* Available Courses */}
      <div>
        <h4 className="mb-3">
          <i className="bi bi-plus-circle me-2"></i>
          Available Courses ({availableCourses.length})
        </h4>
        
        {availableCourses.length > 0 ? (
          <Row>
            {availableCourses.map((course) => {
              const courseStatus = getCourseStatus(course.start_date, course.end_date);
              const spotsLeft = course.max_students - course.enrolled_students;

              return (
                <Col md={6} lg={4} key={course.id} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{course.course_code}</h6>
                        <Badge bg={courseStatus.color}>
                          {courseStatus.text}
                        </Badge>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <h5 className="card-title">{course.title}</h5>
                      <p className="card-text text-muted">{course.description}</p>
                      
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="bi bi-person me-1"></i>
                          Instructor: {course.teacher_name}
                        </small>
                      </div>
                      
                      <div className="mb-2">
                        <small className="text-muted">
                          <i className="bi bi-calendar-range me-1"></i>
                          Duration: {new Date(course.start_date).toLocaleDateString()} - {new Date(course.end_date).toLocaleDateString()}
                        </small>
                      </div>
                      
                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="bi bi-people me-1"></i>
                          Enrollment: {course.enrolled_students}/{course.max_students} students
                        </small>
                      </div>
                      
                      {spotsLeft > 0 ? (
                        <div className="mb-2">
                          <small className="text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            {spotsLeft} spots available
                          </small>
                        </div>
                      ) : (
                        <div className="mb-2">
                          <small className="text-danger">
                            <i className="bi bi-x-circle me-1"></i>
                            Course is full
                          </small>
                        </div>
                      )}
                      
                      <div className="d-grid">
                        <Button
                          variant="primary"
                          onClick={() => handleEnrollClick(course)}
                          disabled={spotsLeft === 0 || courseStatus.status === 'completed'}
                        >
                          <i className="bi bi-plus-lg me-1"></i>
                          {spotsLeft === 0 ? 'Course Full' : 'Enroll Now'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Card>
            <Card.Body className="text-center py-5">
              <i className="bi bi-book text-muted" style={{ fontSize: '4rem' }}></i>
              <h4 className="mt-3 text-muted">No Available Courses</h4>
              <p className="text-muted">
                {enrolledCourses.length > 0 
                  ? "You're enrolled in all available courses!" 
                  : "No courses are currently available for enrollment."}
              </p>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Enrollment Confirmation Modal */}
      <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Enrollment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <div>
              <h5>{selectedCourse.title}</h5>
              <p className="text-muted">{selectedCourse.description}</p>
              
              <div className="mb-2">
                <strong>Instructor:</strong> {selectedCourse.teacher_name}
              </div>
              <div className="mb-2">
                <strong>Course Code:</strong> {selectedCourse.course_code}
              </div>
              <div className="mb-2">
                <strong>Duration:</strong> {new Date(selectedCourse.start_date).toLocaleDateString()} - {new Date(selectedCourse.end_date).toLocaleDateString()}
              </div>
              <div className="mb-3">
                <strong>Max Students:</strong> {selectedCourse.max_students}
              </div>
              
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                Are you sure you want to enroll in this course? Your instructor will be notified of your enrollment.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEnrollConfirm}
            disabled={enrolling}
          >
            {enrolling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Enrolling...
              </>
            ) : (
              <>
                <i className="bi bi-check me-1"></i>
                Confirm Enrollment
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CourseEnrollment;
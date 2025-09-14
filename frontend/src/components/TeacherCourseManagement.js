import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal, Form, Table, Tabs, Tab } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import courseService from '../services/courseService';

/**
 * Teacher Course Management Component
 * Allows teachers to manage their courses, view enrollments, and mark attendance
 */
const TeacherCourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchCourses();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseDetails(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getTeacherCourses();
      setCourses(response.courses || []);
      
      // Auto-select first course if available
      if (response.courses && response.courses.length > 0 && !selectedCourse) {
        setSelectedCourse(response.courses[0]);
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId) => {
    try {
      const [studentsResponse, sessionsResponse] = await Promise.all([
        courseService.getCourseStudents(courseId),
        courseService.getCourseSessions(courseId)
      ]);
      
      setStudents(studentsResponse.students || []);
      setSessions(sessionsResponse.sessions || []);
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('Failed to load course details. Please try again.');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await courseService.getTeacherNotifications();
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleAttendanceClick = (session) => {
    setSelectedSession(session);
    
    // Initialize attendance data with existing attendance
    const initialAttendance = {};
    students.forEach(student => {
      const existingAttendance = session.attendance?.find(a => a.student_id === student.user_id);
      initialAttendance[student.user_id] = existingAttendance ? existingAttendance.status : 'absent';
    });
    
    setAttendanceData(initialAttendance);
    setShowAttendanceModal(true);
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAttendance = async () => {
    if (!selectedSession || !selectedCourse) return;

    try {
      setMarkingAttendance(true);
      
      await courseService.markAttendance(
        selectedCourse.id,
        selectedSession.id,
        attendanceData
      );
      
      setSuccess('Attendance marked successfully!');
      setShowAttendanceModal(false);
      
      // Refresh course details
      await fetchCourseDetails(selectedCourse.id);
      
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError(err.response?.data?.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setMarkingAttendance(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await courseService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getAttendanceRate = (student) => {
    if (sessions.length === 0) return 0;
    
    const attendedSessions = sessions.filter(session => 
      session.attendance?.some(a => a.student_id === student.user_id && a.status === 'present')
    ).length;
    
    return Math.round((attendedSessions / sessions.length) * 100);
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
          <h2><i className="bi bi-mortarboard me-2"></i>Course Management</h2>
          <p className="text-muted mb-0">Manage your courses, students, and attendance</p>
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

      {/* Notifications */}
      {notifications.length > 0 && (
        <Alert variant="info" className="mb-4">
          <h6><i className="bi bi-bell me-2"></i>New Notifications</h6>
          {notifications.map(notification => (
            <div key={notification.id} className="d-flex justify-content-between align-items-center mb-2">
              <span>{notification.message}</span>
              <Button 
                size="sm" 
                variant="outline-primary"
                onClick={() => markNotificationAsRead(notification.id)}
              >
                Mark as Read
              </Button>
            </div>
          ))}
        </Alert>
      )}

      {courses.length > 0 ? (
        <Row>
          {/* Course Selection Sidebar */}
          <Col md={4} lg={3}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">My Courses</h5>
              </Card.Header>
              <Card.Body className="p-0">
                {courses.map(course => (
                  <div 
                    key={course.id}
                    className={`p-3 border-bottom cursor-pointer ${
                      selectedCourse?.id === course.id ? 'bg-primary text-white' : 'bg-light'
                    }`}
                    onClick={() => setSelectedCourse(course)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-1">{course.course_code}</h6>
                    <small className={selectedCourse?.id === course.id ? 'text-white-50' : 'text-muted'}>
                      {course.title}
                    </small>
                    <div className="mt-1">
                      <Badge bg={selectedCourse?.id === course.id ? 'light' : 'primary'} 
                             text={selectedCourse?.id === course.id ? 'dark' : 'white'}>
                        {course.enrolled_students} students
                      </Badge>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col md={8} lg={9}>
            {selectedCourse ? (
              <Tabs defaultActiveKey="students" className="mb-4">
                {/* Students Tab */}
                <Tab eventKey="students" title={`Students (${students.length})`}>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">
                        <i className="bi bi-people me-2"></i>
                        Enrolled Students - {selectedCourse.title}
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {students.length > 0 ? (
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Email</th>
                              <th>Enrollment Date</th>
                              <th>Attendance Rate</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map(student => {
                              const attendanceRate = getAttendanceRate(student);
                              return (
                                <tr key={student.user_id}>
                                  <td>
                                    <div>
                                      <strong>{student.full_name}</strong>
                                    </div>
                                  </td>
                                  <td>{student.email}</td>
                                  <td>{new Date(student.enrollment_date).toLocaleDateString()}</td>
                                  <td>
                                    <Badge bg={attendanceRate >= 80 ? 'success' : attendanceRate >= 60 ? 'warning' : 'danger'}>
                                      {attendanceRate}%
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg={student.enrollment_status === 'active' ? 'success' : 'secondary'}>
                                      {student.enrollment_status}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="text-center py-4">
                          <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
                          <h5 className="mt-3 text-muted">No Students Enrolled</h5>
                          <p className="text-muted">Students will appear here once they enroll in your course.</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>

                {/* Sessions & Attendance Tab */}
                <Tab eventKey="attendance" title={`Sessions (${sessions.length})`}>
                  <Card>
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <i className="bi bi-calendar-check me-2"></i>
                          Course Sessions & Attendance
                        </h5>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      {sessions.length > 0 ? (
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Session</th>
                              <th>Date & Time</th>
                              <th>Status</th>
                              <th>Attendance</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessions.map(session => {
                              const attendanceCount = session.attendance?.filter(a => a.status === 'present').length || 0;
                              const sessionDate = new Date(session.scheduled_start_time);
                              const now = new Date();
                              
                              return (
                                <tr key={session.id}>
                                  <td>
                                    <strong>{session.title}</strong>
                                    {session.description && (
                                      <div className="text-muted small">{session.description}</div>
                                    )}
                                  </td>
                                  <td>
                                    <div>{sessionDate.toLocaleDateString()}</div>
                                    <div className="text-muted small">
                                      {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </td>
                                  <td>
                                    <Badge bg={
                                      session.status === 'completed' ? 'success' :
                                      session.status === 'active' ? 'warning' :
                                      sessionDate < now ? 'danger' : 'primary'
                                    }>
                                      {session.status || (sessionDate < now ? 'missed' : 'scheduled')}
                                    </Badge>
                                  </td>
                                  <td>
                                    <span className="me-2">{attendanceCount}/{students.length}</span>
                                    {students.length > 0 && (
                                      <Badge bg="secondary">
                                        {Math.round((attendanceCount / students.length) * 100)}%
                                      </Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => handleAttendanceClick(session)}
                                      disabled={students.length === 0}
                                    >
                                      <i className="bi bi-check-square me-1"></i>
                                      Mark Attendance
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="text-center py-4">
                          <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                          <h5 className="mt-3 text-muted">No Sessions Found</h5>
                          <p className="text-muted">Course sessions will appear here once they are created.</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            ) : (
              <Card>
                <Card.Body className="text-center py-5">
                  <i className="bi bi-mortarboard text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="mt-3 text-muted">Select a Course</h4>
                  <p className="text-muted">Choose a course from the sidebar to manage students and attendance.</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      ) : (
        <Card>
          <Card.Body className="text-center py-5">
            <i className="bi bi-mortarboard text-muted" style={{ fontSize: '4rem' }}></i>
            <h4 className="mt-3 text-muted">No Courses Found</h4>
            <p className="text-muted">You don't have any courses assigned yet.</p>
          </Card.Body>
        </Card>
      )}

      {/* Attendance Marking Modal */}
      <Modal show={showAttendanceModal} onHide={() => setShowAttendanceModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Mark Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSession && (
            <div>
              <div className="mb-4">
                <h5>{selectedSession.title}</h5>
                <p className="text-muted">
                  {new Date(selectedSession.scheduled_start_time).toLocaleDateString()} at{' '}
                  {new Date(selectedSession.scheduled_start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              {students.length > 0 ? (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.user_id}>
                        <td><strong>{student.full_name}</strong></td>
                        <td>{student.email}</td>
                        <td>
                          <Form.Check
                            type="radio"
                            name={`attendance_${student.user_id}`}
                            id={`present_${student.user_id}`}
                            label="Present"
                            checked={attendanceData[student.user_id] === 'present'}
                            onChange={() => handleAttendanceChange(student.user_id, 'present')}
                            className="me-3 d-inline-block"
                          />
                          <Form.Check
                            type="radio"
                            name={`attendance_${student.user_id}`}
                            id={`absent_${student.user_id}`}
                            label="Absent"
                            checked={attendanceData[student.user_id] === 'absent'}
                            onChange={() => handleAttendanceChange(student.user_id, 'absent')}
                            className="d-inline-block"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="warning">
                  No students are enrolled in this course yet.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAttendanceModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleMarkAttendance}
            disabled={markingAttendance || students.length === 0}
          >
            {markingAttendance ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check me-1"></i>
                Save Attendance
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TeacherCourseManagement;
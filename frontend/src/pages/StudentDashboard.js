import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Nav, Button, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import CourseEnrollment from '../components/CourseEnrollment';
import { fetchSessions } from '../store/slices/sessionsSlice';
import { fetchStudentAttendance } from '../store/slices/attendanceSlice';

/**
 * Student Dashboard Component
 * Main dashboard for student users
 */
const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { user } = useSelector((state) => state.auth);
  const { sessions, upcomingSessions, isLoading: sessionsLoading } = useSelector((state) => state.sessions);
  const { studentAttendance, isLoading: attendanceLoading } = useSelector((state) => state.attendance);

  useEffect(() => {
    // Fetch available sessions and student attendance
    dispatch(fetchSessions());
    dispatch(fetchStudentAttendance());
  }, [dispatch]);

  useEffect(() => {
    // Set active tab based on current path
    const path = location.pathname;
    if (path.includes('/courses')) setActiveTab('courses');
    else if (path.includes('/sessions')) setActiveTab('sessions');
    else if (path.includes('/attendance')) setActiveTab('attendance');
    else if (path.includes('/schedule')) setActiveTab('schedule');
    else setActiveTab('dashboard');
  }, [location.pathname]);

  const handleTabClick = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const handleJoinSession = (sessionId, meetingLink) => {
    // Open meeting link in new tab
    window.open(meetingLink, '_blank');
  };

  const getSessionStatus = (dateTime) => {
    const sessionDate = new Date(dateTime);
    const now = new Date();
    const timeDiff = sessionDate - now;
    
    if (timeDiff > 15 * 60 * 1000) {
      return { status: 'upcoming', color: 'primary', text: 'Upcoming' };
    } else if (timeDiff > -2 * 60 * 60 * 1000) {
      return { status: 'live', color: 'success', text: 'Live/Available' };
    } else {
      return { status: 'ended', color: 'secondary', text: 'Ended' };
    }
  };

  // Component for Dashboard Overview
  const DashboardOverview = () => (
    <div className="fade-in">
      <h2 className="mb-4">Dashboard Overview</h2>
      
      {/* Quick Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100 hover-shadow">
            <Card.Body>
              <h3 className="text-primary">{upcomingSessions?.length || 0}</h3>
              <p className="mb-0">Upcoming Sessions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 hover-shadow">
            <Card.Body>
              <h3 className="text-success">{studentAttendance?.length || 0}</h3>
              <p className="mb-0">Sessions Attended</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 hover-shadow">
            <Card.Body>
              <h3 className="text-info">{sessions?.length || 0}</h3>
              <p className="mb-0">Total Sessions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 hover-shadow">
            <Card.Body>
              <h3 className="text-warning">
                {studentAttendance && sessions?.length > 0 
                  ? Math.round((studentAttendance.length / sessions.length) * 100) 
                  : 0}%
              </h3>
              <p className="mb-0">Attendance Rate</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Sessions */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Recent Sessions</h5>
        </Card.Header>
        <Card.Body>
          {sessionsLoading ? (
            <LoadingSpinner />
          ) : sessions && sessions.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 5).map((session) => {
                    const statusInfo = getSessionStatus(session.date_time);
                    return (
                      <tr key={session.id}>
                        <td>
                          <strong>{session.title}</strong>
                          <br />
                          <small className="text-muted">{session.description}</small>
                        </td>
                        <td>
                          {new Date(session.date_time).toLocaleDateString()} <br />
                          <small>{new Date(session.date_time).toLocaleTimeString()}</small>
                        </td>
                        <td>
                          <Badge bg={statusInfo.color}>{statusInfo.text}</Badge>
                        </td>
                        <td>
                          {statusInfo.status === 'live' && session.meeting_link ? (
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => handleJoinSession(session.id, session.meeting_link)}
                            >
                              Join Session
                            </Button>
                          ) : statusInfo.status === 'upcoming' ? (
                            <span className="text-muted">Not yet available</span>
                          ) : (
                            <span className="text-muted">Session ended</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-3">No sessions available at the moment.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  // Component for Available Sessions
  const AvailableSessions = () => (
    <div className="fade-in">
      <h2 className="mb-4">Available Sessions</h2>
      
      {sessionsLoading ? (
        <LoadingSpinner />
      ) : sessions && sessions.length > 0 ? (
        <Row>
          {sessions.map((session) => {
            const statusInfo = getSessionStatus(session.date_time);
            return (
              <Col md={6} lg={4} key={session.id} className="mb-4">
                <Card className="h-100 hover-shadow">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">{session.title}</h6>
                    <Badge bg={statusInfo.color}>{statusInfo.text}</Badge>
                  </Card.Header>
                  <Card.Body>
                    <p className="card-text">{session.description}</p>
                    <div className="mb-2">
                      <small className="text-muted">
                        <i className="bi bi-calendar"></i> {new Date(session.date_time).toLocaleDateString()}
                      </small>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted">
                        <i className="bi bi-clock"></i> {new Date(session.date_time).toLocaleTimeString()}
                      </small>
                    </div>
                    
                    {statusInfo.status === 'live' && session.meeting_link ? (
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="w-100"
                        onClick={() => handleJoinSession(session.id, session.meeting_link)}
                      >
                        <i className="bi bi-camera-video"></i> Join Session
                      </Button>
                    ) : statusInfo.status === 'upcoming' ? (
                      <Button variant="outline-primary" size="sm" className="w-100" disabled>
                        <i className="bi bi-clock"></i> Session Not Started
                      </Button>
                    ) : (
                      <Button variant="outline-secondary" size="sm" className="w-100" disabled>
                        <i className="bi bi-check-circle"></i> Session Ended
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card>
          <Card.Body className="text-center py-5">
            <h5>No Sessions Available</h5>
            <p className="text-muted">There are no sessions scheduled at the moment. Check back later!</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  // Component for Student's Attendance Record
  const MyAttendance = () => (
    <div className="fade-in">
      <h2 className="mb-4">My Attendance</h2>
      
      {attendanceLoading ? (
        <LoadingSpinner />
      ) : studentAttendance && studentAttendance.length > 0 ? (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Attendance History</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Attended At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttendance.map((attendance) => (
                    <tr key={attendance.id}>
                      <td>
                        <strong>{attendance.session_title || 'Session'}</strong>
                      </td>
                      <td>{new Date(attendance.session_date).toLocaleDateString()}</td>
                      <td>{new Date(attendance.timestamp).toLocaleString()}</td>
                      <td>
                        <Badge bg="success">Present</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body className="text-center py-5">
            <h5>No Attendance Records</h5>
            <p className="text-muted">You haven't attended any sessions yet.</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  // Component for Schedule
  const Schedule = () => (
    <div className="fade-in">
      <h2 className="mb-4">My Schedule</h2>
      
      {sessionsLoading ? (
        <LoadingSpinner />
      ) : upcomingSessions && upcomingSessions.length > 0 ? (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Upcoming Sessions</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingSessions.map((session) => {
                    const statusInfo = getSessionStatus(session.date_time);
                    return (
                      <tr key={session.id}>
                        <td>
                          <strong>{session.title}</strong>
                          <br />
                          <small className="text-muted">{session.description}</small>
                        </td>
                        <td>{new Date(session.date_time).toLocaleDateString()}</td>
                        <td>{new Date(session.date_time).toLocaleTimeString()}</td>
                        <td>
                          <Badge bg={statusInfo.color}>{statusInfo.text}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body className="text-center py-5">
            <h5>No Upcoming Sessions</h5>
            <p className="text-muted">You don't have any upcoming sessions scheduled.</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  if (sessionsLoading && attendanceLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="student-dashboard">
      <Header />
      <Container fluid className="px-4">
        <Row>
          {/* Sidebar Navigation */}
          <Col md={2} className="sidebar-nav">
            <Nav variant="pills" className="flex-column mt-3">
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'dashboard'}
                  onClick={() => handleTabClick('dashboard', '/student')}
                  className="d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-house-door me-2"></i>
                  Dashboard
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'courses'}
                  onClick={() => handleTabClick('courses', '/student/courses')}
                  className="d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-book me-2"></i>
                  My Courses
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'sessions'}
                  onClick={() => handleTabClick('sessions', '/student/sessions')}
                  className="d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-camera-video me-2"></i>
                  Sessions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'attendance'}
                  onClick={() => handleTabClick('attendance', '/student/attendance')}
                  className="d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  My Attendance
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'schedule'}
                  onClick={() => handleTabClick('schedule', '/student/schedule')}
                  className="d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-calendar-event me-2"></i>
                  Schedule
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          {/* Main Content */}
          <Col md={10} className="main-content">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/courses" element={<CourseEnrollment />} />
              <Route path="/sessions" element={<AvailableSessions />} />
              <Route path="/attendance" element={<MyAttendance />} />
              <Route path="/schedule" element={<Schedule />} />
            </Routes>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StudentDashboard;
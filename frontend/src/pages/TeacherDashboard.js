import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Nav, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateSession from '../components/CreateSession';
import MySessions from '../components/MySessions';
import AttendanceManagement from '../components/AttendanceManagement';
import Reports from '../components/Reports';
import LiveSessionControl from '../components/LiveSessionControl';
import TeacherCourseManagement from '../components/TeacherCourseManagement';
import StudentList from '../components/StudentList';
import { fetchSessions } from '../store/slices/sessionsSlice';

/**
 * Teacher Dashboard Component
 * Main dashboard for teacher users
 */
const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { sessions, upcomingSessions, pastSessions, isLoading } = useSelector((state) => state.sessions);

  useEffect(() => {
    // Fetch teacher's sessions
    dispatch(fetchSessions());
  }, [dispatch]);

  const DashboardOverview = () => (
    <div className="fade-in">
      <div className="dashboard-header mb-4">
        <Container>
          <Row>
            <Col>
              <h1 className="mb-0">
                <i className="bi bi-person-workspace me-3"></i>
                Teacher Dashboard
              </h1>
              <p className="mb-0 mt-2 opacity-75">
                Welcome back, {user?.name}! Manage your sessions and track student attendance.
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Statistics Cards */}
            <Row className="mb-4">
              <Col md={3} sm={6} className="mb-3">
                <Card className="stats-card stats-primary h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="text-muted mb-1">Total Sessions</h6>
                        <h3 className="mb-0">{sessions?.length || 0}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="bi bi-calendar-week text-primary" style={{ fontSize: '2rem' }}></i>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="stats-card stats-success h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="text-muted mb-1">Upcoming</h6>
                        <h3 className="mb-0">{upcomingSessions?.length || 0}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="bi bi-calendar-plus text-success" style={{ fontSize: '2rem' }}></i>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="stats-card stats-info h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="text-muted mb-1">Completed</h6>
                        <h3 className="mb-0">{pastSessions?.length || 0}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="bi bi-calendar-check text-info" style={{ fontSize: '2rem' }}></i>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} sm={6} className="mb-3">
                <Card className="stats-card stats-warning h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="text-muted mb-1">This Week</h6>
                        <h3 className="mb-0">
                          {upcomingSessions?.filter(session => {
                            const sessionDate = new Date(session.date_time);
                            const now = new Date();
                            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                            return sessionDate >= now && sessionDate <= weekFromNow;
                          }).length || 0}
                        </h3>
                      </div>
                      <div className="align-self-center">
                        <i className="bi bi-calendar-date text-warning" style={{ fontSize: '2rem' }}></i>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Quick Actions */}
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-lightning me-2"></i>
                      Quick Actions
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={3} sm={6} className="mb-3">
                        <div className="d-grid">
                          <button 
                            className="btn quick-action-btn p-3"
                            onClick={() => navigate('/teacher/create-session')}
                          >
                            <i className="bi bi-plus-circle d-block mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Create Session</span>
                          </button>
                        </div>
                      </Col>
                      <Col md={3} sm={6} className="mb-3">
                        <div className="d-grid">
                          <button 
                            className="btn quick-action-btn p-3"
                            onClick={() => navigate('/teacher/sessions')}
                          >
                            <i className="bi bi-calendar-event d-block mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>View Schedule</span>
                          </button>
                        </div>
                      </Col>
                      <Col md={3} sm={6} className="mb-3">
                        <div className="d-grid">
                          <button 
                            className="btn quick-action-btn p-3"
                            onClick={() => navigate('/teacher/attendance')}
                          >
                            <i className="bi bi-check-circle d-block mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Attendance</span>
                          </button>
                        </div>
                      </Col>
                      <Col md={3} sm={6} className="mb-3">
                        <div className="d-grid">
                          <button 
                            className="btn quick-action-btn p-3"
                            onClick={() => navigate('/teacher/live-control')}
                          >
                            <i className="bi bi-broadcast d-block mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Live Control</span>
                          </button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Sessions Overview */}
            <Row>
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-calendar-plus me-2"></i>
                      Upcoming Sessions
                    </h5>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate('/teacher/create-session')}
                    >
                      <i className="bi bi-plus"></i> Add New
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {upcomingSessions?.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {upcomingSessions.slice(0, 3).map((session) => (
                          <div key={session.id} className="list-group-item px-0 border-0">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{session.title}</h6>
                                <p className="mb-1 text-muted small">{session.description}</p>
                                <small className="text-muted">
                                  <i className="bi bi-clock me-1"></i>
                                  {new Date(session.date_time).toLocaleString()}
                                </small>
                              </div>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => navigate(`/teacher/sessions/${session.id}`)}
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-4">
                        <i className="bi bi-calendar-x" style={{ fontSize: '3rem' }}></i>
                        <p className="mt-2 mb-0">No upcoming sessions</p>
                        <small>Create your first session to get started</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-graph-up me-2"></i>
                      Attendance Overview
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-bar-chart" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-2 mb-0">Attendance analytics</p>
                      <small>View detailed attendance reports and statistics</small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );

  return (
    <div>
      <Header title="Teacher Portal" />
      
      <Container fluid className="px-0">
        <Row className="g-0">
          {/* Sidebar */}
          <Col md={2} className="sidebar">
            <Nav className="flex-column p-3">
              <Nav.Link 
                as={Link} 
                to="/teacher" 
                className={location.pathname === '/teacher' ? 'active' : ''}
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/teacher/courses"
                className={location.pathname === '/teacher/courses' ? 'active' : ''}
              >
                <i className="bi bi-mortarboard me-2"></i>
                Course Management
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/teacher/sessions"
                className={location.pathname === '/teacher/sessions' ? 'active' : ''}
              >
                <i className="bi bi-calendar-week me-2"></i>
                My Sessions
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/teacher/create-session"
                className={location.pathname === '/teacher/create-session' ? 'active' : ''}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create Session
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/teacher/attendance"
                className={location.pathname === '/teacher/attendance' ? 'active' : ''}
              >
                <i className="bi bi-check-circle me-2"></i>
                Attendance
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/teacher/students"
                className={location.pathname === '/teacher/students' ? 'active' : ''}
              >
                <i className="bi bi-people me-2"></i>
                Student List
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/teacher/reports"
                className={location.pathname === '/teacher/reports' ? 'active' : ''}
              >
                <i className="bi bi-file-text me-2"></i>
                Reports
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/teacher/live-control"
                className={location.pathname === '/teacher/live-control' ? 'active' : ''}
              >
                <i className="bi bi-broadcast me-2"></i>
                Live Control
              </Nav.Link>
            </Nav>
          </Col>

          {/* Main Content */}
          <Col md={10} className="main-content">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/courses" element={<TeacherCourseManagement />} />
              <Route path="/sessions" element={<MySessions />} />
              <Route path="/create-session" element={<CreateSession />} />
              <Route path="/attendance" element={<AttendanceManagement />} />
              <Route path="/students" element={<StudentList />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/live-control" element={<LiveSessionControl />} />
            </Routes>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TeacherDashboard;
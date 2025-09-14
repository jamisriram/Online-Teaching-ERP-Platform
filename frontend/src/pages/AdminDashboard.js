import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Nav } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import UserManagement from '../components/UserManagement';
import SessionManagement from '../components/SessionManagement';
import AttendanceReports from '../components/AttendanceReports';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { fetchUsers, fetchUserStats } from '../store/slices/usersSlice';

/**
 * Admin Dashboard Component
 * Main dashboard for admin users with navigation and overview
 */
const AdminDashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { stats, isLoading } = useSelector((state) => state.users);

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchUserStats());
    dispatch(fetchUsers());
  }, [dispatch]);

  const DashboardOverview = () => (
    <div className="fade-in">
      <div className="dashboard-header mb-4">
        <Container>
          <Row>
            <Col>
              <h1 className="mb-0">
                <i className="bi bi-speedometer2 me-3"></i>
                Admin Dashboard
              </h1>
              <p className="mb-0 mt-2 opacity-75">
                Welcome back, {user?.name}! Here's what's happening in your ERP system.
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
                        <h6 className="text-muted mb-1">Total Users</h6>
                        <h3 className="mb-0">{stats?.total_users || 0}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="bi bi-people text-primary" style={{ fontSize: '2rem' }}></i>
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
                        <h6 className="text-muted mb-1">Teachers</h6>
                        <h3 className="mb-0">{stats?.total_teachers || 0}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="bi bi-person-workspace text-success" style={{ fontSize: '2rem' }}></i>
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
                        <h6 className="text-muted mb-1">Students</h6>
                        <h3 className="mb-0">{stats?.total_students || 0}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="bi bi-person-check text-info" style={{ fontSize: '2rem' }}></i>
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
                        <h6 className="text-muted mb-1">New This Month</h6>
                        <h3 className="mb-0">{stats?.new_users_this_month || 0}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="bi bi-person-plus text-warning" style={{ fontSize: '2rem' }}></i>
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
                          <Link 
                            to="/admin/users"
                            className="btn quick-action-btn p-3 text-decoration-none"
                          >
                            <i className="bi bi-person-plus d-block mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Manage Users</span>
                          </Link>
                        </div>
                      </Col>
                      <Col md={3} sm={6} className="mb-3">
                        <div className="d-grid">
                          <Link 
                            to="/admin/sessions"
                            className="btn quick-action-btn p-3 text-decoration-none"
                          >
                            <i className="bi bi-calendar-plus d-block mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Manage Sessions</span>
                          </Link>
                        </div>
                      </Col>
                      <Col md={3} sm={6} className="mb-3">
                        <div className="d-grid">
                          <Link 
                            to="/admin/attendance"
                            className="btn quick-action-btn p-3 text-decoration-none"
                          >
                            <i className="bi bi-bar-chart d-block mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>View Reports</span>
                          </Link>
                        </div>
                      </Col>
                      <Col md={3} sm={6} className="mb-3">
                        <div className="d-grid">
                          <Link 
                            to="/admin/analytics"
                            className="btn quick-action-btn p-3 text-decoration-none"
                          >
                            <i className="bi bi-graph-up d-block mb-2" style={{ fontSize: '2rem' }}></i>
                            <span>Analytics</span>
                          </Link>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity */}
            <Row>
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-clock-history me-2"></i>
                      Recent Activity
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-activity" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-2 mb-0">No recent activity</p>
                      <small>User activities will appear here</small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="h-100">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-calendar-week me-2"></i>
                      Upcoming Sessions
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-calendar-event" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-2 mb-0">No upcoming sessions</p>
                      <small>Sessions will appear here</small>
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
      <Header title="Admin Portal" />
      
      <Container fluid className="px-0">
        <Row className="g-0">
          {/* Sidebar */}
          <Col md={2} className="sidebar">
            <Nav className="flex-column p-3">
              <Nav.Link 
                as={Link} 
                to="/admin" 
                className={location.pathname === '/admin' ? 'active' : ''}
              >
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/admin/users"
                className={location.pathname === '/admin/users' ? 'active' : ''}
              >
                <i className="bi bi-people me-2"></i>
                User Management
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/admin/sessions"
                className={location.pathname === '/admin/sessions' ? 'active' : ''}
              >
                <i className="bi bi-calendar-week me-2"></i>
                Session Management
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/admin/attendance"
                className={location.pathname === '/admin/attendance' ? 'active' : ''}
              >
                <i className="bi bi-check-circle me-2"></i>
                Attendance Reports
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/admin/analytics"
                className={location.pathname === '/admin/analytics' ? 'active' : ''}
              >
                <i className="bi bi-bar-chart me-2"></i>
                Analytics
              </Nav.Link>
            </Nav>
          </Col>

          {/* Main Content */}
          <Col md={10} className="main-content">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/sessions" element={<SessionManagement />} />
              <Route path="/attendance" element={<AttendanceReports />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
            </Routes>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;
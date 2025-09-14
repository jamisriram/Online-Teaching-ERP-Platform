import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, 
  Badge, Spinner, ProgressBar, Table,
  Dropdown, Modal, ListGroup
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSessions } from '../store/slices/sessionsSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { fetchAttendanceStats } from '../store/slices/attendanceSlice';

/**
 * Analytics Dashboard Component for Admin Dashboard
 * Provides comprehensive analytics and business intelligence
 */
const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { sessions = [], isLoading: sessionsLoading } = useSelector((state) => state.sessions);
  const { users = [], isLoading: usersLoading } = useSelector((state) => state.users);
  const { stats = [], isLoading: attendanceLoading } = useSelector((state) => state.attendance);
  
  // Date filter
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // View states
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchUsers());
    dispatch(fetchAttendanceStats());
    setLastUpdated(new Date());
  }, [dispatch]);

  // Auto-refresh effect
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        dispatch(fetchSessions());
        dispatch(fetchUsers());
        dispatch(fetchAttendanceStats());
        setLastUpdated(new Date());
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, dispatch]);

  const isLoading = sessionsLoading || usersLoading || attendanceLoading;

  // Filter data by date range
  const getFilteredData = (data, dateField = 'created_at') => {
    if (!dateRange.startDate || !dateRange.endDate) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= new Date(dateRange.startDate) && 
             itemDate <= new Date(dateRange.endDate);
    });
  };

  // Calculate comprehensive analytics
  const calculateAnalytics = () => {
    const filteredSessions = getFilteredData(sessions, 'date_time');
    const filteredUsers = getFilteredData(users);
    const filteredAttendance = getFilteredData(stats?.attendanceRecords || [], 'timestamp');
    
    // User Analytics
    const totalUsers = filteredUsers.length;
    const adminCount = filteredUsers.filter(u => u.role === 'admin').length;
    const teacherCount = filteredUsers.filter(u => u.role === 'teacher').length;
    const studentCount = filteredUsers.filter(u => u.role === 'student').length;
    const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
    const inactiveUsers = totalUsers - activeUsers;
    
    // Session Analytics
    const totalSessions = filteredSessions.length;
    const liveSessions = filteredSessions.filter(s => s.status === 'live').length;
    const endedSessions = filteredSessions.filter(s => s.status === 'ended').length;
    const upcomingSessions = filteredSessions.filter(s => s.status === 'upcoming').length;
    
    // Attendance Analytics
    const totalAttendanceRecords = filteredAttendance.length;
    const presentRecords = filteredAttendance.filter(a => a.status === 'present').length;
    const absentRecords = totalAttendanceRecords - presentRecords;
    const overallAttendanceRate = totalAttendanceRecords > 0 ? 
      (presentRecords / totalAttendanceRecords * 100) : 0;
    
    // Teacher Performance
    const teacherPerformance = users.filter(u => u.role === 'teacher').map(teacher => {
      const teacherSessions = filteredSessions.filter(s => s.teacher_id === teacher.id);
      const teacherAttendance = filteredAttendance.filter(a => 
        teacherSessions.some(s => s.id === a.session_id)
      );
      const teacherPresent = teacherAttendance.filter(a => a.status === 'present').length;
      const attendanceRate = teacherAttendance.length > 0 ? 
        (teacherPresent / teacherAttendance.length * 100) : 0;
      
      return {
        ...teacher,
        sessionCount: teacherSessions.length,
        totalAttendance: teacherAttendance.length,
        attendanceRate,
        avgStudentsPerSession: teacherSessions.length > 0 ? 
          teacherAttendance.length / teacherSessions.length : 0
      };
    });
    
    // Student Engagement
    const studentEngagement = users.filter(u => u.role === 'student').map(student => {
      const studentAttendance = filteredAttendance.filter(a => a.student_id === student.id);
      const studentPresent = studentAttendance.filter(a => a.status === 'present').length;
      const attendanceRate = studentAttendance.length > 0 ? 
        (studentPresent / studentAttendance.length * 100) : 0;
      
      return {
        ...student,
        totalSessions: studentAttendance.length,
        attendedSessions: studentPresent,
        attendanceRate,
        engagementLevel: attendanceRate >= 80 ? 'High' : 
                        attendanceRate >= 60 ? 'Medium' : 'Low'
      };
    });
    
    // Course Analytics (if courses are tracked via sessions)
    const courseAnalytics = sessions.reduce((acc, session) => {
      const courseId = session.course_id || 'general';
      if (!acc[courseId]) {
        acc[courseId] = {
          courseId,
          sessionCount: 0,
          totalAttendance: 0,
          presentCount: 0,
          uniqueStudents: new Set()
        };
      }
      
      acc[courseId].sessionCount++;
      const sessionAttendance = filteredAttendance.filter(a => a.session_id === session.id);
      acc[courseId].totalAttendance += sessionAttendance.length;
      acc[courseId].presentCount += sessionAttendance.filter(a => a.status === 'present').length;
      
      sessionAttendance.forEach(a => acc[courseId].uniqueStudents.add(a.student_id));
      
      return acc;
    }, {});
    
    // Convert courseAnalytics to array
    const courseStats = Object.values(courseAnalytics).map(course => ({
      ...course,
      uniqueStudents: course.uniqueStudents.size,
      attendanceRate: course.totalAttendance > 0 ? 
        (course.presentCount / course.totalAttendance * 100) : 0
    }));
    
    // Time-based Analytics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recent30DaySessions = sessions.filter(s => 
      new Date(s.date_time) >= last30Days
    ).length;
    const recent7DaySessions = sessions.filter(s => 
      new Date(s.date_time) >= last7Days
    ).length;
    
    const recent30DayUsers = users.filter(u => 
      new Date(u.created_at) >= last30Days
    ).length;
    const recent7DayUsers = users.filter(u => 
      new Date(u.created_at) >= last7Days
    ).length;
    
    // Top Performers
    const topTeachers = teacherPerformance
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);
    
    const topStudents = studentEngagement
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);
    
    return {
      users: {
        total: totalUsers,
        admin: adminCount,
        teachers: teacherCount,
        students: studentCount,
        active: activeUsers,
        inactive: inactiveUsers,
        recent30Days: recent30DayUsers,
        recent7Days: recent7DayUsers
      },
      sessions: {
        total: totalSessions,
        live: liveSessions,
        ended: endedSessions,
        upcoming: upcomingSessions,
        recent30Days: recent30DaySessions,
        recent7Days: recent7DaySessions
      },
      attendance: {
        totalRecords: totalAttendanceRecords,
        present: presentRecords,
        absent: absentRecords,
        rate: overallAttendanceRate
      },
      teachers: teacherPerformance,
      students: studentEngagement,
      courses: courseStats,
      topPerformers: {
        teachers: topTeachers,
        students: topStudents
      }
    };
  };

  const analytics = calculateAnalytics();

  // Handle showing details modal
  const showDetails = (title, data) => {
    setModalTitle(title);
    setModalData(data);
    setShowDetailsModal(true);
  };

  // Refresh data manually
  const handleRefresh = () => {
    dispatch(fetchSessions());
    dispatch(fetchUsers());
    dispatch(fetchAttendanceStats());
    setLastUpdated(new Date());
  };

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </Spinner>
        <p className="mt-2">Loading analytics data...</p>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Page Header */}
      <Row className="mb-4">
        <Col>
          <h2>Analytics Dashboard</h2>
          <p className="text-muted">
            Comprehensive business intelligence and performance metrics
            <br />
            <small>Last updated: {lastUpdated.toLocaleString()}</small>
          </p>
        </Col>
        <Col xs="auto">
          <Form.Check
            type="switch"
            id="auto-refresh"
            label="Auto Refresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="me-3"
          />
          <Button variant="outline-primary" onClick={handleRefresh} className="me-2">
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
          <Dropdown>
            <Dropdown.Toggle variant="primary">
              <i className="bi bi-graph-up me-2"></i>
              View: {selectedMetric === 'overview' ? 'Overview' : 
                     selectedMetric === 'users' ? 'Users' :
                     selectedMetric === 'sessions' ? 'Sessions' : 'Performance'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setSelectedMetric('overview')}>
                Overview Dashboard
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSelectedMetric('users')}>
                User Analytics
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSelectedMetric('sessions')}>
                Session Analytics
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSelectedMetric('performance')}>
                Performance Metrics
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Date Range Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => setDateRange({ startDate: '', endDate: '' })}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Key Metrics Overview */}
      {(selectedMetric === 'overview' || selectedMetric === 'users') && (
        <>
          <h4 className="mb-3">User Metrics</h4>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100" style={{ cursor: 'pointer' }}
                    onClick={() => showDetails('User Distribution', analytics.users)}>
                <Card.Body>
                  <h3 className="text-primary">{analytics.users.total}</h3>
                  <p className="mb-1">Total Users</p>
                  <small className="text-muted">
                    +{analytics.users.recent7Days} this week
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-success">{analytics.users.students}</h3>
                  <p className="mb-1">Students</p>
                  <ProgressBar 
                    now={(analytics.users.students / analytics.users.total) * 100} 
                    variant="success"
                    size="sm"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-info">{analytics.users.teachers}</h3>
                  <p className="mb-1">Teachers</p>
                  <ProgressBar 
                    now={(analytics.users.teachers / analytics.users.total) * 100} 
                    variant="info"
                    size="sm"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-warning">{analytics.users.active}</h3>
                  <p className="mb-1">Active Users</p>
                  <ProgressBar 
                    now={(analytics.users.active / analytics.users.total) * 100} 
                    variant="warning"
                    size="sm"
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Session Metrics */}
      {(selectedMetric === 'overview' || selectedMetric === 'sessions') && (
        <>
          <h4 className="mb-3">Session Metrics</h4>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-primary">{analytics.sessions.total}</h3>
                  <p className="mb-1">Total Sessions</p>
                  <small className="text-muted">
                    +{analytics.sessions.recent7Days} this week
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-danger">{analytics.sessions.live}</h3>
                  <p className="mb-1">Live Sessions</p>
                  <Badge bg="danger" className="pulse">LIVE</Badge>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-success">{analytics.sessions.ended}</h3>
                  <p className="mb-1">Completed</p>
                  <ProgressBar 
                    now={(analytics.sessions.ended / analytics.sessions.total) * 100} 
                    variant="success"
                    size="sm"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-info">{analytics.sessions.upcoming}</h3>
                  <p className="mb-1">Upcoming</p>
                  <ProgressBar 
                    now={(analytics.sessions.upcoming / analytics.sessions.total) * 100} 
                    variant="info"
                    size="sm"
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Attendance Metrics */}
      {(selectedMetric === 'overview' || selectedMetric === 'performance') && (
        <>
          <h4 className="mb-3">Attendance & Performance</h4>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-primary">{analytics.attendance.totalRecords}</h3>
                  <p className="mb-1">Total Records</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-success">{analytics.attendance.present}</h3>
                  <p className="mb-1">Present</p>
                  <small className="text-success">
                    {analytics.attendance.rate.toFixed(1)}% attendance rate
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className="text-danger">{analytics.attendance.absent}</h3>
                  <p className="mb-1">Absent</p>
                  <ProgressBar 
                    now={analytics.attendance.rate} 
                    variant={analytics.attendance.rate >= 80 ? 'success' : 
                            analytics.attendance.rate >= 60 ? 'warning' : 'danger'}
                    size="sm"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <h3 className={`text-${analytics.attendance.rate >= 80 ? 'success' : 
                                        analytics.attendance.rate >= 60 ? 'warning' : 'danger'}`}>
                    {analytics.attendance.rate.toFixed(1)}%
                  </h3>
                  <p className="mb-1">Attendance Rate</p>
                  <Badge bg={analytics.attendance.rate >= 80 ? 'success' : 
                           analytics.attendance.rate >= 60 ? 'warning' : 'danger'}>
                    {analytics.attendance.rate >= 80 ? 'Excellent' : 
                     analytics.attendance.rate >= 60 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Top Performers */}
      {(selectedMetric === 'overview' || selectedMetric === 'performance') && (
        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Top Performing Teachers</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  {analytics.topPerformers.teachers.map((teacher, index) => (
                    <ListGroup.Item key={teacher.id} className="d-flex justify-content-between">
                      <div>
                        <strong>{teacher.name}</strong>
                        <br />
                        <small className="text-muted">
                          {teacher.sessionCount} sessions • {teacher.totalAttendance} total attendance
                        </small>
                      </div>
                      <div className="text-end">
                        <Badge bg={teacher.attendanceRate >= 80 ? 'success' : 'warning'}>
                          #{index + 1}
                        </Badge>
                        <br />
                        <small className="text-success">
                          {teacher.attendanceRate.toFixed(1)}%
                        </small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Top Performing Students</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  {analytics.topPerformers.students.map((student, index) => (
                    <ListGroup.Item key={student.id} className="d-flex justify-content-between">
                      <div>
                        <strong>{student.name}</strong>
                        <br />
                        <small className="text-muted">
                          {student.attendedSessions}/{student.totalSessions} sessions attended
                        </small>
                      </div>
                      <div className="text-end">
                        <Badge bg={student.attendanceRate >= 80 ? 'success' : 'warning'}>
                          #{index + 1}
                        </Badge>
                        <br />
                        <small className="text-success">
                          {student.attendanceRate.toFixed(1)}%
                        </small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Detailed Analytics Table */}
      {selectedMetric !== 'overview' && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              Detailed {selectedMetric === 'users' ? 'User' : 
                        selectedMetric === 'sessions' ? 'Session' : 'Performance'} Analytics
            </h5>
          </Card.Header>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  {selectedMetric === 'users' && (
                    <>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th>Sessions</th>
                      <th>Attendance Rate</th>
                    </>
                  )}
                  {selectedMetric === 'sessions' && (
                    <>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Teacher</th>
                      <th>Status</th>
                      <th>Attendance</th>
                      <th>Rate</th>
                    </>
                  )}
                  {selectedMetric === 'performance' && (
                    <>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Sessions/Records</th>
                      <th>Attendance Rate</th>
                      <th>Performance</th>
                      <th>Trend</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {selectedMetric === 'users' && users.slice(0, 10).map(user => {
                  const userSessions = selectedMetric === 'users' && user.role === 'student' ? 
                    (stats?.attendanceRecords || []).filter(a => a.student_id === user.id).length : 
                    sessions.filter(s => s.teacher_id === user.id).length;
                  const userAttendanceRate = user.role === 'student' ? 
                    analytics.students.find(s => s.id === user.id)?.attendanceRate || 0 :
                    analytics.teachers.find(t => t.id === user.id)?.attendanceRate || 0;
                  
                  return (
                    <tr key={user.id}>
                      <td><strong>{user.name}</strong></td>
                      <td><Badge bg={user.role === 'admin' ? 'danger' : 
                                     user.role === 'teacher' ? 'info' : 'success'}>
                            {user.role}
                          </Badge></td>
                      <td><Badge bg={user.status === 'active' ? 'success' : 'secondary'}>
                            {user.status}
                          </Badge></td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>{userSessions}</td>
                      <td>
                        <ProgressBar 
                          now={userAttendanceRate} 
                          label={`${userAttendanceRate.toFixed(1)}%`}
                          variant={userAttendanceRate >= 80 ? 'success' : 
                                  userAttendanceRate >= 60 ? 'warning' : 'danger'}
                        />
                      </td>
                    </tr>
                  );
                })}
                
                {selectedMetric === 'sessions' && sessions.slice(0, 10).map(session => {
                  const sessionAttendance = (stats?.attendanceRecords || []).filter(a => a.session_id === session.id);
                  const presentCount = sessionAttendance.filter(a => a.status === 'present').length;
                  const attendanceRate = sessionAttendance.length > 0 ? 
                    (presentCount / sessionAttendance.length * 100) : 0;
                  const teacher = users.find(u => u.id === session.teacher_id);
                  
                  return (
                    <tr key={session.id}>
                      <td><strong>{session.title}</strong></td>
                      <td>{new Date(session.date_time).toLocaleDateString()}</td>
                      <td>{teacher?.name || 'Unknown'}</td>
                      <td>
                        <Badge bg={session.status === 'live' ? 'danger' : 
                                  session.status === 'ended' ? 'success' : 'info'}>
                          {session.status}
                        </Badge>
                      </td>
                      <td>{presentCount}/{sessionAttendance.length}</td>
                      <td>
                        <ProgressBar 
                          now={attendanceRate} 
                          label={`${attendanceRate.toFixed(1)}%`}
                          variant={attendanceRate >= 80 ? 'success' : 
                                  attendanceRate >= 60 ? 'warning' : 'danger'}
                        />
                      </td>
                    </tr>
                  );
                })}
                
                {selectedMetric === 'performance' && (
                  <>
                    {analytics.teachers.slice(0, 5).map(teacher => (
                      <tr key={`teacher-${teacher.id}`}>
                        <td><strong>{teacher.name}</strong></td>
                        <td><Badge bg="info">Teacher</Badge></td>
                        <td>{teacher.sessionCount} sessions</td>
                        <td>
                          <ProgressBar 
                            now={teacher.attendanceRate} 
                            label={`${teacher.attendanceRate.toFixed(1)}%`}
                            variant={teacher.attendanceRate >= 80 ? 'success' : 
                                    teacher.attendanceRate >= 60 ? 'warning' : 'danger'}
                          />
                        </td>
                        <td>
                          <Badge bg={teacher.attendanceRate >= 80 ? 'success' : 
                                   teacher.attendanceRate >= 60 ? 'warning' : 'danger'}>
                            {teacher.attendanceRate >= 80 ? 'Excellent' : 
                             teacher.attendanceRate >= 60 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </td>
                        <td>
                          <i className={`bi bi-arrow-${teacher.attendanceRate >= 75 ? 'up' : 'down'} 
                                         text-${teacher.attendanceRate >= 75 ? 'success' : 'danger'}`}></i>
                        </td>
                      </tr>
                    ))}
                    {analytics.students.slice(0, 5).map(student => (
                      <tr key={`student-${student.id}`}>
                        <td><strong>{student.name}</strong></td>
                        <td><Badge bg="success">Student</Badge></td>
                        <td>{student.totalSessions} records</td>
                        <td>
                          <ProgressBar 
                            now={student.attendanceRate} 
                            label={`${student.attendanceRate.toFixed(1)}%`}
                            variant={student.attendanceRate >= 80 ? 'success' : 
                                    student.attendanceRate >= 60 ? 'warning' : 'danger'}
                          />
                        </td>
                        <td>
                          <Badge bg={student.attendanceRate >= 80 ? 'success' : 
                                   student.attendanceRate >= 60 ? 'warning' : 'danger'}>
                            {student.engagementLevel}
                          </Badge>
                        </td>
                        <td>
                          <i className={`bi bi-arrow-${student.attendanceRate >= 75 ? 'up' : 'down'} 
                                         text-${student.attendanceRate >= 75 ? 'success' : 'danger'}`}></i>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalData && (
            <Row>
              <Col md={6}>
                <h6>User Distribution</h6>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    Total Users <Badge bg="primary">{modalData.total}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    Students <Badge bg="success">{modalData.students}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    Teachers <Badge bg="info">{modalData.teachers}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    Admins <Badge bg="danger">{modalData.admin}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col md={6}>
                <h6>Activity Statistics</h6>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    Active Users <Badge bg="success">{modalData.active}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    Inactive Users <Badge bg="secondary">{modalData.inactive}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    New (30 days) <Badge bg="info">{modalData.recent30Days}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    New (7 days) <Badge bg="warning">{modalData.recent7Days}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AnalyticsDashboard;
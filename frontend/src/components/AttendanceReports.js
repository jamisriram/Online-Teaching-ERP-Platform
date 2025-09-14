import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Form, 
  Badge, Alert, Spinner, Pagination,
  Modal, ProgressBar
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSessions } from '../store/slices/sessionsSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { fetchAttendanceStats } from '../store/slices/attendanceSlice';

/**
 * Attendance Reports Component for Admin Dashboard
 * Provides comprehensive attendance analytics and reporting
 */
const AttendanceReports = () => {
  const dispatch = useDispatch();
  const { sessions = [] } = useSelector((state) => state.sessions);
  const { users = [] } = useSelector((state) => state.users);
  const { stats: attendanceStats = [], isLoading, error } = useSelector((state) => state.attendance);
  
  // Filter states
  const [selectedSession, setSelectedSession] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // View states
  const [reportType, setReportType] = useState('overview'); // 'overview', 'session', 'student', 'teacher'
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(15);
  
  // Success/error messaging
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchUsers());
    dispatch(fetchAttendanceStats());
  }, [dispatch]);

  // Get filtered data
  const teachers = users.filter(user => user.role === 'teacher' || user.role === 'admin');
  const students = users.filter(user => user.role === 'student');

  // Process attendance data
  const processAttendanceData = () => {
    let filteredAttendance = [...(attendanceStats?.attendanceRecords || [])];
    
    // Filter by session
    if (selectedSession !== 'all') {
      filteredAttendance = filteredAttendance.filter(record => 
        record.session_id.toString() === selectedSession
      );
    }
    
    // Filter by student
    if (selectedStudent !== 'all') {
      filteredAttendance = filteredAttendance.filter(record => 
        record.student_id.toString() === selectedStudent
      );
    }
    
    // Filter by teacher (via session)
    if (selectedTeacher !== 'all') {
      const teacherSessions = sessions.filter(session => 
        session.teacher_id.toString() === selectedTeacher
      ).map(session => session.id);
      
      filteredAttendance = filteredAttendance.filter(record => 
        teacherSessions.includes(record.session_id)
      );
    }
    
    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filteredAttendance = filteredAttendance.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= new Date(dateRange.startDate) && 
               recordDate <= new Date(dateRange.endDate);
      });
    }
    
    return filteredAttendance;
  };

  // Calculate statistics
  const calculateStats = () => {
    const filteredData = processAttendanceData();
    const totalSessions = sessions.length;
    const totalStudents = students.length;
    
    // Overall statistics
    const totalAttendanceRecords = filteredData.length;
    const presentRecords = filteredData.filter(record => record.status === 'present').length;
    const absentRecords = totalAttendanceRecords - presentRecords;
    const attendanceRate = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords * 100) : 0;
    
    // Session-wise statistics
    const sessionStats = sessions.map(session => {
      const sessionAttendance = filteredData.filter(record => record.session_id === session.id);
      const sessionPresent = sessionAttendance.filter(record => record.status === 'present').length;
      const sessionTotal = sessionAttendance.length;
      const sessionRate = sessionTotal > 0 ? (sessionPresent / sessionTotal * 100) : 0;
      
      return {
        ...session,
        totalAttendees: sessionTotal,
        presentCount: sessionPresent,
        absentCount: sessionTotal - sessionPresent,
        attendanceRate: sessionRate
      };
    });
    
    // Student-wise statistics
    const studentStats = students.map(student => {
      const studentAttendance = filteredData.filter(record => record.student_id === student.id);
      const studentPresent = studentAttendance.filter(record => record.status === 'present').length;
      const studentTotal = studentAttendance.length;
      const studentRate = studentTotal > 0 ? (studentPresent / studentTotal * 100) : 0;
      
      return {
        ...student,
        totalSessions: studentTotal,
        attendedSessions: studentPresent,
        missedSessions: studentTotal - studentPresent,
        attendanceRate: studentRate
      };
    });
    
    return {
      overall: {
        totalSessions,
        totalStudents,
        totalRecords: totalAttendanceRecords,
        presentRecords,
        absentRecords,
        attendanceRate
      },
      sessions: sessionStats,
      students: studentStats
    };
  };

  const reportStats = calculateStats();
  
  // Pagination for current view
  const getCurrentPageData = () => {
    let data = [];
    
    switch (reportType) {
      case 'session':
        data = reportStats.sessions;
        break;
      case 'student':
        data = reportStats.students;
        break;
      case 'teacher':
        data = teachers.map(teacher => {
          const teacherSessions = sessions.filter(s => s.teacher_id === teacher.id);
          const teacherAttendance = processAttendanceData().filter(record => 
            teacherSessions.some(session => session.id === record.session_id)
          );
          const presentCount = teacherAttendance.filter(r => r.status === 'present').length;
          const totalCount = teacherAttendance.length;
          
          return {
            ...teacher,
            totalSessions: teacherSessions.length,
            totalAttendance: totalCount,
            presentCount,
            absentCount: totalCount - presentCount,
            attendanceRate: totalCount > 0 ? (presentCount / totalCount * 100) : 0
          };
        });
        break;
      default:
        data = processAttendanceData().map(record => {
          const session = sessions.find(s => s.id === record.session_id);
          const student = students.find(s => s.id === record.student_id);
          const teacher = teachers.find(t => t.id === session?.teacher_id);
          
          return {
            ...record,
            sessionTitle: session?.title || 'Unknown Session',
            studentName: student?.name || 'Unknown Student',
            teacherName: teacher?.name || 'Unknown Teacher',
            sessionDate: session?.date_time
          };
        });
    }
    
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return data.slice(indexOfFirstRecord, indexOfLastRecord);
  };

  const currentData = getCurrentPageData();
  const totalPages = Math.ceil(
    (reportType === 'session' ? reportStats.sessions.length : 
     reportType === 'student' ? reportStats.students.length :
     reportType === 'teacher' ? teachers.length :
     processAttendanceData().length) / recordsPerPage
  );

  // Export functionality
  const handleExport = () => {
    const data = reportType === 'session' ? reportStats.sessions :
                  reportType === 'student' ? reportStats.students :
                  reportType === 'teacher' ? teachers : processAttendanceData();
    
    if (exportFormat === 'csv') {
      exportToCSV(data);
    } else if (exportFormat === 'json') {
      exportToJSON(data);
    }
    
    setShowExportModal(false);
    showSuccessAlert('Report exported successfully!');
  };

  const exportToCSV = (data) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (data) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Alert helpers
  const showSuccessAlert = (message) => {
    setAlertMessage(message);
    setAlertType('success');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading attendance data...</p>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Success/Error Alert */}
      {showAlert && (
        <Alert variant={alertType} dismissible onClose={() => setShowAlert(false)}>
          {alertMessage}
        </Alert>
      )}

      {/* Page Header */}
      <Row className="mb-4">
        <Col>
          <h2>Attendance Reports</h2>
          <p className="text-muted">Comprehensive attendance analytics and reporting</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-primary" 
            onClick={() => setShowExportModal(true)}
            className="me-2"
          >
            <i className="bi bi-download me-2"></i>
            Export Report
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-2"></i>
            Print Report
          </Button>
        </Col>
      </Row>

      {/* Overall Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{reportStats.overall.totalRecords}</h3>
              <p className="mb-0">Total Records</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{reportStats.overall.presentRecords}</h3>
              <p className="mb-0">Present</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{reportStats.overall.absentRecords}</h3>
              <p className="mb-0">Absent</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{reportStats.overall.attendanceRate.toFixed(1)}%</h3>
              <p className="mb-0">Attendance Rate</p>
              <ProgressBar 
                now={reportStats.overall.attendanceRate} 
                variant={reportStats.overall.attendanceRate >= 80 ? 'success' : 
                        reportStats.overall.attendanceRate >= 60 ? 'warning' : 'danger'}
                size="sm"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Report Type</Form.Label>
                <Form.Select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="overview">Overview</option>
                  <option value="session">By Session</option>
                  <option value="student">By Student</option>
                  <option value="teacher">By Teacher</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Session</Form.Label>
                <Form.Select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <option value="all">All Sessions</option>
                  {sessions.map(session => (
                    <option key={session.id} value={session.id}>
                      {session.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Student</Form.Label>
                <Form.Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="all">All Students</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Teacher</Form.Label>
                <Form.Select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <option value="all">All Teachers</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Report Content */}
      <Card>
        <Card.Body>
          {error && (
            <Alert variant="danger">
              <strong>Error:</strong> {error}
            </Alert>
          )}

          <Table responsive hover>
            <thead>
              <tr>
                {reportType === 'overview' && (
                  <>
                    <th>Session</th>
                    <th>Student</th>
                    <th>Teacher</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Marked At</th>
                  </>
                )}
                {reportType === 'session' && (
                  <>
                    <th>Session Title</th>
                    <th>Date</th>
                    <th>Teacher</th>
                    <th>Total Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Attendance Rate</th>
                  </>
                )}
                {reportType === 'student' && (
                  <>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Total Sessions</th>
                    <th>Attended</th>
                    <th>Missed</th>
                    <th>Attendance Rate</th>
                    <th>Status</th>
                  </>
                )}
                {reportType === 'teacher' && (
                  <>
                    <th>Teacher Name</th>
                    <th>Email</th>
                    <th>Total Sessions</th>
                    <th>Total Attendance</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Avg. Attendance Rate</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((record, index) => (
                  <tr key={record.id || index}>
                    {reportType === 'overview' && (
                      <>
                        <td>{record.sessionTitle}</td>
                        <td>{record.studentName}</td>
                        <td>{record.teacherName}</td>
                        <td>{new Date(record.sessionDate).toLocaleDateString()}</td>
                        <td>
                          <Badge bg={record.status === 'present' ? 'success' : 'danger'}>
                            {record.status === 'present' ? 'Present' : 'Absent'}
                          </Badge>
                        </td>
                        <td>{new Date(record.timestamp).toLocaleString()}</td>
                      </>
                    )}
                    {reportType === 'session' && (
                      <>
                        <td><strong>{record.title}</strong></td>
                        <td>{new Date(record.date_time).toLocaleDateString()}</td>
                        <td>{teachers.find(t => t.id === record.teacher_id)?.name}</td>
                        <td>{record.totalAttendees}</td>
                        <td><span className="text-success">{record.presentCount}</span></td>
                        <td><span className="text-danger">{record.absentCount}</span></td>
                        <td>
                          <ProgressBar 
                            now={record.attendanceRate} 
                            label={`${record.attendanceRate.toFixed(1)}%`}
                            variant={record.attendanceRate >= 80 ? 'success' : 
                                    record.attendanceRate >= 60 ? 'warning' : 'danger'}
                          />
                        </td>
                      </>
                    )}
                    {reportType === 'student' && (
                      <>
                        <td><strong>{record.name}</strong></td>
                        <td>{record.email}</td>
                        <td>{record.totalSessions}</td>
                        <td><span className="text-success">{record.attendedSessions}</span></td>
                        <td><span className="text-danger">{record.missedSessions}</span></td>
                        <td>
                          <ProgressBar 
                            now={record.attendanceRate} 
                            label={`${record.attendanceRate.toFixed(1)}%`}
                            variant={record.attendanceRate >= 80 ? 'success' : 
                                    record.attendanceRate >= 60 ? 'warning' : 'danger'}
                          />
                        </td>
                        <td>
                          <Badge bg={record.attendanceRate >= 80 ? 'success' : 
                                     record.attendanceRate >= 60 ? 'warning' : 'danger'}>
                            {record.attendanceRate >= 80 ? 'Excellent' : 
                             record.attendanceRate >= 60 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </td>
                      </>
                    )}
                    {reportType === 'teacher' && (
                      <>
                        <td><strong>{record.name}</strong></td>
                        <td>{record.email}</td>
                        <td>{record.totalSessions}</td>
                        <td>{record.totalAttendance}</td>
                        <td><span className="text-success">{record.presentCount}</span></td>
                        <td><span className="text-danger">{record.absentCount}</span></td>
                        <td>
                          <ProgressBar 
                            now={record.attendanceRate} 
                            label={`${record.attendanceRate.toFixed(1)}%`}
                            variant={record.attendanceRate >= 80 ? 'success' : 
                                    record.attendanceRate >= 60 ? 'warning' : 'danger'}
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={reportType === 'overview' ? 6 : 7} className="text-center py-4">
                    <div className="text-muted">
                      <i className="bi bi-clipboard-data fs-1"></i>
                      <p className="mt-2">No attendance data found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                />
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Export Format</Form.Label>
            <Form.Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="csv">CSV (Excel Compatible)</option>
              <option value="json">JSON (Data Format)</option>
            </Form.Select>
          </Form.Group>
          <Alert variant="info">
            <strong>Note:</strong> The exported file will contain data based on your current filters and report type.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport}>
            <i className="bi bi-download me-2"></i>
            Export Report
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AttendanceReports;
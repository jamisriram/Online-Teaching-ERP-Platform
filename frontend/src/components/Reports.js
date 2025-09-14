import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import attendanceService from '../services/attendanceService';
import sessionService from '../services/sessionService';

const Reports = () => {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const [summaryStats, setSummaryStats] = useState({
    totalSessions: 0,
    totalStudents: 0,
    averageAttendance: 0
  });

  useEffect(() => {
    // Set default date range to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    generateSummaryReport();
  }, []);

  const generateSummaryReport = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch sessions
      const sessionsResponse = await sessionService.getTeacherSessions();
      const sessions = sessionsResponse.data.sessions || [];

      // Calculate summary statistics
      const totalSessions = sessions.length;
      let totalStudentAttendance = 0;
      let sessionCount = 0;

      // For each session, get attendance data
      for (const session of sessions) {
        try {
          const attendanceResponse = await attendanceService.getSessionAttendance(session.id);
          const attendance = attendanceResponse.data || [];
          const presentCount = attendance.filter(record => record.status === 'present').length;
          totalStudentAttendance += presentCount;
          sessionCount++;
        } catch (err) {
          console.error(`Error fetching attendance for session ${session.id}:`, err);
        }
      }

      const averageAttendance = sessionCount > 0 ? (totalStudentAttendance / sessionCount).toFixed(1) : 0;

      setSummaryStats({
        totalSessions,
        totalStudents: totalStudentAttendance,
        averageAttendance
      });

    } catch (err) {
      console.error('Error generating summary report:', err);
      setError('Failed to generate summary report');
    } finally {
      setLoading(false);
    }
  };

  const generateDetailedReport = async () => {
    try {
      setLoading(true);
      setError('');

      const sessionsResponse = await sessionService.getTeacherSessions();
      const sessions = sessionsResponse.data.sessions || [];

      // Filter sessions by date range if specified
      let filteredSessions = sessions;
      if (dateRange.startDate && dateRange.endDate) {
        filteredSessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          const start = new Date(dateRange.startDate);
          const end = new Date(dateRange.endDate);
          return sessionDate >= start && sessionDate <= end;
        });
      }

      // Get detailed attendance for each session
      const detailedData = [];
      for (const session of filteredSessions) {
        try {
          const attendanceResponse = await attendanceService.getSessionAttendance(session.id);
          const attendance = attendanceResponse.data || [];
          
          detailedData.push({
            session,
            attendance: attendance.length,
            present: attendance.filter(record => record.status === 'present').length,
            absent: attendance.filter(record => record.status === 'absent').length,
            attendanceRate: attendance.length > 0 
              ? ((attendance.filter(record => record.status === 'present').length / attendance.length) * 100).toFixed(1)
              : '0'
          });
        } catch (err) {
          console.error(`Error fetching attendance for session ${session.id}:`, err);
        }
      }

      setReportData(detailedData);

    } catch (err) {
      console.error('Error generating detailed report:', err);
      setError('Failed to generate detailed report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (reportType === 'summary') {
      generateSummaryReport();
    } else {
      generateDetailedReport();
    }
  };

  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Session', 'Subject', 'Duration', 'Total Students', 'Present', 'Absent', 'Attendance Rate'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        new Date(row.session.date).toLocaleDateString(),
        row.session.title,
        row.session.subject,
        `${row.session.duration} min`,
        row.attendance,
        row.present,
        row.absent,
        `${row.attendanceRate}%`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Reports & Analytics</h2>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="text-primary">Total Sessions</Card.Title>
              <h2 className="mb-0">{summaryStats.totalSessions}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="text-success">Student Enrollments</Card.Title>
              <h2 className="mb-0">{summaryStats.totalStudents}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="text-info">Avg. Attendance</Card.Title>
              <h2 className="mb-0">{summaryStats.averageAttendance}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Report Configuration */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Generate Report</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Report Type</Form.Label>
                <Form.Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="summary">Summary Report</option>
                  <option value="detailed">Detailed Report</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {reportType === 'detailed' && (
              <>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </>
            )}
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={handleGenerateReport}
                disabled={loading}
                className="me-2"
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Generate Report'}
              </Button>
              {reportData && reportData.length > 0 && (
                <Button variant="outline-secondary" onClick={exportToCSV}>
                  Export CSV
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Detailed Report Table */}
      {reportType === 'detailed' && reportData && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Detailed Attendance Report</h5>
          </Card.Header>
          <Card.Body>
            {reportData.length === 0 ? (
              <p className="text-muted text-center py-4">No sessions found for the selected date range.</p>
            ) : (
              <Table responsive striped>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Subject</th>
                    <th>Duration</th>
                    <th>Total Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index}>
                      <td>{new Date(row.session.date).toLocaleDateString()}</td>
                      <td>{row.session.title}</td>
                      <td>{row.session.subject}</td>
                      <td>{row.session.duration} min</td>
                      <td>{row.attendance}</td>
                      <td className="text-success">{row.present}</td>
                      <td className="text-danger">{row.absent}</td>
                      <td>
                        <span className={`badge ${
                          parseFloat(row.attendanceRate) >= 80 ? 'bg-success' :
                          parseFloat(row.attendanceRate) >= 60 ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {row.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Reports;
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import sessionService from '../services/sessionService';
import attendanceService from '../services/attendanceService';
import LoadingSpinner from './LoadingSpinner';

/**
 * Attendance Management Component
 * Manage attendance for teacher's sessions
 */
const AttendanceManagement = () => {
  const { sessionId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

  useEffect(() => {
    fetchSessions();
    if (sessionId) {
      fetchSessionAttendance(sessionId);
    }
  }, [sessionId]);

  const fetchSessions = async () => {
    try {
      const response = await sessionService.getAllSessions();
      setSessions(response.data.sessions || []);
      
      if (sessionId) {
        const session = response.data.sessions.find(s => s.id === parseInt(sessionId));
        setSelectedSession(session);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchSessionAttendance = async (sessionId) => {
    try {
      setIsLoading(true);
      const response = await attendanceService.getSessionAttendance(sessionId);
      setAttendance(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAlert({
        show: true,
        message: 'Failed to load attendance data',
        variant: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    fetchSessionAttendance(session.id);
  };

  const markAttendance = async (studentId, status) => {
    try {
      await attendanceService.markAttendance(selectedSession.id, studentId, status);
      setAlert({
        show: true,
        message: 'Attendance marked successfully!',
        variant: 'success'
      });
      fetchSessionAttendance(selectedSession.id);
    } catch (error) {
      console.error('Error marking attendance:', error);
      setAlert({
        show: true,
        message: 'Failed to mark attendance',
        variant: 'danger'
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      present: 'success',
      absent: 'danger',
      late: 'warning'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && sessionId) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h2 className="mb-4">
            <i className="bi bi-check-circle me-2"></i>
            Attendance Management
          </h2>

          {alert.show && (
            <Alert 
              variant={alert.variant} 
              onClose={() => setAlert({ show: false, message: '', variant: '' })}
              dismissible
              className="mb-4"
            >
              {alert.message}
            </Alert>
          )}

          <Row>
            {/* Session Selection */}
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Select Session</h5>
                </Card.Header>
                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {sessions.length === 0 ? (
                    <p className="text-muted">No sessions found</p>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-2 mb-2 border rounded cursor-pointer ${
                          selectedSession?.id === session.id ? 'bg-primary text-white' : 'bg-light'
                        }`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSessionSelect(session)}
                      >
                        <strong>{session.title}</strong>
                        <br />
                        <small>{formatDateTime(session.date_time)}</small>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Attendance Details */}
            <Col md={8}>
              {selectedSession ? (
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      Attendance for: {selectedSession.title}
                    </h5>
                    <small className="text-muted">
                      {formatDateTime(selectedSession.date_time)}
                    </small>
                  </Card.Header>
                  <Card.Body>
                    {attendance.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
                        <h5 className="text-muted mt-2">No attendance records</h5>
                        <p className="text-muted">
                          Students will appear here when they join the session or when you mark their attendance manually.
                        </p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover>
                          <thead>
                            <tr>
                              <th>Student Name</th>
                              <th>Email</th>
                              <th>Status</th>
                              <th>Timestamp</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.map((record) => (
                              <tr key={record.id}>
                                <td>
                                  <strong>{record.student_name}</strong>
                                </td>
                                <td>{record.student_email}</td>
                                <td>{getStatusBadge(record.status)}</td>
                                <td>{formatDateTime(record.timestamp)}</td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      onClick={() => markAttendance(record.student_id, 'present')}
                                      title="Mark Present"
                                    >
                                      <i className="bi bi-check"></i>
                                    </Button>
                                    <Button
                                      variant="outline-warning"
                                      size="sm"
                                      onClick={() => markAttendance(record.student_id, 'late')}
                                      title="Mark Late"
                                    >
                                      <i className="bi bi-clock"></i>
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => markAttendance(record.student_id, 'absent')}
                                      title="Mark Absent"
                                    >
                                      <i className="bi bi-x"></i>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}

                    {/* Attendance Summary */}
                    {attendance.length > 0 && (
                      <Card className="mt-3 bg-light">
                        <Card.Body>
                          <h6>Attendance Summary</h6>
                          <Row>
                            <Col sm={3}>
                              <div className="text-center">
                                <h4 className="text-success mb-0">
                                  {attendance.filter(r => r.status === 'present').length}
                                </h4>
                                <small className="text-muted">Present</small>
                              </div>
                            </Col>
                            <Col sm={3}>
                              <div className="text-center">
                                <h4 className="text-warning mb-0">
                                  {attendance.filter(r => r.status === 'late').length}
                                </h4>
                                <small className="text-muted">Late</small>
                              </div>
                            </Col>
                            <Col sm={3}>
                              <div className="text-center">
                                <h4 className="text-danger mb-0">
                                  {attendance.filter(r => r.status === 'absent').length}
                                </h4>
                                <small className="text-muted">Absent</small>
                              </div>
                            </Col>
                            <Col sm={3}>
                              <div className="text-center">
                                <h4 className="text-primary mb-0">
                                  {attendance.length}
                                </h4>
                                <small className="text-muted">Total</small>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}
                  </Card.Body>
                </Card>
              ) : (
                <Card>
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-calendar-week text-muted" style={{ fontSize: '4rem' }}></i>
                    <h4 className="text-muted mt-3">Select a Session</h4>
                    <p className="text-muted">Choose a session from the left to view and manage attendance</p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default AttendanceManagement;
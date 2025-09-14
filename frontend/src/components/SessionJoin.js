import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import sessionService from '../services/sessionService';
import attendanceService from '../services/attendanceService';

/**
 * Session Join Component with Attendance Check-in
 * Students must check-in to mark attendance before joining the meeting
 */
const SessionJoin = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState('');
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSession = async () => {
    try {
      const response = await sessionService.getSessionById(sessionId);
      setSession(response.data.session);
      
      // Check if student is already marked present
      await checkExistingAttendance();
    } catch (error) {
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAttendance = async () => {
    try {
      const response = await attendanceService.getStudentAttendance();
      const sessionAttendance = response.data.attendance.find(
        att => att.session_id === parseInt(sessionId)
      );
      if (sessionAttendance?.status === 'present') {
        setCheckedIn(true);
      }
    } catch (error) {
      console.log('No existing attendance found');
    }
  };

  const updateTimeRemaining = () => {
    if (!session) return;
    
    const sessionTime = new Date(session.date_time);
    const now = new Date();
    const diffMs = sessionTime - now;
    
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    } else {
      setTimeRemaining('Session has started');
    }
  };

  const handleCheckIn = async () => {
    try {
      setError('');
      
      // Use the new check-in API
      await attendanceService.checkInWithCode(sessionId, attendanceCode);
      setCheckedIn(true);
      
    } catch (error) {
      if (error.response?.status === 400) {
        setError(error.response.data.message || 'Invalid attendance code');
      } else {
        setError('Failed to check in. Please try again.');
      }
    }
  };

  const handleJoinMeeting = () => {
    if (!checkedIn) {
      setError('You must check in first to mark your attendance');
      return;
    }
    
    // Open meeting in new tab
    window.open(session.meeting_link, '_blank');
  };

  if (loading) {
    return <Container className="text-center mt-5"><h4>Loading session...</h4></Container>;
  }

  if (!session) {
    return <Container className="text-center mt-5"><h4>Session not found</h4></Container>;
  }

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Join Session</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              {/* Session Details */}
              <div className="mb-4">
                <h5>{session.title}</h5>
                <p className="text-muted">{session.description}</p>
                <div className="d-flex justify-content-between">
                  <span><strong>Date:</strong> {new Date(session.date_time).toLocaleDateString()}</span>
                  <span><strong>Time:</strong> {new Date(session.date_time).toLocaleTimeString()}</span>
                </div>
                {timeRemaining && (
                  <div className="mt-2">
                    <Badge bg={timeRemaining === 'Session has started' ? 'success' : 'info'}>
                      {timeRemaining === 'Session has started' ? '🔴 LIVE' : `⏰ Starts in ${timeRemaining}`}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Attendance Check-in */}
              {!checkedIn ? (
                <Card className="border-warning mb-3">
                  <Card.Body>
                    <h6 className="text-warning">📝 Attendance Check-in Required</h6>
                    <p>You must check in to mark your attendance before joining the meeting.</p>
                    
                    {session.attendance_code && (
                      <Form.Group className="mb-3">
                        <Form.Label>Attendance Code</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter the code provided by your teacher"
                          value={attendanceCode}
                          onChange={(e) => setAttendanceCode(e.target.value.toUpperCase())}
                        />
                        <Form.Text className="text-muted">
                          Ask your teacher for the attendance code
                        </Form.Text>
                      </Form.Group>
                    )}
                    
                    <Button 
                      variant="warning" 
                      onClick={handleCheckIn}
                      disabled={session.attendance_code && !attendanceCode}
                    >
                      ✅ Check In & Mark Attendance
                    </Button>
                  </Card.Body>
                </Card>
              ) : (
                <Alert variant="success">
                  ✅ <strong>Checked In!</strong> Your attendance has been marked as present.
                </Alert>
              )}

              {/* Join Meeting Button */}
              <div className="text-center">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={handleJoinMeeting}
                  disabled={!checkedIn}
                  className="me-3"
                >
                  🎥 Join Google Meet
                </Button>
                
                <Button 
                  variant="outline-secondary"
                  onClick={() => navigate('/student-dashboard')}
                >
                  ← Back to Dashboard
                </Button>
              </div>

              {/* Meeting Link (for manual access) */}
              {checkedIn && (
                <Card className="mt-4 border-info">
                  <Card.Body>
                    <h6 className="text-info">🔗 Meeting Link</h6>
                    <Form.Control 
                      type="text" 
                      value={session.meeting_link} 
                      readOnly 
                    />
                    <Form.Text className="text-muted">
                      You can also copy this link to join manually
                    </Form.Text>
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SessionJoin;
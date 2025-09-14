import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal } from 'react-bootstrap';
import sessionService from '../services/sessionService';
import attendanceService from '../services/attendanceService';

/**
 * Live Session Control for Teachers
 * Generate attendance codes and monitor real-time attendance
 */
const LiveSessionControl = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [attendanceCode, setAttendanceCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [liveAttendance, setLiveAttendance] = useState([]);

  useEffect(() => {
    fetchTodaySessions();
  }, []);

  const fetchTodaySessions = async () => {
    try {
      const response = await sessionService.getTeacherSessions();
      const today = new Date().toDateString();
      const todaySessions = response.data.sessions.filter(session => 
        new Date(session.date_time).toDateString() === today
      );
      setSessions(todaySessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const generateAttendanceCode = () => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setAttendanceCode(code);
    return code;
  };

  const startLiveSession = async (session) => {
    try {
      const code = generateAttendanceCode();
      
      // Update session with attendance code
      await sessionService.updateSession(session.id, {
        ...session,
        attendance_code: code,
        is_live: true
      });

      setActiveSession(session);
      setShowCodeModal(true);
      
      // Start monitoring attendance
      monitorAttendance(session.id);
      
    } catch (error) {
      console.error('Error starting live session:', error);
    }
  };

  const monitorAttendance = async (sessionId) => {
    // Cache for attendance data
    let attendanceCache = {
      data: [],
      timestamp: 0
    };
    
    const fetchAttendance = async () => {
      // Skip if page is not visible
      if (document.visibilityState !== 'visible') return;
      
      try {
        // Check cache validity (45 seconds)
        const cacheAge = Date.now() - attendanceCache.timestamp;
        if (cacheAge < 45000 && attendanceCache.data.length > 0) {
          return; // Use cached data
        }
        
        const response = await attendanceService.getSessionAttendance(sessionId);
        const newAttendance = response.data.attendance || [];
        
        // Update cache
        attendanceCache = {
          data: newAttendance,
          timestamp: Date.now()
        };
        
        setLiveAttendance(newAttendance);
        
        // Log only significant changes
        if (newAttendance.length !== attendanceCache.data.length) {
          console.log(`Attendance update: ${newAttendance.length} students present`);
        }
      } catch (error) {
        console.error('Error monitoring attendance:', error);
      }
    };

    // Initial fetch
    fetchAttendance();
    
    // Reduced polling frequency and smart caching
    const interval = setInterval(fetchAttendance, 60000); // 1 minute interval

    // Store interval ID to clear later
    setActiveSession(prev => ({ ...prev, monitorInterval: interval }));
  };

  const endLiveSession = async () => {
    try {
      if (activeSession?.monitorInterval) {
        clearInterval(activeSession.monitorInterval);
      }

      await sessionService.updateSession(activeSession.id, {
        ...activeSession,
        attendance_code: null,
        is_live: false
      });

      setActiveSession(null);
      setAttendanceCode('');
      setLiveAttendance([]);
      
    } catch (error) {
      console.error('Error ending live session:', error);
    }
  };

  const copyAttendanceCode = () => {
    navigator.clipboard.writeText(attendanceCode);
    alert('Attendance code copied to clipboard!');
  };

  return (
    <Container fluid className="p-4">
      <h2 className="mb-4">🔴 Live Session Control</h2>

      {/* Today's Sessions */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Today's Sessions</h5>
            </Card.Header>
            <Card.Body>
              {sessions.length === 0 ? (
                <p className="text-muted">No sessions scheduled for today</p>
              ) : (
                sessions.map(session => (
                  <Card key={session.id} className="mb-3 border-info">
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={8}>
                          <h6>{session.title}</h6>
                          <p className="text-muted mb-1">{session.description}</p>
                          <small className="text-muted">
                            {new Date(session.date_time).toLocaleTimeString()}
                          </small>
                        </Col>
                        <Col md={4} className="text-end">
                          {activeSession?.id === session.id ? (
                            <Badge bg="success" className="me-2">🔴 LIVE</Badge>
                          ) : (
                            <Button 
                              variant="success" 
                              onClick={() => startLiveSession(session)}
                            >
                              🎬 Start Live Session
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Live Session Dashboard */}
      {activeSession && (
        <Row>
          <Col md={6}>
            <Card className="border-success">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">🔴 Live: {activeSession.title}</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <h3 className="text-success">{attendanceCode}</h3>
                  <p className="text-muted">Attendance Code</p>
                  <Button variant="outline-secondary" size="sm" onClick={copyAttendanceCode}>
                    📋 Copy Code
                  </Button>
                </div>
                
                <Alert variant="info">
                  <strong>Instructions for Students:</strong><br/>
                  1. Go to session join page<br/>
                  2. Enter attendance code: <strong>{attendanceCode}</strong><br/>
                  3. Check in to mark attendance<br/>
                  4. Then join the Google Meet
                </Alert>

                <div className="text-center">
                  <Button 
                    variant="danger" 
                    onClick={endLiveSession}
                  >
                    ⏹️ End Live Session
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">📊 Live Attendance ({liveAttendance.length})</h5>
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {liveAttendance.length === 0 ? (
                  <p className="text-muted text-center">No students checked in yet</p>
                ) : (
                  liveAttendance.map((attendance, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                      <span>{attendance.student_name || `Student ${attendance.student_id}`}</span>
                      <Badge bg={attendance.status === 'present' ? 'success' : 'secondary'}>
                        {attendance.status}
                      </Badge>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Attendance Code Modal */}
      <Modal show={showCodeModal} onHide={() => setShowCodeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>📝 Attendance Code Generated</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <h1 className="text-success mb-3">{attendanceCode}</h1>
          <p>Share this code with your students so they can check in and mark their attendance.</p>
          <Button variant="outline-secondary" onClick={copyAttendanceCode}>
            📋 Copy to Clipboard
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCodeModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LiveSessionControl;
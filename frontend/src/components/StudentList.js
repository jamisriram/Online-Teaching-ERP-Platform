import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';

/**
 * StudentList Component
 * Displays all students for teachers to mark manual attendance
 */
const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchSessions();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/students');
      // The API returns {message, students} format, so we need response.data.students
      const studentsData = response.data.students || response.data;
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setError('');
    } catch (error) {
      console.error('Error fetching students:', error);
      
      if (error.response?.status === 401) {
        setError('Please log in as a teacher to view student list.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You need teacher privileges to view student list.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load students. Please try again.');
      }
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions');
      // API returns {sessions: [...]} format, so we need response.data.sessions
      const sessionsData = response.data.sessions || response.data;
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      
      if (error.response?.status === 401) {
        console.warn('Authentication required to fetch sessions');
      } else if (error.response?.status === 403) {
        console.warn('Access denied when fetching sessions');
      }
      
      setSessions([]);
    }
  };

  const handleMarkAttendance = (student) => {
    setSelectedStudent(student);
    setShowAttendanceModal(true);
    setSelectedSession('');
    setError('');
    setSuccess('');
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedSession) {
      setError('Please select a session');
      return;
    }

    try {
      setAttendanceLoading(true);
      setError('');
      
      await api.post('/attendance/mark', {
        sessionId: selectedSession,
        studentId: selectedStudent.id,
        status: 'present'
      });

      setSuccess(`Attendance marked successfully for ${selectedStudent.name}!`);
      setShowAttendanceModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError(error.response?.data?.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const getStudentAttendanceStats = async (studentId) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}`);
      return response.data?.length || 0;
    } catch (error) {
      return 0;
    }
  };

  const closeModal = () => {
    setShowAttendanceModal(false);
    setSelectedStudent(null);
    setSelectedSession('');
    setError('');
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Student List & Manual Attendance</h4>
        <Button variant="outline-primary" onClick={fetchStudents}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh List
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-people me-2"></i>
              All Students ({students.length})
            </h5>
            <small className="text-muted">Click "Mark Attendance" to manually mark a student present</small>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {students.length > 0 ? (
            <Table responsive striped hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(students || []).map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" 
                             style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                          {student.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <h6 className="mb-0">{student.name}</h6>
                          <small className="text-muted">ID: {student.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${student.email}`} className="text-decoration-none">
                        {student.email}
                      </a>
                    </td>
                    <td>{student.phone || 'Not provided'}</td>
                    <td>
                      <Badge bg="success">Active</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleMarkAttendance(student)}
                          title="Mark attendance for this student"
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          Mark Attendance
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => window.open(`/admin/student/${student.id}`, '_blank')}
                          title="View student details"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-people display-1 text-muted"></i>
              <h5 className="mt-3 text-muted">No students found</h5>
              <p className="text-muted">Students will appear here once they register</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Manual Attendance Modal */}
      <Modal show={showAttendanceModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-check-circle me-2"></i>
            Mark Manual Attendance
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitAttendance}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <div className="mb-3">
              <h6>Student Information</h6>
              <div className="p-3 bg-light rounded">
                <strong>{selectedStudent?.name}</strong><br />
                <small className="text-muted">{selectedStudent?.email}</small>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Select Session *</Form.Label>
              <Form.Select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                required
              >
                <option value="">Choose a session...</option>
                {(sessions || []).map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title} - {new Date(session.date_time).toLocaleDateString()} at{' '}
                    {new Date(session.date_time).toLocaleTimeString()}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Select the session for which you want to mark attendance
              </Form.Text>
            </Form.Group>

            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Manual Attendance:</strong> This will mark the student as present for the selected session.
              The attendance will be timestamped with the current date and time.
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal} disabled={attendanceLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={attendanceLoading || !selectedSession}
            >
              {attendanceLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Marking...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Mark Present
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentList;
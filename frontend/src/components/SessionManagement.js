import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Modal, Form, 
  Badge, Alert, Spinner, InputGroup, Pagination, Dropdown
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSessions, createSession, updateSession, deleteSession } from '../store/slices/sessionsSlice';
import { fetchUsers } from '../store/slices/usersSlice';

/**
 * Session Management Component for Admin Dashboard
 * Provides comprehensive session CRUD operations and analytics
 */
const SessionManagement = () => {
  const dispatch = useDispatch();
  const { sessions = [], isLoading, error } = useSelector((state) => state.sessions);
  const { users = [] } = useSelector((state) => state.users);
  
  // Modal and form states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'delete', 'view'
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date_time: '',
    meeting_link: '',
    recording_link: '',
    teacher_id: ''
  });
  
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(10);
  
  // Bulk operations
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  
  // Success/error messaging
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  useEffect(() => {
    dispatch(fetchSessions());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Get teachers for dropdown
  const teachers = users.filter(user => user.role === 'teacher' || user.role === 'admin');

  // Session status helper
  const getSessionStatus = (dateTime) => {
    const sessionDate = new Date(dateTime);
    const now = new Date();
    const timeDiff = sessionDate - now;
    
    if (timeDiff > 15 * 60 * 1000) {
      return { status: 'upcoming', color: 'primary', text: 'Upcoming' };
    } else if (timeDiff > -2 * 60 * 60 * 1000) {
      return { status: 'live', color: 'success', text: 'Live' };
    } else {
      return { status: 'ended', color: 'secondary', text: 'Ended' };
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const sessionStatus = getSessionStatus(session.date_time);
    const matchesStatus = statusFilter === 'all' || sessionStatus.status === statusFilter;
    
    const matchesTeacher = teacherFilter === 'all' || 
                          session.teacher_id.toString() === teacherFilter;
    
    return matchesSearch && matchesStatus && matchesTeacher;
  });

  // Pagination logic
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstSession, indexOfLastSession);
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);

  // Modal handlers
  const handleShowModal = (type, session = null) => {
    setModalType(type);
    setSelectedSession(session);
    
    if (type === 'create') {
      setFormData({
        title: '',
        description: '',
        date_time: '',
        meeting_link: '',
        recording_link: '',
        teacher_id: ''
      });
    } else if (type === 'edit' && session) {
      setFormData({
        title: session.title,
        description: session.description,
        date_time: new Date(session.date_time).toISOString().slice(0, 16),
        meeting_link: session.meeting_link,
        recording_link: session.recording_link || '',
        teacher_id: session.teacher_id
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
    setFormData({
      title: '',
      description: '',
      date_time: '',
      meeting_link: '',
      recording_link: '',
      teacher_id: ''
    });
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const sessionData = {
        ...formData,
        date_time: new Date(formData.date_time).toISOString()
      };

      if (modalType === 'create') {
        await dispatch(createSession(sessionData)).unwrap();
        showSuccessAlert('Session created successfully!');
      } else if (modalType === 'edit') {
        await dispatch(updateSession({ 
          id: selectedSession.id, 
          sessionData 
        })).unwrap();
        showSuccessAlert('Session updated successfully!');
      }
      
      handleCloseModal();
      dispatch(fetchSessions());
    } catch (error) {
      showErrorAlert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (session = selectedSession) => {
    try {
      await dispatch(deleteSession(session.id)).unwrap();
      showSuccessAlert('Session deleted successfully!');
      handleCloseModal();
      dispatch(fetchSessions());
    } catch (error) {
      showErrorAlert(error.message || 'Delete failed');
    }
  };

  // Bulk operations
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSessions(currentSessions.map(s => s.id));
    } else {
      setSelectedSessions([]);
    }
  };

  const handleSelectSession = (sessionId) => {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    } else {
      setSelectedSessions([...selectedSessions, sessionId]);
    }
  };

  const handleBulkAction = async () => {
    try {
      if (bulkAction === 'delete') {
        await Promise.all(
          selectedSessions.map(id => dispatch(deleteSession(id)).unwrap())
        );
        showSuccessAlert(`${selectedSessions.length} sessions deleted successfully!`);
      }
      
      setSelectedSessions([]);
      setShowBulkModal(false);
      dispatch(fetchSessions());
    } catch (error) {
      showErrorAlert('Bulk operation failed');
    }
  };

  // Alert helpers
  const showSuccessAlert = (message) => {
    setAlertMessage(message);
    setAlertType('success');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const showErrorAlert = (message) => {
    setAlertMessage(message);
    setAlertType('danger');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  // Session statistics
  const sessionStats = {
    total: sessions.length,
    upcoming: sessions.filter(s => getSessionStatus(s.date_time).status === 'upcoming').length,
    live: sessions.filter(s => getSessionStatus(s.date_time).status === 'live').length,
    ended: sessions.filter(s => getSessionStatus(s.date_time).status === 'ended').length
  };

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading sessions...</p>
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
          <h2>Session Management</h2>
          <p className="text-muted">Manage teaching sessions and schedules</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => handleShowModal('create')}
            className="me-2"
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Session
          </Button>
          {selectedSessions.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary">
                Bulk Actions ({selectedSessions.length})
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item 
                  onClick={() => {
                    setBulkAction('delete');
                    setShowBulkModal(true);
                  }}
                >
                  <i className="bi bi-trash me-2"></i>Delete Selected
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Col>
      </Row>

      {/* Session Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{sessionStats.total}</h3>
              <p className="mb-0">Total Sessions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{sessionStats.upcoming}</h3>
              <p className="mb-0">Upcoming</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{sessionStats.live}</h3>
              <p className="mb-0">Live Now</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-secondary">{sessionStats.ended}</h3>
              <p className="mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
              >
                <option value="all">All Teachers</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-muted">
                Showing {currentSessions.length} of {filteredSessions.length} sessions
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Sessions Table */}
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
                <th>
                  <Form.Check
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedSessions.length === currentSessions.length && currentSessions.length > 0}
                  />
                </th>
                <th>Title</th>
                <th>Teacher</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Attendees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentSessions.length > 0 ? (
                currentSessions.map((session) => {
                  const statusInfo = getSessionStatus(session.date_time);
                  const teacher = teachers.find(t => t.id === session.teacher_id);
                  
                  return (
                    <tr key={session.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedSessions.includes(session.id)}
                          onChange={() => handleSelectSession(session.id)}
                        />
                      </td>
                      <td>
                        <div>
                          <strong>{session.title}</strong>
                          <br />
                          <small className="text-muted">
                            {session.description.length > 50 
                              ? `${session.description.substring(0, 50)}...` 
                              : session.description}
                          </small>
                        </div>
                      </td>
                      <td>{teacher ? teacher.name : 'Unknown'}</td>
                      <td>
                        <div>
                          {new Date(session.date_time).toLocaleDateString()}
                          <br />
                          <small>{new Date(session.date_time).toLocaleTimeString()}</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg={statusInfo.color}>
                          {statusInfo.text}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-muted">-</span>
                      </td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            <i className="bi bi-three-dots"></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleShowModal('view', session)}>
                              <i className="bi bi-eye me-2"></i>View Details
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleShowModal('edit', session)}>
                              <i className="bi bi-pencil me-2"></i>Edit
                            </Dropdown.Item>
                            {session.meeting_link && (
                              <Dropdown.Item href={session.meeting_link} target="_blank">
                                <i className="bi bi-camera-video me-2"></i>Join Session
                              </Dropdown.Item>
                            )}
                            <Dropdown.Divider />
                            <Dropdown.Item 
                              className="text-danger"
                              onClick={() => handleShowModal('delete', session)}
                            >
                              <i className="bi bi-trash me-2"></i>Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="text-muted">
                      <i className="bi bi-calendar-x fs-1"></i>
                      <p className="mt-2">No sessions found</p>
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

      {/* Session Modal (Create/Edit/Delete/View) */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'create' && 'Create New Session'}
            {modalType === 'edit' && 'Edit Session'}
            {modalType === 'delete' && 'Delete Session'}
            {modalType === 'view' && 'Session Details'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {modalType === 'delete' ? (
            <div className="text-center">
              <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3">Are you sure?</h5>
              <p>
                This will permanently delete <strong>{selectedSession?.title}</strong> and all associated data.
                This action cannot be undone.
              </p>
            </div>
          ) : modalType === 'view' ? (
            <div>
              <Row>
                <Col md={6}>
                  <strong>Title:</strong> {selectedSession?.title}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> 
                  <Badge bg={getSessionStatus(selectedSession?.date_time).color} className="ms-2">
                    {getSessionStatus(selectedSession?.date_time).text}
                  </Badge>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col md={12}>
                  <strong>Description:</strong>
                  <p>{selectedSession?.description}</p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Date:</strong> {new Date(selectedSession?.date_time).toLocaleDateString()}
                </Col>
                <Col md={6}>
                  <strong>Time:</strong> {new Date(selectedSession?.date_time).toLocaleTimeString()}
                </Col>
              </Row>
              <hr />
              <Row>
                <Col md={12}>
                  <strong>Meeting Link:</strong>
                  <br />
                  <a href={selectedSession?.meeting_link} target="_blank" rel="noopener noreferrer">
                    {selectedSession?.meeting_link}
                  </a>
                </Col>
              </Row>
              {selectedSession?.recording_link && (
                <Row className="mt-3">
                  <Col md={12}>
                    <strong>Recording Link:</strong>
                    <br />
                    <a href={selectedSession?.recording_link} target="_blank" rel="noopener noreferrer">
                      {selectedSession?.recording_link}
                    </a>
                  </Col>
                </Row>
              )}
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Session Title *</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter session title"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Assigned Teacher *</Form.Label>
                    <Form.Select
                      name="teacher_id"
                      value={formData.teacher_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter session description"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date & Time *</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Meeting Link *</Form.Label>
                    <Form.Control
                      type="url"
                      name="meeting_link"
                      value={formData.meeting_link}
                      onChange={handleInputChange}
                      required
                      placeholder="https://meet.google.com/xyz"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Recording Link (Optional)</Form.Label>
                <Form.Control
                  type="url"
                  name="recording_link"
                  value={formData.recording_link}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/file/xyz"
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            {modalType === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {modalType === 'delete' ? (
            <Button variant="danger" onClick={() => handleDelete()}>
              <i className="bi bi-trash me-2"></i>
              Delete Session
            </Button>
          ) : modalType !== 'view' && (
            <Button variant="primary" onClick={handleSubmit}>
              <i className={`bi bi-${modalType === 'create' ? 'plus' : 'check'} me-2`}></i>
              {modalType === 'create' ? 'Create Session' : 'Update Session'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bulk Action Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3">Confirm Bulk Action</h5>
            <p>
              Are you sure you want to {bulkAction} {selectedSessions.length} selected session(s)?
              This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBulkAction}>
            <i className="bi bi-check me-2"></i>
            Confirm {bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SessionManagement;
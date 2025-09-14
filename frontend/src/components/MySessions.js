import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import sessionService from '../services/sessionService';
import LoadingSpinner from './LoadingSpinner';

/**
 * My Sessions Component
 * Display teacher's sessions with edit/delete functionality
 */
const MySessions = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await sessionService.getAllSessions();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setAlert({
        show: true,
        message: 'Failed to load sessions. Please try again.',
        variant: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (session) => {
    setSelectedSession(session);
    setFormData({
      title: session.title,
      description: session.description,
      date_time: new Date(session.date_time).toISOString().slice(0, 16),
      meeting_link: session.meeting_link,
      recording_link: session.recording_link || ''
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleDelete = (session) => {
    setSelectedSession(session);
    setShowDeleteModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.date_time) {
      newErrors.date_time = 'Date and time are required';
    }
    
    if (!formData.meeting_link?.trim()) {
      newErrors.meeting_link = 'Meeting link is required';
    } else {
      try {
        new URL(formData.meeting_link);
      } catch {
        newErrors.meeting_link = 'Please enter a valid URL';
      }
    }

    if (formData.recording_link && formData.recording_link.trim()) {
      try {
        new URL(formData.recording_link);
      } catch {
        newErrors.recording_link = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const updateData = {
        ...formData,
        recording_link: formData.recording_link || null
      };

      await sessionService.updateSession(selectedSession.id, updateData);
      
      setAlert({
        show: true,
        message: 'Session updated successfully!',
        variant: 'success'
      });
      
      setShowEditModal(false);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to update session',
        variant: 'danger'
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await sessionService.deleteSession(selectedSession.id);
      
      setAlert({
        show: true,
        message: 'Session deleted successfully!',
        variant: 'success'
      });
      
      setShowDeleteModal(false);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to delete session',
        variant: 'danger'
      });
    }
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date_time);
    
    if (sessionDate > now) {
      return <Badge bg="primary">Upcoming</Badge>;
    } else if (sessionDate.toDateString() === now.toDateString()) {
      return <Badge bg="success">Today</Badge>;
    } else {
      return <Badge bg="secondary">Past</Badge>;
    }
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="bi bi-calendar-week me-2"></i>
              My Sessions
            </h2>
            <Button 
              variant="primary"
              onClick={() => navigate('/teacher/create-session')}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Create Session
            </Button>
          </div>

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

          <Card>
            <Card.Body>
              {sessions.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x text-muted" style={{ fontSize: '4rem' }}></i>
                  <h4 className="text-muted mt-3">No sessions found</h4>
                  <p className="text-muted">Create your first session to get started!</p>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/teacher/create-session')}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Create Session
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>Meeting Link</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.id}>
                          <td>
                            <div>
                              <strong>{session.title}</strong>
                              <br />
                              <small className="text-muted">
                                {session.description.length > 100 
                                  ? `${session.description.substring(0, 100)}...`
                                  : session.description
                                }
                              </small>
                            </div>
                          </td>
                          <td>{formatDateTime(session.date_time)}</td>
                          <td>{getSessionStatus(session)}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              href={session.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="bi bi-link-45deg"></i> Join
                            </Button>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleEdit(session)}
                                title="Edit Session"
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(session)}
                                title="Delete Session"
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => navigate(`/teacher/attendance/${session.id}`)}
                                title="View Attendance"
                              >
                                <i className="bi bi-people"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Session Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Session</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                isInvalid={!!errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                isInvalid={!!errors.description}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date & Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="date_time"
                value={formData.date_time || ''}
                onChange={handleInputChange}
                isInvalid={!!errors.date_time}
              />
              <Form.Control.Feedback type="invalid">
                {errors.date_time}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Meeting Link</Form.Label>
              <Form.Control
                type="url"
                name="meeting_link"
                value={formData.meeting_link || ''}
                onChange={handleInputChange}
                isInvalid={!!errors.meeting_link}
              />
              <Form.Control.Feedback type="invalid">
                {errors.meeting_link}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Recording Link (Optional)</Form.Label>
              <Form.Control
                type="url"
                name="recording_link"
                value={formData.recording_link || ''}
                onChange={handleInputChange}
                isInvalid={!!errors.recording_link}
              />
              <Form.Control.Feedback type="invalid">
                {errors.recording_link}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the session:</p>
          <strong>"{selectedSession?.title}"</strong>
          <p className="mt-2 text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete Session
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MySessions;
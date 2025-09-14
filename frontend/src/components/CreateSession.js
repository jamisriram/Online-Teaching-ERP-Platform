import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import sessionService from '../services/sessionService';

/**
 * Create Session Component
 * Form for teachers to create new sessions
 */
const CreateSession = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date_time: '',
    meeting_link: '',
    recording_link: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState({ show: false, message: '', variant: '' });

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Session title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Session description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Date and time validation
    if (!formData.date_time) {
      newErrors.date_time = 'Session date and time are required';
    } else {
      const sessionDate = new Date(formData.date_time);
      const now = new Date();
      if (sessionDate <= now) {
        newErrors.date_time = 'Session must be scheduled for a future date and time';
      }
    }

    // Meeting link validation
    if (!formData.meeting_link.trim()) {
      newErrors.meeting_link = 'Meeting link is required';
    } else {
      try {
        new URL(formData.meeting_link);
      } catch {
        newErrors.meeting_link = 'Please enter a valid URL';
      }
    }

    // Recording link validation (optional)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setShowAlert({ show: false, message: '', variant: '' });

    try {
      // Prepare data for submission
      const sessionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date_time: formData.date_time,
        meeting_link: formData.meeting_link.trim(),
        recording_link: formData.recording_link.trim() || null
      };

      const response = await sessionService.createSession(sessionData);
      
      setShowAlert({
        show: true,
        message: 'Session created successfully!',
        variant: 'success'
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        date_time: '',
        meeting_link: '',
        recording_link: ''
      });

      // Redirect to sessions list after a short delay
      setTimeout(() => {
        navigate('/teacher/sessions');
      }, 2000);

    } catch (error) {
      console.error('Error creating session:', error);
      
      let errorMessage = 'Failed to create session. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details.join(', ');
      }

      setShowAlert({
        show: true,
        message: errorMessage,
        variant: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/teacher');
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>
                Create New Session
              </h4>
            </Card.Header>
            <Card.Body>
              {showAlert.show && (
                <Alert 
                  variant={showAlert.variant} 
                  onClose={() => setShowAlert({ show: false, message: '', variant: '' })}
                  dismissible
                >
                  {showAlert.message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Session Title */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Session Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter session title (e.g., Introduction to Mathematics)"
                    isInvalid={!!errors.title}
                    maxLength={200}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.title}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    {formData.title.length}/200 characters
                  </Form.Text>
                </Form.Group>

                {/* Session Description */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Description <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what will be covered in this session..."
                    isInvalid={!!errors.description}
                    maxLength={1000}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    {formData.description.length}/1000 characters
                  </Form.Text>
                </Form.Group>

                {/* Date and Time */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Date and Time <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="date_time"
                    value={formData.date_time}
                    onChange={handleInputChange}
                    min={minDate}
                    isInvalid={!!errors.date_time}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.date_time}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Select when the session will take place
                  </Form.Text>
                </Form.Group>

                {/* Meeting Link */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Meeting Link <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="url"
                    name="meeting_link"
                    value={formData.meeting_link}
                    onChange={handleInputChange}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    isInvalid={!!errors.meeting_link}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.meeting_link}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Link where students will join the session (Zoom, Google Meet, etc.)
                  </Form.Text>
                </Form.Group>

                {/* Recording Link (Optional) */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    Recording Link <span className="text-muted">(Optional)</span>
                  </Form.Label>
                  <Form.Control
                    type="url"
                    name="recording_link"
                    value={formData.recording_link}
                    onChange={handleInputChange}
                    placeholder="https://recordings.example.com/session-123"
                    isInvalid={!!errors.recording_link}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.recording_link}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Link to session recording (can be added later)
                  </Form.Text>
                </Form.Group>

                {/* Form Actions */}
                <div className="d-flex gap-2 justify-content-end">
                  <Button 
                    variant="secondary" 
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    <i className="bi bi-x-circle me-1"></i>
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-1"></i>
                        Create Session
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateSession;
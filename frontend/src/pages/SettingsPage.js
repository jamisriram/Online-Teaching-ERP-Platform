import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

/**
 * Settings Page Component
 * Manage user preferences and account settings
 */
const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    sessionReminders: true,
    attendanceAlerts: true,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
    autoJoinMeetings: false,
    showAttendanceCode: true
  });
  
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      setAlert({
        show: true,
        message: 'Settings saved successfully!',
        variant: 'success'
      });

      // Apply settings immediately
      if (settings.darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    } catch (error) {
      setAlert({
        show: true,
        message: 'Failed to save settings',
        variant: 'danger'
      });
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      emailNotifications: true,
      sessionReminders: true,
      attendanceAlerts: true,
      darkMode: false,
      language: 'en',
      timezone: 'UTC',
      autoJoinMeetings: false,
      showAttendanceCode: true
    };
    setSettings(defaultSettings);
    localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
    setAlert({
      show: true,
      message: 'Settings reset to default values',
      variant: 'info'
    });
  };

  const handleDeleteAccount = () => {
    if (confirmText === 'DELETE MY ACCOUNT') {
      // Here you would call an API to delete the account
      setAlert({
        show: true,
        message: 'Account deletion is not yet implemented. Please contact support.',
        variant: 'warning'
      });
      setShowDeleteModal(false);
      setConfirmText('');
    } else {
      setAlert({
        show: true,
        message: 'Please type "DELETE MY ACCOUNT" exactly as shown',
        variant: 'danger'
      });
    }
  };

  const goBack = () => {
    const role = user?.role;
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'teacher':
        navigate('/teacher');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div>
      <Header title="Settings" />
      <Container className="mt-4">
        {alert.show && (
          <Alert 
            variant={alert.variant} 
            onClose={() => setAlert({ show: false, message: '', variant: '' })} 
            dismissible
          >
            {alert.message}
          </Alert>
        )}

        <Row>
          <Col md={8} className="mx-auto">
            {/* Notification Settings */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-bell me-2"></i>
                  Notification Preferences
                </h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <div className="mb-3">
                    <Form.Check
                      type="switch"
                      id="emailNotifications"
                      label="Email Notifications"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                    <small className="text-muted">Receive email updates about sessions and announcements</small>
                  </div>
                  
                  <div className="mb-3">
                    <Form.Check
                      type="switch"
                      id="sessionReminders"
                      label="Session Reminders"
                      checked={settings.sessionReminders}
                      onChange={(e) => handleSettingChange('sessionReminders', e.target.checked)}
                    />
                    <small className="text-muted">Get reminders before your scheduled sessions</small>
                  </div>
                  
                  <div className="mb-3">
                    <Form.Check
                      type="switch"
                      id="attendanceAlerts"
                      label="Attendance Alerts"
                      checked={settings.attendanceAlerts}
                      onChange={(e) => handleSettingChange('attendanceAlerts', e.target.checked)}
                    />
                    <small className="text-muted">Receive notifications about attendance status</small>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Display Settings */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-display me-2"></i>
                  Display Settings
                </h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Language</Form.Label>
                        <Form.Select
                          value={settings.language}
                          onChange={(e) => handleSettingChange('language', e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Timezone</Form.Label>
                        <Form.Select
                          value={settings.timezone}
                          onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="mb-3">
                    <Form.Check
                      type="switch"
                      id="darkMode"
                      label="Dark Mode"
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    />
                    <small className="text-muted">Use dark theme for better viewing in low light</small>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Session Settings */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-camera-video me-2"></i>
                  Session Settings
                </h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  <div className="mb-3">
                    <Form.Check
                      type="switch"
                      id="autoJoinMeetings"
                      label="Auto-join Meetings"
                      checked={settings.autoJoinMeetings}
                      onChange={(e) => handleSettingChange('autoJoinMeetings', e.target.checked)}
                    />
                    <small className="text-muted">Automatically open meeting links when sessions start</small>
                  </div>
                  
                  {user?.role === 'student' && (
                    <div className="mb-3">
                      <Form.Check
                        type="switch"
                        id="showAttendanceCode"
                        label="Show Attendance Code Field"
                        checked={settings.showAttendanceCode}
                        onChange={(e) => handleSettingChange('showAttendanceCode', e.target.checked)}
                      />
                      <small className="text-muted">Display attendance code input on session join page</small>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>

            {/* Data & Privacy */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-shield-check me-2"></i>
                  Data & Privacy
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6>Data Usage</h6>
                  <p className="text-muted mb-2">Your data is used to provide educational services and improve your experience.</p>
                  <Button variant="outline-info" size="sm">
                    <i className="bi bi-download me-1"></i>
                    Download My Data
                  </Button>
                </div>
                
                <hr />
                
                <div className="mb-3">
                  <h6 className="text-danger">Danger Zone</h6>
                  <p className="text-muted mb-2">Once you delete your account, there is no going back. Please be certain.</p>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete Account
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Action Buttons */}
            <div className="d-flex justify-content-between mb-4">
              <Button variant="outline-secondary" onClick={goBack}>
                <i className="bi bi-arrow-left me-1"></i>
                Back to Dashboard
              </Button>
              <div>
                <Button variant="outline-warning" onClick={resetSettings} className="me-2">
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Reset to Defaults
                </Button>
                <Button variant="primary" onClick={saveSettings}>
                  <i className="bi bi-check-lg me-1"></i>
                  Save Settings
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Delete Account Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="text-danger">Delete Account</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="danger">
              <Alert.Heading>This action cannot be undone!</Alert.Heading>
              <p>
                This will permanently delete your account and all associated data including:
              </p>
              <ul>
                <li>Profile information</li>
                <li>Session history</li>
                <li>Attendance records</li>
                <li>All personal data</li>
              </ul>
            </Alert>
            
            <Form.Group>
              <Form.Label>
                Type <strong>DELETE MY ACCOUNT</strong> to confirm:
              </Form.Label>
              <Form.Control
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE MY ACCOUNT'}
            >
              Delete Account
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default SettingsPage;
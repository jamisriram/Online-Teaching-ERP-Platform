import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Badge } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../store/slices/authSlice';
import authService from '../services/authService';
import Header from '../components/Header';

/**
 * Profile Page Component
 * Display and edit user profile information
 */
const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector(state => state.auth);
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || ''
      });
    } else {
      dispatch(getProfile());
    }
  }, [user, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await authService.updateProfile(formData);
      setAlert({
        show: true,
        message: 'Profile updated successfully!',
        variant: 'success'
      });
      setEditMode(false);
      dispatch(getProfile()); // Refresh user data
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to update profile',
        variant: 'danger'
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({
        show: true,
        message: 'New passwords do not match',
        variant: 'danger'
      });
      return;
    }

    try {
      await authService.changePassword(passwordData);
      setAlert({
        show: true,
        message: 'Password changed successfully!',
        variant: 'success'
      });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to change password',
        variant: 'danger'
      });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'teacher': return 'primary';
      case 'student': return 'success';
      default: return 'secondary';
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

  if (isLoading) {
    return (
      <div>
        <Header title="Profile" />
        <Container className="mt-4 text-center">
          <h4>Loading profile...</h4>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <Header title="My Profile" />
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
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i>
                  Profile Information
                </h4>
                <div>
                  <Badge bg={getRoleColor(user?.role)} className="me-2">
                    {user?.role?.toUpperCase()}
                  </Badge>
                  {!editMode ? (
                    <Button variant="outline-primary" size="sm" onClick={() => setEditMode(true)}>
                      <i className="bi bi-pencil me-1"></i>
                      Edit Profile
                    </Button>
                  ) : (
                    <div>
                      <Button variant="success" size="sm" onClick={handleSaveProfile} className="me-2">
                        <i className="bi bi-check-lg me-1"></i>
                        Save Changes
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => setEditMode(false)}>
                        <i className="bi bi-x-lg me-1"></i>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!editMode}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!editMode}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          placeholder="Enter phone number"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Form.Control
                          type="text"
                          value={user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1)}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      placeholder="Enter your address"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Bio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      placeholder="Tell us about yourself..."
                    />
                  </Form.Group>

                  <div className="text-muted">
                    <small>
                      <i className="bi bi-calendar me-1"></i>
                      Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </small>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Security Section */}
            <Card className="mt-4">
              <Card.Header>
                <h5 className="mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Security Settings
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6>Password</h6>
                    <p className="text-muted mb-0">Change your account password</p>
                  </div>
                  <Button 
                    variant="outline-warning" 
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <i className="bi bi-key me-1"></i>
                    Change Password
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Navigation */}
            <div className="mt-4 text-center">
              <Button variant="outline-secondary" onClick={goBack}>
                <i className="bi bi-arrow-left me-1"></i>
                Back to Dashboard
              </Button>
            </div>
          </Col>
        </Row>

        {/* Password Change Modal */}
        <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Change Password</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePasswordChange}>
              Change Password
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default ProfilePage;
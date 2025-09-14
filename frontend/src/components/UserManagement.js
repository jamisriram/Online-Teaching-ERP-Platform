import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Button, Modal, Form, 
  Badge, Alert, Spinner, InputGroup, Pagination 
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser } from '../store/slices/usersSlice';

/**
 * User Management Component for Admin Dashboard
 * Provides CRUD operations for user accounts
 */
const UserManagement = () => {
  const dispatch = useDispatch();
  const { users = [], isLoading, error } = useSelector((state) => state.users);
  
  // Modal and form states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'delete'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  
  // Success/error messaging
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Modal handlers
  const handleShowModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    
    if (type === 'create') {
      setFormData({ name: '', email: '', password: '', role: 'student' });
    } else if (type === 'edit' && user) {
      setFormData({ 
        name: user.name, 
        email: user.email, 
        password: '', 
        role: user.role 
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '', password: '', role: 'student' });
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'create') {
        await dispatch(createUser(formData)).unwrap();
        showSuccessAlert('User created successfully!');
      } else if (modalType === 'edit') {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't update password if empty
        
        await dispatch(updateUser({ 
          id: selectedUser.id, 
          userData: updateData 
        })).unwrap();
        showSuccessAlert('User updated successfully!');
      }
      
      handleCloseModal();
      dispatch(fetchUsers()); // Refresh user list
    } catch (error) {
      showErrorAlert(error.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteUser(selectedUser.id)).unwrap();
      showSuccessAlert('User deleted successfully!');
      handleCloseModal();
      dispatch(fetchUsers()); // Refresh user list
    } catch (error) {
      showErrorAlert(error.message || 'Delete failed');
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

  // Role badge colors
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'teacher': return 'primary';
      case 'student': return 'success';
      default: return 'secondary';
    }
  };

  // User statistics
  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    students: users.filter(u => u.role === 'student').length
  };

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading users...</p>
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
          <h2>User Management</h2>
          <p className="text-muted">Manage user accounts and permissions</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => handleShowModal('create')}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add New User
          </Button>
        </Col>
      </Row>

      {/* User Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{userStats.total}</h3>
              <p className="mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-danger">{userStats.admins}</h3>
              <p className="mb-0">Administrators</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{userStats.teachers}</h3>
              <p className="mb-0">Teachers</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{userStats.students}</h3>
              <p className="mb-0">Students</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="teacher">Teachers</option>
                <option value="student">Students</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-muted">
                Showing {currentUsers.length} of {filteredUsers.length} users
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
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
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <strong>{user.name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={getRoleBadgeColor(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal('edit', user)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleShowModal('delete', user)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="text-muted">
                      <i className="bi bi-person-x fs-1"></i>
                      <p className="mt-2">No users found</p>
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

      {/* User Modal (Create/Edit/Delete) */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'create' && 'Create New User'}
            {modalType === 'edit' && 'Edit User'}
            {modalType === 'delete' && 'Delete User'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {modalType === 'delete' ? (
            <div className="text-center">
              <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3">Are you sure?</h5>
              <p>
                This will permanently delete <strong>{selectedUser?.name}</strong> and all associated data.
                This action cannot be undone.
              </p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter full name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address *</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter email address"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Password {modalType === 'edit' ? '(leave blank to keep current)' : '*'}
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={modalType === 'create'}
                      placeholder="Enter password"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role *</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Administrator</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {modalType === 'create' && (
                <Alert variant="info">
                  <strong>Note:</strong> The user will receive login credentials and can change their password after first login.
                </Alert>
              )}
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          {modalType === 'delete' ? (
            <Button variant="danger" onClick={handleDelete}>
              <i className="bi bi-trash me-2"></i>
              Delete User
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit}>
              <i className={`bi bi-${modalType === 'create' ? 'plus' : 'check'} me-2`}></i>
              {modalType === 'create' ? 'Create User' : 'Update User'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { loginUser, clearError } from '../store/slices/authSlice';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Login Page Component
 * Handles user authentication
 */
const LoginPage = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    dispatch(clearError());
    dispatch(loginUser(data));
  };

  if (isLoading) {
    return <LoadingSpinner text="Signing you in..." />;
  }

  return (
    <div className="login-container d-flex align-items-center justify-content-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="login-card">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <i className="bi bi-mortarboard-fill text-primary" style={{ fontSize: '3rem' }}></i>
                  <h2 className="mt-3 mb-2">Welcome Back</h2>
                  <p className="text-muted welcome-text">Sign in to your ERP account</p>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => dispatch(clearError())}>
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Please enter a valid email address',
                        },
                      })}
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters',
                          },
                        })}
                        isInvalid={!!errors.password}
                      />
                      <Button
                        variant="outline-secondary"
                        className="position-absolute end-0 top-0 h-100 border-0"
                        style={{ zIndex: 10 }}
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                      </Button>
                      <Form.Control.Feedback type="invalid">
                        {errors.password?.message}
                      </Form.Control.Feedback>
                    </div>
                  </Form.Group>

                  <div className="d-grid mb-3">
                    <Button
                      variant="primary"
                      type="submit"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing In...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Sign In
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center">
                    <span className="text-muted">Don't have an account? </span>
                    <Link to="/register" className="text-decoration-none">
                      Sign up here
                    </Link>
                  </div>
                </Form>

                {/* Demo credentials info */}
                <div className="mt-4 pt-3 border-top">
                  <p className="text-muted text-center mb-2">
                    <small>Demo Credentials:</small>
                  </p>
                  <div className="row text-center">
                    <div className="col-4">
                      <small className="text-muted">
                        <strong>Admin:</strong><br />
                        admin@erp.com<br />
                        admin123
                      </small>
                    </div>
                    <div className="col-4">
                      <small className="text-muted">
                        <strong>Teacher:</strong><br />
                        Register as teacher
                      </small>
                    </div>
                    <div className="col-4">
                      <small className="text-muted">
                        <strong>Student:</strong><br />
                        Register as student
                      </small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../services/api';

/**
 * API Test Component
 * Simple component to test API connectivity and authentication
 */
const APITest = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, token } = useSelector((state) => state.auth);

  const runTests = async () => {
    setLoading(true);
    const testResults = [];

    // Test 1: Authentication Status
    testResults.push({
      name: "Authentication Status",
      status: token ? 'PASS' : 'FAIL',
      message: token ? `Logged in as: ${user?.name} (${user?.role})` : 'Not logged in',
      details: token ? `Token exists: ${token.substring(0, 20)}...` : 'No token found'
    });

    // Test 2: Health Check
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      testResults.push({
        name: "Backend Health",
        status: response.ok ? 'PASS' : 'FAIL',
        message: response.ok ? 'Backend server is running' : 'Backend server error',
        details: JSON.stringify(data, null, 2)
      });
    } catch (error) {
      testResults.push({
        name: "Backend Health",
        status: 'FAIL',
        message: 'Cannot connect to backend',
        details: error.message
      });
    }

    // Test 3: Students API (if authenticated)
    if (token) {
      try {
        const response = await api.get('/users/students');
        testResults.push({
          name: "Students API",
          status: response.status === 200 ? 'PASS' : 'FAIL',
          message: response.status === 200 ? 'Students API working' : 'Students API error',
          details: JSON.stringify(response.data, null, 2)
        });
      } catch (error) {
        testResults.push({
          name: "Students API",
          status: 'FAIL',
          message: `API Error: ${error.response?.status} ${error.response?.statusText}`,
          details: error.response?.data?.message || error.message
        });
      }
    } else {
      testResults.push({
        name: "Students API",
        status: 'SKIP',
        message: 'Skipped - Not authenticated',
        details: 'Need to log in first'
      });
    }

    // Test 4: Sessions API (if authenticated)
    if (token) {
      try {
        const response = await api.get('/sessions');
        testResults.push({
          name: "Sessions API",
          status: response.status === 200 ? 'PASS' : 'FAIL',
          message: response.status === 200 ? 'Sessions API working' : 'Sessions API error',
          details: JSON.stringify(response.data, null, 2)
        });
      } catch (error) {
        testResults.push({
          name: "Sessions API",
          status: 'FAIL',
          message: `API Error: ${error.response?.status} ${error.response?.statusText}`,
          details: error.response?.data?.message || error.message
        });
      }
    } else {
      testResults.push({
        name: "Sessions API",
        status: 'SKIP',
        message: 'Skipped - Not authenticated',
        details: 'Need to log in first'
      });
    }

    setTests(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, [token]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'PASS': return 'success';
      case 'FAIL': return 'danger';
      case 'SKIP': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">API Connectivity Test</h5>
          <Button 
            variant="primary" 
            size="sm"
            onClick={runTests}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </Button>
        </Card.Header>
        <Card.Body>
          {tests.map((test, index) => (
            <Alert key={index} variant={getStatusColor(test.status) === 'success' ? 'success' : 'light'} className="mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <strong>{test.name}</strong>
                  <Badge bg={getStatusColor(test.status)} className="ms-2">{test.status}</Badge>
                  <div className="mt-1">{test.message}</div>
                  <small className="text-muted">{test.details}</small>
                </div>
              </div>
            </Alert>
          ))}
          
          {tests.length === 0 && !loading && (
            <p className="text-muted">Click "Run Tests" to check API connectivity</p>
          )}
          
          <hr />
          <h6>Troubleshooting Guide:</h6>
          <ul className="small text-muted">
            <li><strong>Not logged in:</strong> Go to /login and sign in with teacher credentials</li>
            <li><strong>Backend Health fails:</strong> Make sure backend server is running on port 5000</li>
            <li><strong>API errors:</strong> Check browser console for detailed error messages</li>
            <li><strong>403 Forbidden:</strong> User doesn't have teacher role permissions</li>
          </ul>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default APITest;
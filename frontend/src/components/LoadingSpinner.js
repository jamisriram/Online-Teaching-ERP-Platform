import React from 'react';
import { Spinner } from 'react-bootstrap';

/**
 * Loading Spinner Component
 * Displays a centered loading spinner
 */
const LoadingSpinner = ({ size = 'lg', text = 'Loading...' }) => {
  return (
    <div className="loading-spinner">
      <div className="text-center">
        <Spinner animation="border" variant="primary" size={size} />
        {text && <div className="mt-2 text-muted">{text}</div>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
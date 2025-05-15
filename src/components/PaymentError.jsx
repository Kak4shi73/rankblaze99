import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentError = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get error details from location state
  const { paymentError, orderId } = location.state || {};
  
  const handleTryAgain = () => {
    // Navigate back to cart page
    navigate('/cart');
  };
  
  const handleGoHome = () => {
    // Navigate to homepage
    navigate('/');
  };
  
  return (
    <div className="payment-error-container">
      <div className="error-card">
        <div className="error-header">
          <h1>Payment Failed</h1>
          <div className="error-icon">❌</div>
        </div>
        
        <div className="error-message">
          <p>{paymentError || 'Your payment could not be processed. Please try again.'}</p>
          {orderId && (
            <p className="order-id">Order reference: {orderId}</p>
          )}
        </div>
        
        <div className="error-actions">
          <button 
            className="primary-button" 
            onClick={handleTryAgain}
          >
            Try Again
          </button>
          <button 
            className="secondary-button" 
            onClick={handleGoHome}
          >
            Go to Homepage
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .payment-error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
          padding: 20px;
        }
        
        .error-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 500px;
          padding: 30px;
        }
        
        .error-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .error-header h1 {
          color: #e74c3c;
          margin: 0 0 16px;
          font-size: 24px;
        }
        
        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .error-message {
          text-align: center;
          margin-bottom: 24px;
          color: #444;
          line-height: 1.5;
        }
        
        .order-id {
          font-size: 14px;
          color: #777;
          margin-top: 8px;
        }
        
        .error-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 20px;
        }
        
        .primary-button, .secondary-button {
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .primary-button {
          background-color: #e74c3c;
          color: white;
        }
        
        .primary-button:hover {
          background-color: #c0392b;
        }
        
        .secondary-button {
          background-color: #ecf0f1;
          color: #34495e;
        }
        
        .secondary-button:hover {
          background-color: #bdc3c7;
        }
      `}</style>
    </div>
  );
};

export default PaymentError; 
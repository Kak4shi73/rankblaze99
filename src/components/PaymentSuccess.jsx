import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState([]);

  // Get order details from location state
  const { orderId, amount, tools: purchasedTools } = location.state || {};

  useEffect(() => {
    // Redirect to home if no order details are available
    if (!orderId || !amount || !purchasedTools) {
      navigate('/');
      return;
    }

    // Fetch user tools to confirm access
    const fetchUserTools = async () => {
      try {
        if (!user || !user.uid) {
          throw new Error('User not authenticated');
        }

        // Get user document from Firestore to check tool access
        const response = await fetch(
          `https://us-central1-rankblaze-138f7.cloudfunctions.net/api/getUserTools?userId=${user.uid}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch user tools');
        }

        const data = await response.json();
        setTools(data.tools || []);
      } catch (error) {
        console.error('Error fetching user tools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTools();
  }, [orderId, amount, purchasedTools, user, navigate]);

  // Check if all purchased tools are in the user's tools array
  const allToolsAccessible = !loading && purchasedTools?.every(tool => 
    tools.includes(tool.id)
  );

  return (
    <div className="payment-success-container">
      <div className="success-card">
        <div className="success-header">
          <h1>Payment Successful!</h1>
          <div className="checkmark-circle">
            <div className="checkmark"></div>
          </div>
        </div>

        <div className="order-details">
          <h2>Order Details</h2>
          <div className="detail-row">
            <span>Order ID:</span>
            <span>{orderId}</span>
          </div>
          <div className="detail-row">
            <span>Amount Paid:</span>
            <span>₹{amount}</span>
          </div>
          <div className="detail-row">
            <span>Tools Purchased:</span>
            <span>{purchasedTools?.length || 0}</span>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Verifying your tools access...</p>
            <p className="loading-description">This may take a few moments. Your payment was successful and we're setting up your tools.</p>
          </div>
        ) : (
          <div className="access-status">
            {allToolsAccessible ? (
              <div className="access-granted">
                <h3>Access Granted!</h3>
                <p>You now have access to all purchased tools.</p>
              </div>
            ) : (
              <div className="access-pending">
                <h3>Access Pending</h3>
                <p>Your payment was successful! Your access is being processed and will be available shortly.</p>
                <p className="pending-note">This process usually takes less than a minute. You can refresh this page or check your dashboard.</p>
              </div>
            )}
          </div>
        )}

        <div className="buttons">
          <button 
            className="primary-button"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
          <button 
            className="secondary-button"
            onClick={() => navigate('/tools')}
          >
            View Your Tools
          </button>
        </div>
      </div>

      <style jsx>{`
        .payment-success-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
          padding: 20px;
        }

        .success-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 500px;
          padding: 30px;
        }

        .success-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .success-header h1 {
          color: #4CAF50;
          margin-bottom: 15px;
        }

        .checkmark-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #4CAF50;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 auto;
        }

        .checkmark {
          width: 30px;
          height: 15px;
          border-bottom: 3px solid white;
          border-right: 3px solid white;
          transform: rotate(45deg);
          margin-top: -5px;
        }

        .order-details {
          background-color: #f9f9f9;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .order-details h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
          color: #333;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .loading {
          text-align: center;
          padding: 20px;
          margin-bottom: 25px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto 15px;
          border: 4px solid rgba(76, 175, 80, 0.2);
          border-top-color: #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-description {
          font-size: 14px;
          color: #777;
          margin-top: 10px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .access-status {
          text-align: center;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 25px;
        }

        .access-granted {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        .access-pending {
          background-color: #fff8e1;
          color: #ff8f00;
        }

        .access-status h3 {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .pending-note {
          font-size: 14px;
          margin-top: 10px;
          font-style: italic;
        }

        .buttons {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .primary-button, .secondary-button {
          flex: 1;
          padding: 12px 0;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
        }

        .primary-button {
          background-color: #4CAF50;
          color: white;
        }

        .primary-button:hover {
          background-color: #388e3c;
        }

        .secondary-button {
          background-color: #e0e0e0;
          color: #333;
        }

        .secondary-button:hover {
          background-color: #d5d5d5;
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess; 
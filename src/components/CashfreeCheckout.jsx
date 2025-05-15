import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CashfreeCheckout = ({ cart, totalAmount }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    // Prevent duplicate order creation
    if (isPlacingOrder) return;
    
    setIsPlacingOrder(true);
    setIsLoading(true);
    setError(null);

    try {
      // Validate cart and user
      if (!cart || cart.length === 0) {
        throw new Error('Your cart is empty');
      }

      if (!user || !user.uid) {
        throw new Error('You must be logged in to checkout');
      }

      // Call the Firebase Function to create a Cashfree order
      const response = await fetch(
        'https://us-central1-rankblaze-138f7.cloudfunctions.net/api/createCashfreeOrderCustom',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            cartItems: cart,
            totalAmount,
            customerName: user.displayName || '',
            customerEmail: user.email || '',
            customerPhone: user.phoneNumber || '', // Optional, will be fetched from Firebase if missing
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { session_id, order_id } = await response.json();

      if (!session_id) {
        throw new Error('No payment session ID received');
      }

      // Show payment processing message
      setIsLoading(true);
      setError(null);

      // Initialize Cashfree checkout
      const cashfree = new window.Cashfree(session_id);

      // Set up the success callback
      const handlePaymentSuccess = async (data) => {
        console.log('Payment successful:', data);
        
        // Verify payment status on our server
        try {
          const verifyResponse = await fetch(
            'https://us-central1-rankblaze-138f7.cloudfunctions.net/api/verifyCashfreePaymentCustom',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: order_id,
              }),
            }
          );
          
          const result = await verifyResponse.json();
          
          if (result.success) {
            // Payment verified successfully, redirect to success page
            navigate('/payment-success', { 
              state: { 
                orderId: order_id,
                amount: totalAmount,
                tools: cart 
              } 
            });
          } else {
            navigate('/payment-failed', { 
              state: { 
                orderId: order_id,
                message: result.message || 'Payment verification failed'
              } 
            });
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          navigate('/dashboard');
        } finally {
          setIsPlacingOrder(false);
        }
      };

      // Launch Cashfree checkout
      cashfree.checkout({
        paymentSuccessCallback: handlePaymentSuccess,
        paymentFailureCallback: (data) => {
          console.error('Payment failed:', data);
          // Redirect to payment error page
          navigate('/payment-error', { 
            state: { 
              paymentError: 'Your payment was not successful. Please try again.',
              orderId: order_id
            } 
          });
          setIsPlacingOrder(false);
        },
      });
    } catch (err) {
      setError(err.message || 'An error occurred during checkout');
      console.error('Checkout error:', err);
      setIsPlacingOrder(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cashfree-checkout">
      <button
        onClick={handleCheckout}
        disabled={isLoading || isPlacingOrder || !cart || cart.length === 0}
        className={`checkout-button ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? 'Processing...' : 'Proceed to Pay'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
      
      <style jsx>{`
        .checkout-button {
          background-color: #4CAF50;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .checkout-button:hover:not(:disabled) {
          background-color: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .checkout-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .checkout-button.loading {
          position: relative;
          padding-left: 40px;
        }
        
        .checkout-button.loading:before {
          content: '';
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s infinite linear;
        }
        
        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }
        
        .error-message {
          color: #ff3333;
          margin-top: 10px;
          padding: 8px;
          background-color: #ffeeee;
          border-radius: 4px;
          border-left: 3px solid #ff3333;
        }
      `}</style>
      
      {/* Add Cashfree script to the page */}
      <script
        id="cashfree-js"
        src="https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js"
      ></script>
    </div>
  );
};

export default CashfreeCheckout; 
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Checkout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch cart items from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      
      // Calculate total amount
      const total = parsedCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setTotalAmount(total);
    }
  }, []);

  // Redirect if no user or empty cart
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!cart.length) {
      navigate('/cart');
    }
  }, [user, cart, navigate]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Generate a unique order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Here you would integrate with your preferred payment method
      // For now, we'll simulate a successful order

      setTimeout(() => {
        // Clear cart
        localStorage.setItem('cart', JSON.stringify([]));
        
        // Redirect to success page
        navigate('/payment-success', { 
          state: { 
            orderId: orderId,
            amount: totalAmount,
            tools: cart 
          } 
        });
      }, 2000);
      
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
      
      // Redirect to error page
      navigate('/payment-error', { 
        state: { 
          paymentError: 'There was an error processing your payment. Please try again.',
        } 
      });
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      
      <div className="order-summary">
        <h3>Order Summary</h3>
        <div className="order-items">
          {cart.map((item) => (
            <div key={item.id} className="order-item">
              <div className="item-info">
                <h4>{item.name}</h4>
                <p className="quantity">Quantity: {item.quantity || 1}</p>
              </div>
              <div className="item-price">₹{item.price * (item.quantity || 1)}</div>
            </div>
          ))}
        </div>
        
        <div className="order-total">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{totalAmount}</span>
          </div>
          <div className="total-row">
            <span>Tax:</span>
            <span>₹0</span>
          </div>
          <div className="total-row grand-total">
            <span>Total:</span>
            <span>₹{totalAmount}</span>
          </div>
        </div>
      </div>
      
      <div className="payment-section">
        <h3>Payment Information</h3>
        <p className="payment-notice">
          Payment integration has been removed. This is a placeholder for your new payment method.
        </p>
        
        <button 
          className="place-order-btn"
          onClick={handlePlaceOrder}
          disabled={isProcessing || !cart.length}
        >
          {isProcessing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
      
      <button 
        className="back-to-cart" 
        onClick={() => navigate('/cart')}
        disabled={isProcessing}
      >
        Back to Cart
      </button>
      
      <style jsx>{`
        .checkout-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h2 {
          margin-bottom: 30px;
          color: #333;
        }
        
        .order-summary, .payment-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        
        .order-items {
          margin-bottom: 20px;
        }
        
        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        
        .item-info h4 {
          margin: 0 0 5px;
          font-size: 16px;
        }
        
        .quantity {
          color: #666;
          font-size: 14px;
          margin: 0;
        }
        
        .item-price {
          font-weight: bold;
        }
        
        .order-total {
          margin-top: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        
        .grand-total {
          font-weight: bold;
          border-top: 1px solid #ddd;
          margin-top: 10px;
          padding-top: 10px;
          font-size: 18px;
        }
        
        .payment-notice {
          background: #ffe8e8;
          border-left: 4px solid #ff6b6b;
          padding: 15px;
          margin: 20px 0;
          color: #333;
        }
        
        .place-order-btn {
          width: 100%;
          padding: 12px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .place-order-btn:hover:not(:disabled) {
          background: #45a049;
        }
        
        .place-order-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .back-to-cart {
          display: block;
          margin: 0 auto;
          padding: 10px 20px;
          background: none;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          color: #666;
        }
        
        .back-to-cart:hover:not(:disabled) {
          background: #f5f5f5;
        }
        
        .back-to-cart:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Checkout; 
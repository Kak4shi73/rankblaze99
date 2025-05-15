import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CashfreeCheckout from './CashfreeCheckout';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch cart items from local storage or state management
  useEffect(() => {
    const fetchCart = async () => {
      try {
        // You can replace this with your actual cart fetching logic
        // For example, fetch from Firebase or local storage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
          
          // Calculate total amount
          const total = parsedCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
          setTotalAmount(total);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleRemoveItem = (itemId) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    
    // Update total
    const total = updatedCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    setTotalAmount(total);
    
    // Update localStorage
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    
    // Update total
    const total = updatedCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    setTotalAmount(total);
    
    // Update localStorage
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading-spinner"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-container empty-cart">
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any tools to your cart yet.</p>
        <button 
          className="browse-tools-btn"
          onClick={() => navigate('/marketplace')}
        >
          Browse Tools
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      
      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            {item.image && (
              <div className="item-image">
                <img src={item.image} alt={item.name} />
              </div>
            )}
            
            <div className="item-details">
              <h3>{item.name}</h3>
              <p className="item-description">{item.description}</p>
            </div>
            
            <div className="item-quantity">
              <button 
                onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                disabled={(item.quantity || 1) <= 1}
              >
                -
              </button>
              <span>{item.quantity || 1}</span>
              <button onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}>
                +
              </button>
            </div>
            
            <div className="item-price">
              ₹{item.price * (item.quantity || 1)}
            </div>
            
            <button 
              className="remove-item"
              onClick={() => handleRemoveItem(item.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>₹{totalAmount}</span>
        </div>
        <div className="summary-row">
          <span>Tax:</span>
          <span>₹0</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>₹{totalAmount}</span>
        </div>
        
        {/* Integrate Cashfree Checkout */}
        <CashfreeCheckout cart={cart} totalAmount={totalAmount} />
      </div>
      
      <style jsx>{`
        .cart-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h2 {
          margin-bottom: 20px;
          color: #333;
        }
        
        .cart-items {
          margin-bottom: 30px;
        }
        
        .cart-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #eee;
          position: relative;
        }
        
        .item-image {
          width: 80px;
          height: 80px;
          overflow: hidden;
          border-radius: 4px;
          margin-right: 15px;
        }
        
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .item-details {
          flex: 1;
        }
        
        .item-details h3 {
          margin: 0 0 5px;
          font-size: 16px;
        }
        
        .item-description {
          color: #666;
          font-size: 14px;
          max-width: 400px;
        }
        
        .item-quantity {
          display: flex;
          align-items: center;
          margin: 0 20px;
        }
        
        .item-quantity button {
          width: 30px;
          height: 30px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .item-quantity button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .item-quantity span {
          margin: 0 10px;
          min-width: 20px;
          text-align: center;
        }
        
        .item-price {
          font-weight: bold;
          min-width: 80px;
          text-align: right;
        }
        
        .remove-item {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 16px;
          padding: 5px 10px;
          margin-left: 10px;
        }
        
        .remove-item:hover {
          color: #e74c3c;
        }
        
        .cart-summary {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .total {
          font-weight: bold;
          font-size: 18px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          margin-top: 10px;
        }
        
        .empty-cart {
          text-align: center;
          padding: 50px 20px;
        }
        
        .browse-tools-btn {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          margin: 20px auto;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-left-color: #4CAF50;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Cart; 
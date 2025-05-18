import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart, getTotalPrice } = useCart();
  const totalAmount = getTotalPrice();

  // Redirect if no user or empty cart
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!cartItems.length) {
      navigate('/cart');
    }
  }, [user, cartItems, navigate]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Generate a unique order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Here you would integrate with your preferred payment method
      // For now, we'll simulate a successful order

      setTimeout(() => {
        // Clear cart
        clearCart();
        
        // Redirect to success page
        navigate('/payment-success', { 
          state: { 
            orderId: orderId,
            amount: totalAmount,
            tools: cartItems 
          } 
        });
      }, 2000);
      
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
      setErrorMessage('There was an error processing your payment. Please try again.');
      
      // Redirect to error page
      navigate('/payment-error', { 
        state: { 
          paymentError: 'There was an error processing your payment. Please try again.',
        } 
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-gray-700">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-700">
                <div>
                  <h3 className="text-white font-medium">{item.name}</h3>
                  <p className="text-gray-400 text-sm">Quantity: {item.quantity || 1}</p>
                </div>
                <div className="text-white font-bold">₹{item.price * (item.quantity || 1)}</div>
              </div>
            ))}
          </div>
          
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span>₹{totalAmount}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Tax:</span>
              <span>₹0</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-2 mt-2 border-t border-gray-700">
              <span>Total:</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-gray-700">Payment Information</h2>
          
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-md mb-6">
            Payment integration has been removed. This is a placeholder for your new payment method.
          </div>
          
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-md mb-6">
              {errorMessage}
            </div>
          )}
          
          <button 
            onClick={handlePlaceOrder}
            disabled={isProcessing || !cartItems.length}
            className={`w-full py-3 rounded-md font-semibold transition-colors flex items-center justify-center mb-4 ${
              isProcessing || !cartItems.length
                ? 'bg-indigo-800/50 text-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Place Order'}
          </button>
          
          <button 
            onClick={() => navigate('/cart')}
            disabled={isProcessing}
            className="w-full py-3 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 
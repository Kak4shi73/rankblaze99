import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { initializePhonePePayment } from '../utils/payment';
import { CreditCard, ArrowLeft, ShoppingBag } from 'lucide-react';

const Checkout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart, getTotalPrice } = useCart();
  const totalAmount = getTotalPrice();

  // Add debug console logs
  useEffect(() => {
    console.log("🧾 Cart Items:", cartItems);
    console.log("👤 User Info:", user);
  }, [cartItems, user]);

  // Redirect if no user or empty cart
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!cartItems.length) {
      navigate('/cart');
    }
  }, [user, cartItems, navigate]);

  const handlePlaceOrder = async () => {
    // More explicit condition checking for debugging
    if (!user) {
      console.log("❌ Error: User is not logged in", user);
      setErrorMessage('Please login to continue checkout.');
      return;
    }
    
    if (!cartItems.length) {
      console.log("❌ Error: Cart is empty", cartItems);
      setErrorMessage('Please add tools to your cart.');
      return;
    }
    
    if (!user?.id) {
      console.log("❌ Error: Missing user ID", user);
      setErrorMessage('User authentication issue. Please login again.');
      return;
    }
    
    console.log("✅ Proceeding with payment for:", {
      userId: user.id,
      toolId: cartItems[0].id,
      amount: totalAmount
    });
    
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      // Get the first tool ID from cart (we'll associate the payment with this tool)
      const primaryToolId = cartItems[0].id;

      // Initialize PhonePe payment
      const response = await initializePhonePePayment(
        totalAmount,
        user.id,
        primaryToolId
      );
      
      console.log("📱 PhonePe Response:", response);

      if (response.success && response.payload && response.checksum && response.merchantTransactionId) {
        // Store cart items in session storage for reference after payment
        sessionStorage.setItem('pendingCartItems', JSON.stringify(cartItems));
        
        // Going back to form submission to avoid CORS issues
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';
        
        // Base64 encoded request payload
        const payloadInput = document.createElement('input');
        payloadInput.type = 'hidden';
        payloadInput.name = 'request';
        payloadInput.value = response.payload;
        
        form.appendChild(payloadInput);
        
        // Log what we're submitting
        console.log("📤 Submitting form to PhonePe with payload:", response.payload);
        console.log("📤 Merchant ID should be: M22QF2VXZLOE8");
        
        // Decode payload for debugging
        try {
          const decodedPayload = JSON.parse(atob(response.payload));
          console.log("Decoded payload:", decodedPayload);
        } catch (e) {
          console.error("Could not decode payload:", e);
        }
        
        // Append form to body and submit
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error(response.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
      setErrorMessage('There was an error processing your payment. Please try again.');
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
          
          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-700 mb-6">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-2 rounded-md mr-3">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Secure Payment</h3>
                <p className="text-gray-400 text-sm">Your payment information is secure</p>
              </div>
            </div>
          </div>
          
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-md mb-6">
              {errorMessage}
            </div>
          )}
          
          <button 
            onClick={handlePlaceOrder}
            disabled={isProcessing || !cartItems.length || !user}
            className={`w-full py-3 rounded-md font-semibold transition-colors flex items-center justify-center mb-4 ${
              isProcessing || !cartItems.length || !user
                ? 'bg-indigo-800/50 text-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Pay with PhonePe ₹{totalAmount}
              </div>
            )}
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
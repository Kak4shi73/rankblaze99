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

  // Redirect if no user or empty cart
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!cartItems.length) {
      navigate('/cart');
    }
  }, [user, cartItems, navigate]);

  const handlePlaceOrder = async () => {
    console.log("🟠 Pay button clicked", { totalAmount, userId: user?.uid });
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      // Get the first tool ID from cart (we'll associate the payment with this tool)
      const primaryToolId = cartItems[0].id;
      console.log("🛠 About to call initializePhonePePayment", { totalAmount, userId: user?.uid, primaryToolId });

      // Initialize PhonePe payment
      const response = await initializePhonePePayment(
        totalAmount,
        user.uid,
        primaryToolId
      );
      
      console.log("📦 Response from server:", response);

      if (response.success) {
        // Store cart items in session storage for reference after payment
        sessionStorage.setItem('pendingCartItems', JSON.stringify(cartItems));
        console.log("✅ Creating form for PhonePe submission");
        
        // Create form and submit to PhonePe
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://pay-api.phonepe.com/apis/hermes/pg/v1/pay';
        
        const payloadInput = document.createElement('input');
        payloadInput.type = 'hidden';
        payloadInput.name = 'request';
        payloadInput.value = response.payload;

        const checksumInput = document.createElement('input');
        checksumInput.type = 'hidden';
        checksumInput.name = 'checksum';
        checksumInput.value = response.checksum;

        form.appendChild(payloadInput);
        form.appendChild(checksumInput);
        document.body.appendChild(form);
        console.log("🚀 Submitting form to PhonePe");
        form.submit();
      } else {
        console.error("❌ Payment initialization failed:", response.error);
        throw new Error(response.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
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
          
          {/* Test button to verify API connectivity */}
          <button 
            onClick={async () => {
              console.log("🧪 Testing direct API connection...");
              try {
                const response = await fetch('https://us-central1-rankblaze-138f7.cloudfunctions.net/api/initializePayment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    amount: 149,
                    userId: 'test_user',
                    toolId: 'test_tool'
                  }),
                  credentials: 'include',
                  mode: 'cors'
                });
                
                console.log("🔄 API Response Status:", response.status);
                const data = await response.text();
                console.log("📄 API Response Body:", data);
                
                try {
                  const jsonData = JSON.parse(data);
                  console.log("✅ Parsed JSON data:", jsonData);
                } catch (e) {
                  console.error("❌ Could not parse as JSON:", e);
                }
              } catch (error) {
                console.error("❌ API Test Error:", error);
              }
            }}
            className="w-full py-3 rounded-md font-semibold transition-colors flex items-center justify-center mb-4 bg-orange-600 hover:bg-orange-700 text-white"
          >
            Test API Connection
          </button>
          
          {/* Simple test button to verify click handling */}
          <button 
            onClick={() => console.log("🧪 TEST BUTTON CLICKED - This should appear in console")}
            className="w-full py-3 rounded-md font-semibold transition-colors flex items-center justify-center mb-4 bg-green-600 hover:bg-green-700 text-white"
          >
            Test Click (Check Console)
          </button>
          
          <button 
            onClick={handlePlaceOrder}
            disabled={isProcessing || !cartItems.length}
            className={`w-full py-3 rounded-md font-semibold transition-colors flex items-center justify-center mb-4 ${
              isProcessing || !cartItems.length
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
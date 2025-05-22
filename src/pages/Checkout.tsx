import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { initializePhonePePayment } from '../utils/payment';
import { CreditCard, ArrowLeft, ShoppingBag } from 'lucide-react';

const Checkout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getTotalPrice, clearCart } = useCart();
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
    if (!user || !cartItems.length) {
      navigate('/cart');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Get the first tool ID from cart (we'll associate the payment with this tool)
      // In case of multiple tools, we'll handle the assignment in the backend
      const primaryToolId = cartItems[0].id;

      // Initialize payment using the total cart amount
      const response = await initializePhonePePayment(
        totalAmount,
        user.uid,
        primaryToolId
      );

      if (response.success) {
        // Store cart items in session storage for reference after payment
        sessionStorage.setItem('pendingCartItems', JSON.stringify(cartItems));
        
        // Create form and submit to PhonePe
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';
        
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
        form.submit();
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      setErrorMessage(error instanceof Error ? error.message : 'Payment initialization failed');
    }
  };

  if (!user || !cartItems.length) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center text-indigo-300 hover:text-indigo-200 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Cart
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
            
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between py-3 border-b border-gray-700">
                <div>
                  <h3 className="text-white">{item.name}</h3>
                  <p className="text-gray-400">Quantity: {item.quantity || 1}</p>
                </div>
                <div className="text-white font-bold">₹{item.price * (item.quantity || 1)}</div>
              </div>
            ))}

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal:</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tax:</span>
                <span>₹0</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-2 border-t border-gray-700">
                <span>Total:</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Payment Information</h2>
            
            {errorMessage && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-md mb-6">
                {errorMessage}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-700">
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
              
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className={`w-full py-3 rounded-md font-semibold transition-colors flex items-center justify-center
                  ${isProcessing 
                    ? 'bg-indigo-800/50 text-indigo-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
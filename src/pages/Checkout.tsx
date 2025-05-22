```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { initializePhonePePayment } from '../utils/payment';
import { CreditCard, ArrowLeft } from 'lucide-react';

const Checkout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const totalAmount = getTotalPrice();

  const handlePlaceOrder = async () => {
    if (!user || !cartItems.length) {
      navigate('/cart');
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize payment for first item in cart
      const item = cartItems[0];
      const response = await initializePhonePePayment(
        item.price,
        user.id,
        item.id
      );

      if (response.success) {
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
        form.submit();
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center text-indigo-300 hover:text-indigo-200 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Cart
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
            
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between py-3 border-b border-gray-700">
                <div>
                  <h3 className="text-white">{item.name}</h3>
                  <p className="text-gray-400">Quantity: {item.quantity || 1}</p>
                </div>
                <div className="text-white font-bold">₹{item.price}</div>
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

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Payment Information</h2>
            
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className={`w-full flex items-center justify-center py-4 px-6 rounded-lg font-medium transition-all duration-300 ${
                isProcessing
                  ? 'bg-indigo-800 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white`}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay with PhonePe
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
```
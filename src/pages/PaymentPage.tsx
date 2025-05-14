import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import { ref, set } from 'firebase/database';
import { 
  createOrder,
  verifyPaymentStatus, 
} from '../utils/cashfree';

type PaymentMethod = 'cashfree';

declare global {
  interface Window {
    Cashfree: any;
  }
}

const PaymentPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cashfree');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const cartItems = location.state?.cartItems || [];
  const total = location.state?.total || 0;
  
  // Check if Cashfree SDK is loaded
  useEffect(() => {
    if (!window.Cashfree) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js';
      script.async = true;
      script.onload = () => console.log('Cashfree SDK loaded dynamically');
      script.onerror = () => setErrorMessage('Failed to load Cashfree SDK');
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!cartItems.length) {
      navigate('/cart');
      return;
    }
  }, [user, cartItems, navigate]);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setIsCreatingOrder(true);
      setErrorMessage(null);
      
      // Make sure the Cashfree SDK is available
      if (!window.Cashfree) {
        throw new Error('Cashfree SDK not loaded. Please refresh the page and try again.');
      }
      
      showToast('Creating order...', 'info');
      
      // Create an order in Cashfree - amount in rupees (Cashfree accepts decimal amount)
      const orderOptions = {
        amount: total,
        currency: 'INR',
        customerName: user?.name || '',
        customerPhone: '9999999999', // Using a default phone as it's not stored in User type
        customerEmail: user?.email || '',
        notes: {
          userId: user?.id || '',
          items: JSON.stringify(cartItems.map((item: any) => ({ id: item.id, name: item.name })))
        }
      };
      
      console.log('Order options:', orderOptions);
      
      // Use Firebase function to create the order securely
      const order = await createOrder(orderOptions);
      console.log('Order created:', order);
      
      setIsCreatingOrder(false);
      
      if (!order || !order.payment_session_id) {
        throw new Error('Failed to create order. No payment session ID returned.');
      }
      
      showToast('Order created successfully!', 'success');
      
      // Initialize Cashfree drop-in checkout
      const cashfree = new window.Cashfree(order.payment_session_id);
      
      // Handle payment events
      cashfree.on('payment_success', (data: any) => {
        console.log('Payment success', data);
        handlePaymentSuccess(order.orderId, order.amount);
      });
      
      cashfree.on('payment_error', (data: any) => {
        console.error('Payment error', data);
        setIsProcessing(false);
        setErrorMessage('Payment failed: ' + (data.error?.reason || 'Unknown error'));
        showToast('Payment failed', 'error');
      });
      
      cashfree.on('close', () => {
        setIsProcessing(false);
        showToast('Payment cancelled', 'info');
      });
      
      // Open Cashfree checkout with proper config
      try {
        cashfree.redirect();
      } catch (error) {
        console.error('Error during Cashfree redirect:', error);
        throw new Error('Unable to open payment gateway. Please try again.');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      setIsProcessing(false);
      setIsCreatingOrder(false);
      
      // Display error message
      const errorMsg = error instanceof Error ? error.message : 'Payment initialization failed';
      setErrorMessage(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handlePaymentSuccess = async (
    orderId: string,
    amount: number
  ) => {
    try {
      showToast('Verifying payment...', 'info');
      
      // Verify payment status through Firebase Function
      const isValid = await verifyPaymentStatus(orderId, amount);
      
      if (!isValid) {
        showToast('Payment verification failed', 'error');
        setIsProcessing(false);
        return;
      }
      
      showToast('Payment verified!', 'success');
      const now = new Date().toISOString();

      // Create payment record
      const paymentId = `cf_${Date.now()}`;
      const paymentRef = ref(db, `payments/${paymentId}`);
      const paymentData = {
        userId: user?.id,
        amount: total,
        orderId: orderId,
        paymentMethod: 'cashfree',
        status: 'completed',
        createdAt: now,
        updatedAt: now
      };
      await set(paymentRef, paymentData);

      // Create subscriptions for each item
      for (const item of cartItems) {
        const subscriptionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 10);
        const subscriptionRef = ref(db, `subscriptions/${subscriptionId}`);
        const subscriptionData = {
          userId: user?.id,
          productId: item.id,
          productName: item.name,
          amount: item.price,
          paymentId,
          startDate: now,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          createdAt: now
        };
        await set(subscriptionRef, subscriptionData);
      }

      setIsProcessing(false);
      showToast('Payment successful!', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error processing payment success:', error);
      showToast('Failed to process payment', 'error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Cart
        </button>

        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h1 className="text-2xl font-bold text-white">Complete Payment</h1>
              <p className="text-indigo-300 mt-1">Secure payment via Cashfree</p>
            </div>

            <div className="p-6">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                <button
                  className="p-4 rounded-lg border border-indigo-500 bg-indigo-900/50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-indigo-600">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-white">Cashfree</h3>
                      <p className="text-indigo-300 text-sm">Pay securely with Cashfree</p>
                    </div>
                    <Check className="h-5 w-5 text-indigo-400 ml-auto" />
                  </div>
                </button>
              </div>

              {/* Error message display */}
              {errorMessage && (
                <div className="bg-red-900/50 border border-red-600 text-white p-4 rounded-lg mb-6">
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
                <div className="space-y-4">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-indigo-200">
                      <span>{item.name}</span>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-700 pt-4 flex justify-between font-semibold text-white">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                  isProcessing
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isCreatingOrder ? 'Creating Order...' : 'Processing...'}
                  </>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
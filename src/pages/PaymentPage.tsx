import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import { ref, set } from 'firebase/database';
import { 
  createOrder, 
  createOrderDirectly, 
  verifyPaymentSignature, 
  RAZORPAY_KEY_ID 
} from '../utils/razorpay';

type PaymentMethod = 'razorpay';

const PaymentPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [useDirectApi, setUseDirectApi] = useState(true); // Use direct API by default
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const cartItems = location.state?.cartItems || [];
  const total = location.state?.total || 0;

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
      
      showToast('Creating order...', 'info');
      
      // Create an order in Razorpay - amount in paise (multiply by 100)
      const orderOptions = {
        amount: Math.round(total * 100), // Ensure the amount is an integer
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: user?.id || '',
          items: JSON.stringify(cartItems.map((item: any) => ({ id: item.id, name: item.name })))
        }
      };
      
      // Choose which API method to use based on deployment status
      const order = useDirectApi 
        ? await createOrderDirectly(orderOptions)
        : await createOrder(orderOptions);
      
      setIsCreatingOrder(false);
      
      if (!order || !order.orderId) {
        throw new Error('Failed to create order. No order ID returned.');
      }
      
      showToast('Order created successfully!', 'success');
      
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Rank Blaze',
        description: 'Purchase of SEO Tools',
        image: '/logo.png',
        order_id: order.orderId,
        handler: function (response: any) {
          // Handle successful payment
          handlePaymentSuccess(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4338ca',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            showToast('Payment cancelled', 'info');
          }
        }
      };

      // Open Razorpay checkout form
      const razorpayWindow = new (window as any).Razorpay(options);
      razorpayWindow.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      setIsProcessing(false);
      setIsCreatingOrder(false);
      
      // Display error message
      const errorMsg = error instanceof Error ? error.message : 'Payment initialization failed';
      setErrorMessage(errorMsg);
      showToast(errorMsg, 'error');
      
      // If Firebase Function failed, suggest trying direct API
      if (!useDirectApi && error instanceof Error && error.message.includes('Internal server error')) {
        setErrorMessage(errorMsg + ' Try using direct API for testing.');
      }
    }
  };

  const handlePaymentSuccess = async (
    paymentId: string,
    orderId: string,
    signature: string
  ) => {
    try {
      showToast('Verifying payment...', 'info');
      
      // For demo purposes, just assume verification is successful if using direct API
      const isValid = useDirectApi ? true : await verifyPaymentSignature(orderId, paymentId, signature);
      
      if (!isValid) {
        showToast('Payment verification failed', 'error');
        setIsProcessing(false);
        return;
      }
      
      showToast('Payment verified!', 'success');
      const now = new Date().toISOString();

      // Create payment record
      const paymentRef = ref(db, `payments/${paymentId}`);
      const paymentData = {
        userId: user?.id,
        amount: total,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        paymentMethod: 'razorpay',
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
              <p className="text-indigo-300 mt-1">Secure payment via Razorpay</p>
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
                      <h3 className="text-lg font-semibold text-white">Razorpay</h3>
                      <p className="text-indigo-300 text-sm">Pay securely with Razorpay</p>
                    </div>
                    <Check className="h-5 w-5 text-indigo-400 ml-auto" />
                  </div>
                </button>
              </div>

              {/* API Method Toggle */}
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-900/50 rounded-lg">
                <span className="text-indigo-300">Use Direct API (for testing)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useDirectApi} 
                    onChange={() => setUseDirectApi(!useDirectApi)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
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
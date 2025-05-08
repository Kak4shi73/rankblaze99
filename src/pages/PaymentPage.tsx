import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Check, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import { ref, set } from 'firebase/database';

type PaymentMethod = 'razorpay' | 'binance';

interface PaymentDetails {
  razorpay: {
    link: string;
  };
  binance: {
    network: string;
    address: string;
    id: string;
  };
}

const paymentDetails: PaymentDetails = {
  razorpay: {
    link: 'razorpay.me/@MaxRajput'
  },
  binance: {
    network: 'Tron(TRC20)',
    address: 'TM2tjmRxLQXaAUJcG3FNcpJrnerfL194M4',
    id: '1010075495'
  }
};

const PaymentPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
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

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      showToast('Copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  const initiatePaymentTracking = async () => {
    try {
      setIsProcessing(true);
      const now = new Date().toISOString();

      // Create payment record
      const paymentId = Date.now().toString();
      const paymentRef = ref(db, `payments/${paymentId}`);
      const paymentData = {
        userId: user?.id,
        amount: total,
        paymentMethod: selectedMethod,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };
      await set(paymentRef, paymentData);

      // Create subscriptions for each item
      for (const item of cartItems) {
        const subscriptionId = Date.now().toString();
        const subscriptionRef = ref(db, `subscriptions/${subscriptionId}`);
        const subscriptionData = {
          userId: user?.id,
          productId: item.id,
          productName: item.name,
          amount: item.price,
          paymentId,
          startDate: now,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          createdAt: now
        };
        await set(subscriptionRef, subscriptionData);
      }

      // Simulate payment confirmation
      setTimeout(async () => {
        try {
          // Update payment status
          await set(paymentRef, {
            ...paymentData,
            status: 'completed',
            updatedAt: new Date().toISOString()
          });

          // Update subscription statuses
          const subscriptionsRef = ref(db, 'subscriptions');
          const subscriptionsSnapshot = await get(subscriptionsRef);
          if (subscriptionsSnapshot.exists()) {
            const subscriptions = subscriptionsSnapshot.val();
            for (const [id, subscription] of Object.entries(subscriptions)) {
              if (subscription.paymentId === paymentId) {
                await set(ref(db, `subscriptions/${id}`), {
                  ...subscription,
                  status: 'active',
                  updatedAt: new Date().toISOString()
                });
              }
            }
          }

          showToast('Payment processed successfully', 'success');
          navigate('/dashboard');
        } catch (error) {
          console.error('Error updating payment status:', error);
          showToast('Failed to process payment', 'error');
        } finally {
          setIsProcessing(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Error initiating payment:', error);
      showToast('Failed to initiate payment', 'error');
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
              <p className="text-indigo-300 mt-1">Choose your preferred payment method</p>
            </div>

            <div className="p-6">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setSelectedMethod('razorpay')}
                  className={`p-4 rounded-lg border ${
                    selectedMethod === 'razorpay'
                      ? 'border-indigo-500 bg-indigo-900/50'
                      : 'border-gray-700 bg-gray-900/50 hover:bg-gray-900'
                  } transition-colors`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${
                      selectedMethod === 'razorpay' ? 'bg-indigo-600' : 'bg-gray-800'
                    }`}>
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-white">Razorpay</h3>
                      <p className="text-indigo-300 text-sm">Pay using Razorpay link</p>
                    </div>
                    {selectedMethod === 'razorpay' && (
                      <Check className="h-5 w-5 text-indigo-400 ml-auto" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMethod('binance')}
                  className={`p-4 rounded-lg border ${
                    selectedMethod === 'binance'
                      ? 'border-indigo-500 bg-indigo-900/50'
                      : 'border-gray-700 bg-gray-900/50 hover:bg-gray-900'
                  } transition-colors`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${
                      selectedMethod === 'binance' ? 'bg-indigo-600' : 'bg-gray-800'
                    }`}>
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-white">Binance</h3>
                      <p className="text-indigo-300 text-sm">Pay using Binance</p>
                    </div>
                    {selectedMethod === 'binance' && (
                      <Check className="h-5 w-5 text-indigo-400 ml-auto" />
                    )}
                  </div>
                </button>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Payment Details</h2>
                
                {selectedMethod === 'razorpay' ? (
                  <div>
                    <p className="text-indigo-300 mb-4">
                      Click the button below to open Razorpay payment link
                    </p>
                    <div className="flex items-center space-x-4">
                      <a
                        href={`https://${paymentDetails.razorpay.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Open Razorpay
                      </a>
                      <button
                        onClick={() => handleCopy(paymentDetails.razorpay.link, 'razorpay')}
                        className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        {copied === 'razorpay' ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-indigo-300 mb-1">Network</p>
                      <div className="flex items-center bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <span className="text-white">{paymentDetails.binance.network}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-indigo-300 mb-1">Binance ID</p>
                      <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <span className="text-white">{paymentDetails.binance.id}</span>
                        <button
                          onClick={() => handleCopy(paymentDetails.binance.id, 'id')}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {copied === 'id' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-indigo-300 mb-1">Deposit Address</p>
                      <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <span className="text-white break-all">{paymentDetails.binance.address}</span>
                        <button
                          onClick={() => handleCopy(paymentDetails.binance.address, 'address')}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors ml-4"
                        >
                          {copied === 'address' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
                onClick={initiatePaymentTracking}
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
                    Processing Payment...
                  </>
                ) : (
                  'Confirm Payment'
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
```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyPaymentStatus } from '../utils/payment';
import { Check, X } from 'lucide-react';

const PaymentStatus = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const merchantTransactionId = queryParams.get('merchantTransactionId');

    if (!merchantTransactionId) {
      setStatus('failed');
      return;
    }

    const checkStatus = async () => {
      try {
        const isSuccess = await verifyPaymentStatus(merchantTransactionId);
        setStatus(isSuccess ? 'success' : 'failed');
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
      }
    };

    checkStatus();
  }, [location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Processing Payment</h2>
              <p className="text-gray-400">Please wait while we verify your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
              <p className="text-gray-400 mb-6">Your tool access has been activated.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-gray-400 mb-6">Something went wrong with your payment.</p>
              <button
                onClick={() => navigate('/cart')}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
```
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyPaymentStatus } from '../utils/payment';
import { Check, X } from 'lucide-react';
import { firestore } from '../config/firebase';
import { updateDoc, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const PaymentStatus = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [tools, setTools] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const merchantTransactionId = queryParams.get('merchantTransactionId');
    
    if (!merchantTransactionId) {
      setStatus('failed');
      return;
    }

    setOrderId(merchantTransactionId);

    // Retrieve pending cart items from session storage
    const pendingCartItemsJson = sessionStorage.getItem('pendingCartItems');
    let pendingCartItems: any[] = [];
    
    if (pendingCartItemsJson) {
      try {
        pendingCartItems = JSON.parse(pendingCartItemsJson);
        setTools(pendingCartItems);
      } catch (e) {
        console.error('Error parsing pendingCartItems:', e);
      }
    }

    const checkStatus = async () => {
      try {
        // Verify payment with the backend
        const isSuccess = await verifyPaymentStatus(merchantTransactionId);
        
        if (isSuccess) {
          setStatus('success');
          
          // Clear the cart items from session storage
          sessionStorage.removeItem('pendingCartItems');
          
          // Update user's profile if needed
          if (user && pendingCartItems.length > 0) {
            try {
              // Create a record of the successful purchase
              const purchaseRecord = {
                userId: user.uid,
                orderId: merchantTransactionId,
                purchasedAt: serverTimestamp(),
                tools: pendingCartItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.price
                }))
              };
              
              // Add to user's purchase history
              await addDoc(collection(firestore, 'user_purchases'), purchaseRecord);
            } catch (error) {
              console.error('Error updating user profile:', error);
            }
          }
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
      }
    };

    checkStatus();
  }, [location.search, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 rounded-xl p-8 text-center shadow-2xl">
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
              <p className="text-gray-300 mb-6">Your payment was successful and your tools have been activated.</p>
              
              {orderId && (
                <div className="bg-gray-700/50 rounded-lg p-3 mb-6 border border-gray-700/50">
                  <p className="text-gray-300 text-sm">Order ID: <span className="text-indigo-300 font-mono">{orderId}</span></p>
                </div>
              )}
              
              {tools.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-3">Purchased Items</h3>
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-700/50 text-left">
                    {tools.map((tool, index) => (
                      <div key={tool.id} className={`flex justify-between py-2 ${index !== tools.length - 1 ? 'border-b border-gray-600/50' : ''}`}>
                        <span className="text-gray-300">{tool.name}</span>
                        <span className="text-indigo-300">₹{tool.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-gray-300 mb-6">We couldn't process your payment. Please try again.</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
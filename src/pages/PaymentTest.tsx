import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  checkToolAccess, 
  getUserSubscriptions, 
  completePaymentFlow 
} from '../utils/firestorePayment';

const PaymentTest: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);

  const testCheckAccess = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await checkToolAccess(user.uid, 'chatgpt-plus');
      setResults(prev => ({ ...prev, checkAccess: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, checkAccess: { error: error.message } }));
    }
    setLoading(false);
  };

  const testGetSubscriptions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getUserSubscriptions(user.uid);
      setResults(prev => ({ ...prev, subscriptions: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, subscriptions: { error: error.message } }));
    }
    setLoading(false);
  };

  const testPaymentFlow = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await completePaymentFlow(user.uid, 'chatgpt-plus', 'ChatGPT Plus', 199);
      setResults(prev => ({ ...prev, paymentFlow: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, paymentFlow: { error: error.message } }));
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl mb-4">Payment Test Page</h1>
          <p>Please login to test payment functions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Payment System Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testCheckAccess}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg disabled:opacity-50"
          >
            Test Check Access
          </button>
          
          <button
            onClick={testGetSubscriptions}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg disabled:opacity-50"
          >
            Test Get Subscriptions
          </button>
          
          <button
            onClick={testPaymentFlow}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg disabled:opacity-50"
          >
            Test Payment Flow
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
          <pre className="text-green-400 text-sm overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">User Info</h2>
          <pre className="text-blue-400 text-sm">
            {JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            }, null, 2)}
          </pre>
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">URL Info</h2>
          <pre className="text-yellow-400 text-sm">
            {JSON.stringify({
              href: window.location.href,
              search: window.location.search,
              pathname: window.location.pathname,
              urlParams: Object.fromEntries(new URLSearchParams(window.location.search))
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PaymentTest; 
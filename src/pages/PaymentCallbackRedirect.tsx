import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Redirect component that handles PhonePe callback to payment-success
 * This component redirects from /payment-callback to /payment-success
 * while preserving all query parameters from PhonePe
 */
const PaymentCallbackRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  React.useEffect(() => {
    // Get all query parameters
    const queryParams = new URLSearchParams(location.search);
    
    // PhonePe might use different parameter names - check all possible variations
    const merchantTransactionId = queryParams.get('merchantTransactionId') || 
                                 queryParams.get('transactionId') || 
                                 queryParams.get('merchantOrderId') ||
                                 queryParams.get('txnId');
    
    // Log for debugging purposes
    console.log('Payment callback received with params:', Object.fromEntries(queryParams.entries()));
    console.log('Extracted transaction ID:', merchantTransactionId);
    
    if (merchantTransactionId) {
      // If we have a transaction ID, redirect with it explicitly set as merchantTransactionId
      navigate(`/payment-success?merchantTransactionId=${merchantTransactionId}`, { replace: true });
    } else {
      // If no transaction ID found in any expected parameter, pass all original query params
      console.warn('No transaction ID found in callback parameters');
      navigate(`/payment-success${location.search}`, { replace: true });
    }
  }, [navigate, location]);
  
  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Redirecting...</h2>
        <p className="text-gray-400">Please wait while we process your payment...</p>
      </div>
    </div>
  );
};

export default PaymentCallbackRedirect; 
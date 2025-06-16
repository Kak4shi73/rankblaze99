import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyAndGrantAccess, autoVerifyAndProcessPayment } from '../utils/payment';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { firestore, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { debugTransactionId, storeTransactionId } from '../utils/paymentDebug';

interface ToolItem {
  id: string;
  name: string;
  price?: number;
  quantity?: number;
}

const PaymentSuccess = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [purchasedTools, setPurchasedTools] = useState<ToolItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Extract the function to validate payment and activate tools
  const validatePaymentAndActivateTools = async () => {
    setStatus('loading');
    const queryParams = new URLSearchParams(location.search);
    
    // Log all query parameters for debugging
    console.log('Payment success page received params:', Object.fromEntries(queryParams.entries()));
    
    // Use debug utility to get transaction ID from all possible sources
    const txnDebug = debugTransactionId();
    let merchantTransactionId = txnDebug.finalTxnId;
    
    console.log('Transaction ID debug info:', txnDebug);
    
    // Store transaction ID if found
    if (merchantTransactionId) {
      storeTransactionId(merchantTransactionId);
      
      setOrderId(merchantTransactionId);
      
      try {
        await processPaymentWithTransactionId(merchantTransactionId);
        return;
      } catch (error) {
        console.error('Failed to process with transaction ID:', error);
        setStatus('failed');
        setErrorMessage('Error verifying payment. Please contact support with your Order ID for assistance.');
      }
    } else {
      console.error('No transaction ID found in URL or sessionStorage');
      setStatus('failed');
      setErrorMessage('No transaction ID was provided. Please contact support if you completed payment.');
    }
  };
  
  // Helper function to process payment with a transaction ID
  const processPaymentWithTransactionId = async (transactionId: string) => {
    console.log(`Processing payment for transaction ID: ${transactionId}`);
    
    if (!user?.uid) {
      console.error('User not authenticated, cannot process payment');
      setStatus('failed');
      setErrorMessage('You must be logged in to process payment. Please log in and try again.');
      return;
    }
    
    // Try our new direct verification and tool access function first
    const directResult = await verifyAndGrantAccess(transactionId);
    
    if (directResult.success) {
      console.log('Direct verification and tool access successful:', directResult.message);
      // Fetch the tools after successful verification
      await fetchToolsFromTransaction(transactionId);
      setStatus('success');
      return;
    }
    
    console.log('Direct verification failed, falling back to auto verification:', directResult.error);
    
    // Try the enhanced auto verification next
    const result = await autoVerifyAndProcessPayment(
      transactionId, 
      user?.uid // Pass user ID if available
    );
    
    if (result.success) {
      // Auto verification worked - fetch updated tools
      console.log('Auto verification succeeded:', result.message);
      const toolsQuery = new URLSearchParams(location.search).get('tools');
      
      if (toolsQuery) {
        try {
          const tools = JSON.parse(decodeURIComponent(toolsQuery)) as ToolItem[];
          setPurchasedTools(tools);
        } catch (e) {
          console.error('Error parsing tools from URL:', e);
        }
      } else {
        // If no tools in query params, try to fetch them from the transaction record
        try {
          await fetchToolsFromTransaction(transactionId);
        } catch (e) {
          console.error('Error fetching tools from transaction:', e);
        }
      }
      
      setStatus('success');
      return;
    } 
    
    console.log('All automated verification methods failed:', result.error);
    
    // Try manual verification by extracting tool ID from transaction ID format
    if (transactionId.startsWith('ord_')) {
      try {
        const parts = transactionId.split('_');
        if (parts.length >= 3) {
          const userId = parts[1];
          const toolId = parts[2];
          
          if (userId === user.uid) {
            // Check if user already has access to this tool
            const userToolRef = doc(firestore, 'users', userId, 'tools', toolId);
            const userToolDoc = await getDoc(userToolRef);
            
            if (userToolDoc.exists()) {
              console.log('User already has access to this tool');
              setPurchasedTools([{ id: toolId, name: 'Your Tool' }]);
              setStatus('success');
              return;
            }
            
            // Create a transaction record for manual verification
            const txnRef = doc(firestore, 'transactions', transactionId);
            await setDoc(txnRef, {
              userId,
              toolId,
              status: 'pending_verification',
              merchantTransactionId: transactionId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
            
            // Try to grant access directly as a fallback
            try {
              await grantToolAccess(userId, toolId);
              setPurchasedTools([{ id: toolId, name: 'Your Tool' }]);
              setStatus('success');
              return;
            } catch (grantError) {
              console.error('Failed to grant tool access:', grantError);
            }
          }
        }
      } catch (manualError) {
        console.error('Manual verification failed:', manualError);
      }
    }
    
    setStatus('failed');
    setErrorMessage(result.error || 'Payment verification failed');
  };
  
  // Helper function to fetch tools from transaction data
  const fetchToolsFromTransaction = async (transactionId: string) => {
    // Check Realtime Database
    const transactionRef = ref(db, `transactions/${transactionId}`);
    const snapshot = await get(transactionRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (data.tools && Array.isArray(data.tools)) {
        setPurchasedTools(data.tools);
        return;
      }
      if (data.toolId) {
        setPurchasedTools([{ id: data.toolId, name: data.toolName || 'Tool' }]);
        return;
      }
    }
    
    // Check Firestore
    const purchaseRef = doc(firestore, 'user_purchases', transactionId);
    const purchaseSnapshot = await getDoc(purchaseRef);
    
    if (purchaseSnapshot.exists()) {
      const purchaseData = purchaseSnapshot.data();
      if (purchaseData.tools && Array.isArray(purchaseData.tools)) {
        setPurchasedTools(purchaseData.tools as ToolItem[]);
        return;
      }
    }
    
    // Check transactions collection
    const transactionDocRef = doc(firestore, 'transactions', transactionId);
    const transactionDoc = await getDoc(transactionDocRef);
    
    if (transactionDoc.exists()) {
      const transactionData = transactionDoc.data();
      if (transactionData.toolId) {
        // Get tool name from tools collection if possible
        try {
          const toolDocRef = doc(firestore, 'tools', transactionData.toolId);
          const toolDoc = await getDoc(toolDocRef);
          
          if (toolDoc.exists()) {
            const toolData = toolDoc.data();
            setPurchasedTools([{ 
              id: transactionData.toolId, 
              name: toolData.name || 'Tool' 
            }]);
          } else {
            setPurchasedTools([{ 
              id: transactionData.toolId, 
              name: 'Purchased Tool' 
            }]);
          }
        } catch (e) {
          console.error('Error fetching tool details:', e);
          setPurchasedTools([{ 
            id: transactionData.toolId, 
            name: 'Purchased Tool' 
          }]);
        }
      }
    }
  };

  // Helper function to grant tool access directly
  const grantToolAccess = async (userId: string, toolId: string) => {
    try {
      // Add tool to user's tools collection
      const userToolRef = doc(firestore, 'users', userId, 'tools', toolId);
      await setDoc(userToolRef, {
        activatedAt: serverTimestamp(),
        toolId,
        source: 'direct_activation'
      });

      // Also update the user's tools array for backward compatibility
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        tools: arrayUnion(toolId),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Successfully granted access to tool ${toolId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error granting tool access:', error);
      throw error;
    }
  };

  // Function to retry verification
  const handleRetryActivation = async () => {
    setRetryCount(prev => prev + 1);
    setStatus('loading');
    
    // Get the transaction ID from state or session storage
    const txnId = orderId || sessionStorage.getItem('merchantTransactionId') || sessionStorage.getItem('lastTransactionId');
    
    if (txnId) {
      try {
        await processPaymentWithTransactionId(txnId);
      } catch (error) {
        console.error('Retry failed:', error);
        setStatus('failed');
        setErrorMessage('Verification failed. Please contact support with your Order ID.');
      }
    } else {
      setStatus('failed');
      setErrorMessage('No transaction ID available for retry.');
    }
  };

  // Initial verification on component mount
  useEffect(() => {
    validatePaymentAndActivateTools();
  }, [location.search, user]);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 sm:p-10">
          {status === 'loading' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
              <p className="text-gray-400">Please wait while we verify your payment...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-6">Payment Successful!</h2>
              
              {purchasedTools.length > 0 ? (
                <div className="mb-8">
                  <p className="text-lg text-gray-300 mb-4">You now have access to:</p>
                  <ul className="space-y-3">
                    {purchasedTools.map((tool, index) => (
                      <li key={index} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                        <span className="font-medium text-white">{tool.name}</span>
                        <button 
                          onClick={() => navigate(`/tool-access/${tool.id}`)}
                          className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
                        >
                          Access Tool <ArrowRight className="ml-2 w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-300 mb-6">Your purchase was successful!</p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-md transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Activation Failed</h2>
              <p className="text-gray-300 mb-6">{errorMessage}</p>
              
              {orderId && (
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300">Order ID: <span className="font-mono text-white">{orderId}</span></p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleRetryActivation}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-md transition-colors"
                  disabled={retryCount >= 3}
                >
                  Retry Activation
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-md transition-colors"
                >
                  Go to Dashboard
                </button>
                <a 
                  href="https://wa.me/+91 7071920835?text=I%20need%20help%20with%20my%20payment.%20Order%20ID:%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md transition-colors"
                >
                  Contact Support via WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 
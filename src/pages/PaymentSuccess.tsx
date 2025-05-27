import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyAndGrantAccess, autoVerifyAndProcessPayment } from '../utils/payment';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { firestore, db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { useAuth } from '../context/AuthContext';

interface ToolItem {
  id: string;
  name: string;
  price?: number;
  quantity?: number;
}

const PaymentSuccess = () => {
  const [status, setStatus] = React.useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [purchasedTools, setPurchasedTools] = React.useState<ToolItem[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Extract the function to validate payment and activate tools
  const validatePaymentAndActivateTools = async () => {
    setStatus('loading');
    const queryParams = new URLSearchParams(location.search);
    
    // Log all query parameters for debugging
    console.log('Payment success page received params:', Object.fromEntries(queryParams.entries()));
    
    // Check for multiple possible parameter names that PhonePe might use
    const merchantTransactionId = 
      queryParams.get('merchantTransactionId') || 
      queryParams.get('transactionId') || 
      queryParams.get('merchantOrderId') ||
      queryParams.get('txnId');
    
    console.log('Extracted transaction ID:', merchantTransactionId);
    
    // If no transaction ID is found, try to retrieve from sessionStorage
    if (!merchantTransactionId) {
      const storedTransactionId = sessionStorage.getItem('lastTransactionId');
      console.log('Checking sessionStorage for transaction ID:', storedTransactionId);
      
      if (storedTransactionId) {
        console.log('Using transaction ID from sessionStorage:', storedTransactionId);
        setOrderId(storedTransactionId);
        
        // Continue with payment validation using the stored transaction ID
        try {
          await processPaymentWithTransactionId(storedTransactionId);
          return;
        } catch (error) {
          console.error('Failed to process with stored transaction ID:', error);
        }
      }
      
      setStatus('failed');
      setErrorMessage('No transaction ID was provided');
      return;
    }

    setOrderId(merchantTransactionId);
    
    // Store transaction ID in sessionStorage for backup retrieval if needed
    sessionStorage.setItem('lastTransactionId', merchantTransactionId);
    
    try {
      await processPaymentWithTransactionId(merchantTransactionId);
    } catch (error) {
      console.error('Error during payment validation and tool activation:', error);
      setStatus('failed');
      setErrorMessage('An unexpected error occurred during payment processing');
    }
  };
  
  // Helper function to process payment with a transaction ID
  const processPaymentWithTransactionId = async (transactionId: string) => {
    console.log(`Processing payment for transaction ID: ${transactionId}`);
    
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

  React.useEffect(() => {
    validatePaymentAndActivateTools();
  }, [location.search, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 rounded-xl p-8 text-center shadow-2xl">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Activating Your Tools</h2>
              <p className="text-gray-400">Please wait while we validate your payment and activate your tools...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-gray-300 mb-6">Congratulations, your tools have been activated.</p>
              
              {orderId && (
                <div className="bg-gray-700/50 rounded-lg p-3 mb-6 border border-gray-700/50">
                  <p className="text-gray-300 text-sm">Order ID: <span className="text-indigo-300 font-mono">{orderId}</span></p>
                </div>
              )}
              
              {purchasedTools.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-3">Activated Tools</h3>
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-700/50 text-left">
                    {purchasedTools.map((tool: ToolItem, index: number) => (
                      <div key={tool.id} className={`flex justify-between py-2 ${index !== purchasedTools.length - 1 ? 'border-b border-gray-600/50' : ''}`}>
                        <span className="text-gray-300">{tool.name}</span>
                        <span className="text-green-400">Activated</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => navigate('/dashboard/tools')}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                Go to your tools <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Activation Failed</h2>
              <p className="text-gray-300 mb-6">{errorMessage || "We couldn't activate your tools. Please contact support."}</p>
              
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => validatePaymentAndActivateTools()}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Retry Activation
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
                
                <a
                  href={`https://wa.me/917982604809?text=Hello%2C%20I%20just%20made%20a%20payment%20but%20my%20tools%20were%20not%20activated%20automatically.%20My%20order%20ID%20is%20${orderId || 'unknown'}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  Contact Support via WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 
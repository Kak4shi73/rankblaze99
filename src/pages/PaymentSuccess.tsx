import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyPaymentStatus, autoVerifyAndProcessPayment } from '../utils/payment';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { firestore, db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, get, set } from 'firebase/database';
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
    
    // Check for multiple possible parameter names that PhonePe might use
    const merchantTransactionId = 
      queryParams.get('merchantTransactionId') || 
      queryParams.get('transactionId') || 
      queryParams.get('merchantOrderId') ||
      queryParams.get('txnId');
    
    // If no transaction ID is found, show an error
    if (!merchantTransactionId) {
      setStatus('failed');
      setErrorMessage('No transaction ID was provided');
      return;
    }

    setOrderId(merchantTransactionId);

    try {
      // Try the enhanced auto verification first
      console.log('Using enhanced auto verification for transaction:', merchantTransactionId);
      const result = await autoVerifyAndProcessPayment(
        merchantTransactionId, 
        user?.uid // Pass user ID if available
      );
      
      if (result.success) {
        // Auto verification worked - fetch updated tools
        const toolsQuery = new URLSearchParams(location.search).get('tools');
        
        if (toolsQuery) {
          try {
            const tools = JSON.parse(decodeURIComponent(toolsQuery)) as ToolItem[];
            setPurchasedTools(tools);
          } catch (e) {
            console.error('Error parsing tools from URL:', e);
          }
        }
        
        setStatus('success');
        return;
      } else {
        // If auto verification failed, fall back to manual process
        console.log('Auto verification failed, falling back to manual process...');
        // Continue with existing logic...
      
        // Step 1: Validate the payment with the payment gateway
        const paymentResult = await verifyPaymentStatus(merchantTransactionId);
        
        if (!paymentResult.success) {
          console.error('Payment verification failed:', paymentResult.error);
          setStatus('failed');
          setErrorMessage(paymentResult.error || 'Payment verification failed');
          return;
        }

        // If there's no user, we can't proceed with activation
        if (!user) {
          console.error('User not authenticated during payment success processing');
          setStatus('failed');
          setErrorMessage('User authentication required. Please log in.');
          return;
        }

        // Step 2: Retrieve purchased tools from Firestore or Realtime Database
        // First check Realtime Database
        console.log(`Checking transaction data for ID: ${merchantTransactionId}`);
        const transactionRef = ref(db, `transactions/${merchantTransactionId}`);
        const transactionSnapshot = await get(transactionRef);
        
        let tools: ToolItem[] = [];

        if (transactionSnapshot.exists()) {
          const transaction = transactionSnapshot.val();
          
          if (transaction.tools && Array.isArray(transaction.tools)) {
            tools = transaction.tools;
          } else if (transaction.toolId) {
            // Single tool purchase
            tools = [{ id: transaction.toolId, name: transaction.toolName || 'Tool' }];
          }
        } else {
          // If not found in Realtime DB, check Firestore
          const userPurchaseRef = doc(firestore, 'user_purchases', merchantTransactionId);
          const userPurchaseSnapshot = await getDoc(userPurchaseRef);
          
          if (userPurchaseSnapshot.exists()) {
            const purchaseData = userPurchaseSnapshot.data();
            if (purchaseData.tools && Array.isArray(purchaseData.tools)) {
              tools = purchaseData.tools as ToolItem[];
            }
          } else {
            // Check session storage as a fallback
            const pendingCartItemsJson = sessionStorage.getItem('pendingCartItems');
            if (pendingCartItemsJson) {
              try {
                const pendingCartItems = JSON.parse(pendingCartItemsJson);
                tools = pendingCartItems.map((item: any) => ({
                  id: item.id,
                  name: item.name
                }));
              } catch (e) {
                console.error('Error parsing pendingCartItems:', e);
              }
            }
          }
        }

        // If we still don't have tools, show an error
        if (tools.length === 0) {
          setStatus('failed');
          setErrorMessage('No tools found for this transaction');
          return;
        }

        setPurchasedTools(tools);

        // Step 3: Activate the tools in the user's profile
        const userRef = doc(firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);
        
        if (userSnapshot.exists()) {
          // Update the user document to add the purchased tools
          await updateDoc(userRef, {
            tools: arrayUnion(...tools.map(tool => tool.id)),
            updatedAt: serverTimestamp()
          });
          
          // Record the purchase in the user's purchase history
          const purchaseRecord = {
            userId: user.uid,
            orderId: merchantTransactionId,
            purchasedAt: serverTimestamp(),
            tools: tools
          };
          
          await updateDoc(doc(firestore, 'user_purchases', merchantTransactionId), purchaseRecord, { merge: true });
          
          // Clear any pending items from session storage
          sessionStorage.removeItem('pendingCartItems');
          
          setStatus('success');
        } else {
          setStatus('failed');
          setErrorMessage('User profile not found');
        }
      }
    } catch (error) {
      console.error('Error during payment validation and tool activation:', error);
      setStatus('failed');
      setErrorMessage('An unexpected error occurred during payment processing');
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
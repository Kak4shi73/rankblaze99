import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Download, Copy, ArrowLeft, ExternalLink, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import { ref, get, onValue, set } from 'firebase/database';
import { 
  checkToolAccess, 
  getUserSubscriptions, 
  completePaymentFlow,
  verifyAndCompletePayment,
  subscribeToUserSubscriptions 
} from '../utils/firestorePayment';

// Define types for the application
interface ToolInfoItem {
  name: string;
  icon: string;
  description: string;
  downloadUrl: string;
  toolUrl: string;
  useIdPassword?: boolean; // Flag to indicate if this tool uses ID/Password instead of token
}

interface ToolInfoMap {
  [key: string]: ToolInfoItem;
  default: ToolInfoItem;
}

interface Access {
  id: string;
  userId: string;
  startDate: number;
  endDate: number;
  status: string;
  tools: Array<{ id: string; name: string; }>;
}

// Define tool information for rendering
const TOOL_INFO: ToolInfoMap = {
  chatgpt_plus: {
    name: 'ChatGPT Plus',
    icon: '🤖',
    description: 'Access to advanced AI capabilities and GPT-4',
    downloadUrl: 'https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file',
    toolUrl: 'https://chat.openai.com/'
  },
  envato_elements: {
    name: 'Envato Elements',
    icon: '🎨',
    description: 'Unlimited downloads of templates, photos, graphics, and more',
    downloadUrl: 'https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file',
    toolUrl: 'https://elements.envato.com/'
  },
  canva_pro: {
    name: 'Canva Pro',
    icon: '✏️',
    description: 'Design anything with premium templates and assets',
    downloadUrl: 'https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file',
    toolUrl: 'https://www.canva.com/'
  },
  storyblocks: {
    name: 'Storyblocks',
    icon: '🎬',
    description: 'Access to royalty-free video, audio, and images',
    downloadUrl: 'https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file',
    toolUrl: 'https://www.storyblocks.com/'
  },
  semrush: {
    name: 'SEMrush',
    icon: '📈',
    description: 'Advanced SEO and competitive analysis tools',
    downloadUrl: 'https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file',
    toolUrl: 'https://www.semrush.com/'
  },
  stealth_writer: {
    name: 'Stealth Writer',
    icon: '✍️',
    description: 'Advanced AI content creation tool with plagiarism avoidance',
    downloadUrl: 'https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file',
    toolUrl: 'https://stealthwriter.ai/',
    useIdPassword: true // This tool uses ID and password instead of token
  },
  hix_bypass: {
    name: 'Hix Bypass',
    icon: '🔓',
    description: 'Advanced content protection bypass tool for researchers',
    downloadUrl: 'https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file',
    toolUrl: 'https://hixbypass.com/'
  },
  // Default for any tool not specifically defined
  default: {
    name: 'Premium Tool',
    icon: '⚡',
    description: 'Access to premium features and capabilities',
    downloadUrl: 'https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file',
    toolUrl: '#'
  }
};

// Mapping of tool IDs to possible Firebase token IDs
const TOOL_ID_MAPPING: Record<string, string[]> = {
  'chatgpt_plus': ['chatgpt_plus', 'chatgpt', 'tool_1', '1'],
  'envato_elements': ['envato_elements', 'envato', 'tool_2', '2'],
  'canva_pro': ['canva_pro', 'canva', 'tool_3', '3'],
  'storyblocks': ['storyblocks', 'tool_4', '4'],
  'semrush': ['semrush', 'tool_5', '5'],
  'stealth_writer': ['stealth_writer', 'tool_19', '19'],
  'hix_bypass': ['hix_bypass', 'tool_20', '20'],
  // Add more mappings as needed
};

interface RouteParams {
  toolId: string;
  [key: string]: string;
}

const ToolAccess: React.FC = () => {
  const { toolId } = useParams<RouteParams>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [access, setAccess] = useState<Access | null>(null);
  const [toolInfo, setToolInfo] = useState<ToolInfoItem | null>(null);
  const [tokenCopied, setTokenCopied] = useState<boolean | string>(false);
  const [idCopied, setIdCopied] = useState<boolean>(false);
  const [passwordCopied, setPasswordCopied] = useState<boolean>(false);
  const [toolToken, setToolToken] = useState<string | string[] | null>(null);
  const [toolLoginId, setToolLoginId] = useState<string | null>(null);
  const [toolPassword, setToolPassword] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);

  // Fetch the tool token - defined outside useEffect to be accessible elsewhere
  const fetchToolToken = async (): Promise<void> => {
    if (!toolId) return;
    
    setIsLoading(true);
    try {
      console.log(`DEBUG - Attempting to fetch token for ${toolId}`);
      
      // Special handling for Stealth Writer which uses ID/Password
      if (toolId === 'stealth_writer' || toolId === 'tool_19') {
        // First try the direct path in toolTokens
        const tokenRef = ref(db, `toolTokens/${toolId}`);
        const snapshot = await get(tokenRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log(`Found data for ${toolId}:`, data);
          
          // Handle different data structures
          if (typeof data === 'object' && data !== null) {
            // Direct object with id/password fields
            if (data.id || data.password) {
              setToolLoginId(data.id || null);
              setToolPassword(data.password || null);
              setIsLoading(false);
              return;
            }
            
            // Check for nested fields like tool_19.id
            if (data.tool_19 && typeof data.tool_19 === 'object') {
              setToolLoginId(data.tool_19.id || null);
              setToolPassword(data.tool_19.password || null);
              setIsLoading(false);
              return;
            }
            
            // If it's an object but doesn't have expected fields, stringify it
            const tokenString = JSON.stringify(data);
            setToolToken(tokenString);
            setIsLoading(false);
            return;
          } else if (typeof data === 'string') {
            // If it's a string, try to parse it as JSON
            try {
              const parsed = JSON.parse(data);
              if (parsed && typeof parsed === 'object') {
                setToolLoginId(parsed.id || null);
                setToolPassword(parsed.password || null);
              } else {
                setToolToken(data);
              }
            } catch (e) {
              // If parsing fails, use the string as a token
              setToolToken(data);
            }
            setIsLoading(false);
            return;
          }
        }
        
        // Try alternative paths
        // Try looking directly in the root for tool_19
        if (toolId === 'stealth_writer') {
          const altRef = ref(db, 'tool_19');
          const altSnapshot = await get(altRef);
          
          if (altSnapshot.exists()) {
            const altData = altSnapshot.val();
            console.log('Found data in alternate path tool_19:', altData);
            
            if (typeof altData === 'object' && altData !== null) {
              setToolLoginId(altData.id || null);
              setToolPassword(altData.password || null);
              setIsLoading(false);
              return;
            }
          }
        }
        
        // Try looking in toolCredentials
        const credRef = ref(db, `toolCredentials/${toolId}`);
        const credSnapshot = await get(credRef);
        
        if (credSnapshot.exists()) {
          const credData = credSnapshot.val();
          console.log(`Found credentials for ${toolId}:`, credData);
          
          if (typeof credData === 'object' && credData !== null) {
            setToolLoginId(credData.id || null);
            setToolPassword(credData.password || null);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Special handling for ChatGPT Plus which uses multiple tokens
      if (toolId === 'chatgpt_plus' || toolId === 'tool_1') {
        const tokenRef = ref(db, `toolTokens/tool_1`);
        const snapshot = await get(tokenRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log(`Found data for ${toolId}:`, data);
          
          // If it's already an array, use it directly
          if (Array.isArray(data)) {
            setToolToken(data);
            setIsLoading(false);
            return;
          }
          // If it's a string, convert it to a single-item array
          else if (typeof data === 'string') {
            setToolToken([data]);
            setIsLoading(false);
            return;
          }
          // If it's an object with a value property
          else if (typeof data === 'object' && data !== null) {
            if (data.value) {
              if (Array.isArray(data.value)) {
                setToolToken(data.value);
              } else {
                setToolToken([data.value]);
              }
              setIsLoading(false);
              return;
            }
          }
        }
      }
      
      // Get all possible IDs for this tool
      const possibleIds = TOOL_ID_MAPPING[toolId] || [toolId];
      
      // Add standard variations if not in the mapping
      if (!TOOL_ID_MAPPING[toolId]) {
        // If toolId has a 'tool_' prefix, also try without it
        if (toolId.startsWith('tool_')) {
          possibleIds.push(toolId.substring(5));
        }
        // Also try with a 'tool_' prefix if it doesn't have one
        else {
          possibleIds.push(`tool_${toolId}`);
        }
        
        // Try numeric ID if there are digits
        const numericId = toolId.replace(/\D/g, '');
        if (numericId) {
          possibleIds.push(numericId);
        }
      }
      
      console.log(`Possible IDs for ${toolId}:`, possibleIds);
      
      // Generate all possible paths to check
      const paths: string[] = [];
      for (const id of possibleIds) {
        paths.push(`toolTokens/${id}`);
        paths.push(`toolTokens/${id}/value`);
        paths.push(`sessionTokens/${id}`);
        paths.push(`tokens/${id}`);
        paths.push(`tool_tokens/${id}`);
      }
      
      console.log("Trying the following paths:", paths);
      
      // Try all paths in sequence
      for (const path of paths) {
        console.log(`Trying path: ${path}`);
        const tokenRef = ref(db, path);
        const snapshot = await get(tokenRef);
        
        if (snapshot.exists()) {
          console.log(`Found data at path ${path}:`, snapshot.val());
          
          // Determine how to extract the token based on data structure
          if (typeof snapshot.val() === 'string') {
            console.log('Token is direct string value:', snapshot.val());
            setToolToken(snapshot.val());
            setIsLoading(false);
            return;
          } else if (typeof snapshot.val() === 'object' && snapshot.val() !== null) {
            if (snapshot.val().value) {
              console.log('Token found in value property:', snapshot.val().value);
              setToolToken(snapshot.val().value);
              setIsLoading(false);
              return;
            } 
            // If it's an object but doesn't have a value property, try to stringify it
            else {
              const tokenString = JSON.stringify(snapshot.val());
              console.log('Converting object token to string:', tokenString);
              setToolToken(tokenString);
              setIsLoading(false);
              return;
            }
          }
        }
      }
      
      // Direct database listing as a last resort
      console.log("No token found in standard paths. Listing all paths in toolTokens:");
      const allTokensRef = ref(db, 'toolTokens');
      const allTokensSnapshot = await get(allTokensRef);
      if (allTokensSnapshot.exists()) {
        console.log("Available tool tokens:", Object.keys(allTokensSnapshot.val()));
      }
      
      console.log('No token found in any location for tool:', toolId);
      setToolToken(null);
    } catch (error) {
      console.error('Error fetching tool token:', error);
      setToolToken(null);
      setToolLoginId(null);
      setToolPassword(null);
    }
    setIsLoading(false);
  };

  // Check for payment success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const txnId = urlParams.get('txnId');
    const merchantTransactionId = urlParams.get('merchantTransactionId');
    const transactionId = urlParams.get('transactionId');
    
    // Try different parameter names that PhonePe might use
    const paymentId = txnId || merchantTransactionId || transactionId;
    
    console.log('🔍 Checking URL parameters:', {
      txnId,
      merchantTransactionId,
      transactionId,
      paymentId,
      fullURL: location.href,
      search: location.search
    });
    
    if (paymentId && user) {
      console.log('✅ Found payment ID, starting verification:', paymentId);
      handlePaymentVerification(paymentId);
    } else if (location.search && user) {
      console.log('⚠️ URL has parameters but no payment ID found');
      setError('Payment verification failed: No transaction ID found in URL. Please contact support if you completed a payment.');
    }
  }, [location.search, user]);

  // Handle payment verification
  const handlePaymentVerification = async (merchantTransactionId: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 Verifying payment:', merchantTransactionId);
      
      const result = await verifyAndCompletePayment(merchantTransactionId);
      
      if (result.success) {
        setHasAccess(true);
        setAccess(result.access);
        setError('');
        
        // Show success message
        alert('🎉 Payment successful! You now have access to this tool.');
        
        // Clean URL
        navigate(location.pathname, { replace: true });
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      setError('Failed to verify payment. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check tool access on component mount
  useEffect(() => {
    if (user && toolId) {
      checkUserAccess();
      setupSubscriptionListener();
    }
  }, [user, toolId]);

  const checkUserAccess = async () => {
    try {
      setIsLoading(true);
      
      // Check specific tool access
      const accessResult = await checkToolAccess(user!.uid, toolId!);
      setHasAccess(accessResult.hasAccess);
      setAccess(accessResult.access);
      
      // Get all user subscriptions
      const subscriptions = await getUserSubscriptions(user!.uid);
      setUserSubscriptions(subscriptions);
      
    } catch (error) {
      console.error('❌ Error checking tool access:', error);
      setError('Failed to check access. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time subscription listener
  const setupSubscriptionListener = () => {
    if (!user) return;

    const unsubscribe = subscribeToUserSubscriptions(user.uid, (subscriptions) => {
      setUserSubscriptions(subscriptions);
      
      // Check if current tool is in active subscriptions
      const currentToolSubscription = subscriptions.find(sub => sub.toolId === toolId);
      if (currentToolSubscription) {
        setHasAccess(true);
        setAccess(currentToolSubscription);
      }
    });

    return unsubscribe;
  };

  const handlePurchase = async () => {
    if (!user || !toolId) {
      setError('Please login to purchase');
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');

      const toolName = getToolName(toolId);
      const amount = getToolPrice(toolId);

      console.log('🚀 Starting payment flow for:', toolName);

      const result = await completePaymentFlow(user.uid, toolId, toolName, amount);

      if (result.success) {
        console.log('💳 Redirecting to payment:', result.paymentUrl);
        
        // Redirect to PhonePe payment page
        window.location.href = result.paymentUrl;
      } else {
        setError('Failed to initialize payment. Please try again.');
      }

    } catch (error) {
      console.error('❌ Error in purchase flow:', error);
      setError('Failed to start payment process. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // ... existing code for getToolName, getToolPrice, getToolDescription functions ...

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-300 mb-6">Please login to access this tool</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (hasAccess && access) {
    const toolName = getToolName(toolId!);
    const downloadUrl = "https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file";

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Access Granted! 🎉</h1>
              <p className="text-xl text-gray-300">You have active access to {toolName}</p>
            </div>

            {/* Subscription Details */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Tool</p>
                  <p className="text-white font-medium">{access.toolName}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <p className="text-green-400 font-medium">Active</p>
                </div>
                <div>
                  <p className="text-gray-400">Subscribed On</p>
                  <p className="text-white font-medium">
                    {new Date(access.subscribedAt.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Expires On</p>
                  <p className="text-white font-medium">
                    {new Date(access.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Section */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Download Extension</h3>
              <p className="text-gray-300 mb-6">
                Download the RankBlaze extension to access {toolName} and other premium tools.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Extension
                </a>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>

            {/* All Active Subscriptions */}
            {userSubscriptions.length > 1 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">All Active Subscriptions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userSubscriptions.map((sub) => (
                    <div key={sub.id} className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white">{sub.toolName}</h4>
                      <p className="text-sm text-gray-400">
                        Expires: {new Date(sub.expiresAt).toLocaleDateString()}
                      </p>
                      <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded mt-2">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No access - show purchase option
  const toolName = getToolName(toolId!);
  const toolPrice = getToolPrice(toolId!);
  const toolDescription = getToolDescription(toolId!);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{toolName}</h1>
            <p className="text-xl text-gray-300">{toolDescription}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">⚠️ {error}</p>
                  {error.includes('No transaction ID') && (
                    <p className="text-sm mt-2 opacity-90">
                      If you just completed a payment, please wait a moment and try refreshing the page. 
                      The payment system may take a few seconds to process.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setError('');
                    checkUserAccess();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ml-4"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Purchase Card */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a2 2 0 00-2-2H8a2 2 0 00-2 2v2m8 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Required</h2>
              <p className="text-gray-300">You need to purchase access to use this tool</p>
            </div>

            <div className="mb-8">
              <div className="text-4xl font-bold text-white mb-2">₹{toolPrice}</div>
              <p className="text-gray-400">One-time payment • 30 days access</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handlePurchase}
                disabled={paymentLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {paymentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Purchase Access
                  </>
                )}
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-400">
              <p>💳 Secure payment via PhonePe</p>
              <p>📞 24/7 support available</p>
              <p>🔄 Instant activation after payment</p>
            </div>

            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg text-left">
                <h4 className="text-white font-medium mb-2">Debug Info:</h4>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {JSON.stringify({
                    userId: user?.uid,
                    toolId,
                    hasAccess,
                    error,
                    urlParams: location.search,
                    userSubscriptions: userSubscriptions.length
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getToolName = (toolId: string): string => {
  const toolNames: { [key: string]: string } = {
    'chatgpt-plus': 'ChatGPT Plus',
    'envato-elements': 'Envato Elements',
    'canva-pro': 'Canva Pro',
    'storyblocks': 'Storyblocks',
    'semrush': 'SEMrush',
    'stealth-writer': 'Stealth Writer',
    'hix-bypass': 'Hix Bypass'
  };
  return toolNames[toolId] || 'Premium Tool';
};

const getToolPrice = (toolId: string): number => {
  const toolPrices: { [key: string]: number } = {
    'chatgpt-plus': 199,
    'envato-elements': 299,
    'canva-pro': 249,
    'storyblocks': 399,
    'semrush': 499,
    'stealth-writer': 199,
    'hix-bypass': 149
  };
  return toolPrices[toolId] || 199;
};

const getToolDescription = (toolId: string): string => {
  const descriptions: { [key: string]: string } = {
    'chatgpt-plus': 'Access to ChatGPT Plus with GPT-4 and advanced features',
    'envato-elements': 'Unlimited downloads from Envato Elements library',
    'canva-pro': 'Professional design tools and premium templates',
    'storyblocks': 'Unlimited stock videos, audio, and images',
    'semrush': 'Complete SEO and digital marketing toolkit',
    'stealth-writer': 'AI content writer that bypasses detection',
    'hix-bypass': 'Bypass AI detection for your content'
  };
  return descriptions[toolId] || 'Premium tool access';
};

export default ToolAccess;
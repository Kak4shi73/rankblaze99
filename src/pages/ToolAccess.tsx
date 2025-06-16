import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Download, Copy, ArrowLeft, ExternalLink, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import { ref, get, onValue, set } from 'firebase/database';

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
  toolId: string;
  toolName: string;
  isActive: boolean;
  startDate?: number;
  endDate?: number;
  subscribedAt?: { seconds: number } | number;
  expiresAt?: Date | number;
  paymentMethod?: string;
  status?: string;
  tools?: Array<{ id: string; name: string; }>;
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
          } else {
            // Simple string value
            setToolToken(data.toString());
          }
          setIsLoading(false);
          return;
        }
        
        // If not found in toolTokens, try tool_19 path
        const tool19Ref = ref(db, 'toolTokens/tool_19');
        const tool19Snapshot = await get(tool19Ref);
        
        if (tool19Snapshot.exists()) {
          const data = tool19Snapshot.val();
          console.log('Found tool_19 data:', data);
          
          if (typeof data === 'object' && data !== null) {
            setToolLoginId(data.id || null);
            setToolPassword(data.password || null);
          } else {
            setToolToken(data.toString());
          }
          setIsLoading(false);
          return;
        }
      }
      
      // For other tools, use the normal token fetching logic
      // Try each possible mapping for this tool
      const possibleIds = TOOL_ID_MAPPING[toolId!] || [toolId!];
      
      for (const possibleId of possibleIds) {
        console.log(`Trying to fetch token with ID: ${possibleId}`);
        
        const tokenRef = ref(db, `toolTokens/${possibleId}`);
        const snapshot = await get(tokenRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log(`Found data for ${possibleId}:`, data);
          setToolToken(data);
          setIsLoading(false);
          return;
        }
      }
      
      // If no token found, set loading to false
      console.log(`No token found for any of the IDs: ${possibleIds.join(', ')}`);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching tool token:', error);
      setIsLoading(false);
    }
  };

  // Handle payment verification from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const merchantTransactionId = urlParams.get('merchantTransactionId');
    const status = urlParams.get('status');

    if (merchantTransactionId && status) {
      handlePaymentVerification(merchantTransactionId);
    }
  }, [location]);

  // Handle payment verification
  const handlePaymentVerification = async (merchantTransactionId: string) => {
    try {
      setPaymentLoading(true);
      setError('');

      console.log('🔍 Verifying payment:', merchantTransactionId);

      // Call the verification API
      const API_BASE_URL = 'https://us-central1-rankblaze-138f7.cloudfunctions.net';
      const response = await fetch(`${API_BASE_URL}/verifyPhonePePayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantTransactionId
        })
      });

      const result = await response.json();

      if (result.success && result.status === 'completed') {
        console.log('✅ Payment verified successfully');
        showToast('Payment successful! You now have access to the tool.', 'success');
        
        // Refresh access status
        await checkUserAccess();
        await fetchToolToken();
      } else {
        setError('Payment verification failed. Please try again or contact support.');
        showToast('Payment verification failed', 'error');
      }

    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      setError('Failed to verify payment. Please try again.');
      showToast('Payment verification error', 'error');
    } finally {
      setPaymentLoading(false);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Check user access and fetch data
  useEffect(() => {
    if (user && toolId) {
      checkUserAccess();
      fetchToolToken();
    }
  }, [user, toolId]);

  const checkUserAccess = async () => {
    try {
      setIsLoading(true);
      console.log(`🔍 Checking access for user ${user!.uid} and tool ${toolId}`);
      
      // Check subscriptions in Realtime Database
      const subscriptionsRef = ref(db, `subscriptions/${user!.uid}`);
      const subscriptionsSnapshot = await get(subscriptionsRef);
      
      if (subscriptionsSnapshot.exists()) {
        const subscriptionsData = subscriptionsSnapshot.val();
        console.log('Found subscriptions in Realtime DB:', subscriptionsData);
        
        // Check if current tool is in subscriptions
        const toolSubscription = subscriptionsData[toolId!];
        
        if (toolSubscription && toolSubscription.isActive) {
          console.log('✅ Active subscription found in Realtime DB for tool:', toolId);
          
          // Convert Realtime DB format to expected format
          const accessData: Access = {
            id: `${user!.uid}_${toolId}`,
            userId: user!.uid,
            toolId: toolId!,
            toolName: toolSubscription.toolName || getToolName(toolId!),
            isActive: true,
            startDate: toolSubscription.startDate,
            endDate: toolSubscription.endDate,
            subscribedAt: toolSubscription.startDate ? { seconds: Math.floor(toolSubscription.startDate / 1000) } : { seconds: Math.floor(Date.now() / 1000) },
            expiresAt: new Date(toolSubscription.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentMethod: toolSubscription.paymentMethod || 'admin_activation'
          };
          
          setHasAccess(true);
          setAccess(accessData);
          setIsLoading(false);
          return;
        }
      }
      
      // Check tools in Realtime Database (alternative location)
      const toolsRef = ref(db, `users/${user!.uid}/tools/${toolId}`);
      const toolsSnapshot = await get(toolsRef);
      
      if (toolsSnapshot.exists()) {
        const toolData = toolsSnapshot.val();
        console.log('Found tool access in users/tools:', toolData);
        
        if (toolData.isActive || toolData.status === 'active') {
          console.log('✅ Active tool found in Realtime DB users/tools');
          
          const accessData: Access = {
            id: `${user!.uid}_${toolId}`,
            userId: user!.uid,
            toolId: toolId!,
            toolName: toolData.toolName || getToolName(toolId!),
            isActive: true,
            startDate: toolData.startDate || Date.now(),
            endDate: toolData.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000,
            subscribedAt: { seconds: Math.floor((toolData.startDate || Date.now()) / 1000) },
            expiresAt: new Date(toolData.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            paymentMethod: 'admin_activation'
          };
          
          setHasAccess(true);
          setAccess(accessData);
          setIsLoading(false);
          return;
        }
      }
      
      // No access found
      console.log('❌ No access found in database');
      setHasAccess(false);
      setAccess(null);
      
    } catch (error) {
      console.error('❌ Error checking tool access:', error);
      setError('Failed to check access. Please try again.');
      setHasAccess(false);
      setAccess(null);
    } finally {
      setIsLoading(false);
    }
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

      // Call PhonePe payment initialization
      const API_BASE_URL = 'https://us-central1-rankblaze-138f7.cloudfunctions.net';
      const response = await fetch(`${API_BASE_URL}/initializePhonePePayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          toolId: toolId,
          toolName: toolName,
          amount: amount
        })
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
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
                    {access.subscribedAt && typeof access.subscribedAt === 'object' && access.subscribedAt.seconds 
                      ? new Date(access.subscribedAt.seconds * 1000).toLocaleDateString()
                      : new Date(access.startDate || Date.now()).toLocaleDateString()
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Expires On</p>
                  <p className="text-white font-medium">
                    {access.expiresAt 
                      ? new Date(access.expiresAt).toLocaleDateString()
                      : new Date(access.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
                    }
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
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getToolName = (toolId: string): string => {
  const toolNames: { [key: string]: string } = {
    // Handle different formats
    'chatgpt-plus': 'ChatGPT Plus',
    'chatgpt_plus': 'ChatGPT Plus',
    'chatgpt': 'ChatGPT Plus',
    'tool_1': 'ChatGPT Plus',
    '1': 'ChatGPT Plus',
    
    'envato-elements': 'Envato Elements',
    'envato_elements': 'Envato Elements', 
    'envato': 'Envato Elements',
    'tool_2': 'Envato Elements',
    '2': 'Envato Elements',
    
    'canva-pro': 'Canva Pro',
    'canva_pro': 'Canva Pro',
    'canva': 'Canva Pro',
    'tool_3': 'Canva Pro',
    '3': 'Canva Pro',
    
    'storyblocks': 'Storyblocks',
    'tool_4': 'Storyblocks', 
    '4': 'Storyblocks',
    
    'semrush': 'SEMrush',
    'tool_5': 'SEMrush',
    '5': 'SEMrush',
    
    'stealth-writer': 'Stealth Writer',
    'stealth_writer': 'Stealth Writer',
    'tool_19': 'Stealth Writer',
    '19': 'Stealth Writer',
    
    'hix-bypass': 'Hix Bypass',
    'hix_bypass': 'Hix Bypass',
    'tool_20': 'Hix Bypass',
    '20': 'Hix Bypass'
  };
  return toolNames[toolId] || 'Premium Tool';
};

const getToolPrice = (toolId: string): number => {
  // Normalize tool ID to check multiple formats
  const normalizedId = toolId.toLowerCase();
  
  if (normalizedId.includes('chatgpt') || normalizedId.includes('tool_1') || normalizedId === '1') {
    return 199;
  } else if (normalizedId.includes('envato') || normalizedId.includes('tool_2') || normalizedId === '2') {
    return 299;
  } else if (normalizedId.includes('canva') || normalizedId.includes('tool_3') || normalizedId === '3') {
    return 249;
  } else if (normalizedId.includes('story') || normalizedId.includes('tool_4') || normalizedId === '4') {
    return 399;
  } else if (normalizedId.includes('semrush') || normalizedId.includes('tool_5') || normalizedId === '5') {
    return 499;
  } else if (normalizedId.includes('stealth') || normalizedId.includes('tool_19') || normalizedId === '19') {
    return 199;
  } else if (normalizedId.includes('hix') || normalizedId.includes('bypass') || normalizedId.includes('tool_20') || normalizedId === '20') {
    return 149;
  }
  return 199; // Default price
};

const getToolDescription = (toolId: string): string => {
  // Normalize tool ID to check multiple formats
  const normalizedId = toolId.toLowerCase();
  
  if (normalizedId.includes('chatgpt') || normalizedId.includes('tool_1') || normalizedId === '1') {
    return 'Access to ChatGPT Plus with GPT-4 and advanced features';
  } else if (normalizedId.includes('envato') || normalizedId.includes('tool_2') || normalizedId === '2') {
    return 'Unlimited downloads from Envato Elements library';
  } else if (normalizedId.includes('canva') || normalizedId.includes('tool_3') || normalizedId === '3') {
    return 'Professional design tools and premium templates';
  } else if (normalizedId.includes('story') || normalizedId.includes('tool_4') || normalizedId === '4') {
    return 'Unlimited stock videos, audio, and images';
  } else if (normalizedId.includes('semrush') || normalizedId.includes('tool_5') || normalizedId === '5') {
    return 'Complete SEO and digital marketing toolkit';
  } else if (normalizedId.includes('stealth') || normalizedId.includes('tool_19') || normalizedId === '19') {
    return 'AI content writer that bypasses detection';
  } else if (normalizedId.includes('hix') || normalizedId.includes('bypass') || normalizedId.includes('tool_20') || normalizedId === '20') {
    return 'Bypass AI detection for your content';
  }
  return 'Premium tool access'; // Default description
};

export default ToolAccess;
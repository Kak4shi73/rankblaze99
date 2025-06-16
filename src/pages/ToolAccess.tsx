import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Copy, Download, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import { ref, get } from 'firebase/database';

interface ToolCredentials {
  id?: string;
  password?: string;
}

interface UserAccess {
  toolId: string;
  toolName: string;
  isActive: boolean;
  startDate?: number;
  endDate?: number;
  paymentMethod?: string;
}

const ToolAccess: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [tokens, setTokens] = useState<string[]>([]);
  const [singleToken, setSingleToken] = useState<string>('');
  const [credentials, setCredentials] = useState<ToolCredentials>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Tool configuration
  const toolConfig = {
    'chatgpt_plus': {
      name: 'ChatGPT Plus',
      icon: '🤖',
      description: 'Access to ChatGPT Plus with GPT-4 and advanced features',
      price: 199,
      tokenPaths: ['tool_1', 'chatgpt_plus', 'chatgpt'],
      useCredentials: false,
      url: 'https://chat.openai.com/'
    },
    'envato_elements': {
      name: 'Envato Elements',
      icon: '🎨',
      description: 'Unlimited downloads from Envato Elements library',
      price: 299,
      tokenPaths: ['tool_2', 'envato_elements', 'envato'],
      useCredentials: false,
      url: 'https://elements.envato.com/'
    },
    'canva_pro': {
      name: 'Canva Pro',
      icon: '✏️',
      description: 'Professional design tools and premium templates',
      price: 249,
      tokenPaths: ['tool_3', 'canva_pro', 'canva'],
      useCredentials: false,
      url: 'https://www.canva.com/'
    },
    'storyblocks': {
      name: 'Storyblocks',
      icon: '🎬',
      description: 'Unlimited stock videos, audio, and images',
      price: 399,
      tokenPaths: ['tool_4', 'storyblocks'],
      useCredentials: false,
      url: 'https://www.storyblocks.com/'
    },
    'semrush': {
      name: 'SEMrush',
      icon: '📈',
      description: 'Complete SEO and digital marketing toolkit',
      price: 499,
      tokenPaths: ['tool_5', 'semrush'],
      useCredentials: false,
      url: 'https://www.semrush.com/'
    },
    'stealth_writer': {
      name: 'Stealth Writer',
      icon: '✍️',
      description: 'AI content writer that bypasses detection',
      price: 199,
      tokenPaths: ['tool_19', 'stealth_writer'],
      useCredentials: true,
      url: 'https://stealthwriter.ai/'
    },
    'hix_bypass': {
      name: 'Hix Bypass',
      icon: '🔓',
      description: 'Bypass AI detection for your content',
      price: 149,
      tokenPaths: ['tool_20', 'hix_bypass'],
      useCredentials: false,
      url: 'https://hixbypass.com/'
    }
  };

  const currentTool = toolConfig[toolId as keyof typeof toolConfig] || {
    name: 'Premium Tool',
    icon: '⚡',
    description: 'Premium tool access',
    price: 199,
    tokenPaths: [toolId || ''],
    useCredentials: false,
    url: '#'
  };

  // Check user access in Realtime Database
  const checkUserAccess = async () => {
    if (!user || !toolId) return;

    try {
      setLoading(true);
      console.log(`🔍 Checking access for user: ${user.uid}, tool: ${toolId}`);

      // Check new subscription structure
      const subscriptionsRef = ref(db, 'subscriptions');
      const subscriptionsSnapshot = await get(subscriptionsRef);

      if (subscriptionsSnapshot.exists()) {
        const allSubscriptions = subscriptionsSnapshot.val();
        
        // Find user's active subscription
        const userSubscription = Object.values(allSubscriptions).find((sub: any) => 
          sub.userId === user.uid && sub.status === 'active'
        ) as any;

        if (userSubscription?.tools) {
          const toolAccess = userSubscription.tools.find((tool: any) => {
            if (typeof tool === 'object') {
              return tool.id === toolId && tool.status === 'active';
            }
            return tool === toolId;
          });

          if (toolAccess) {
            console.log('✅ Access found in new structure');
            setHasAccess(true);
            setUserAccess({
              toolId,
              toolName: currentTool.name,
              isActive: true,
              startDate: new Date(userSubscription.startDate).getTime(),
              endDate: new Date(userSubscription.endDate).getTime(),
              paymentMethod: userSubscription.paymentMethod || 'admin_activation'
            });
            await fetchToolTokens();
            return;
          }
        }
      }

      // Check old subscription structure
      const oldSubRef = ref(db, `subscriptions/${user.uid}/${toolId}`);
      const oldSubSnapshot = await get(oldSubRef);

      if (oldSubSnapshot.exists()) {
        const subData = oldSubSnapshot.val();
        if (subData.isActive) {
          console.log('✅ Access found in old structure');
          setHasAccess(true);
          setUserAccess({
            toolId,
            toolName: subData.toolName || currentTool.name,
            isActive: true,
            startDate: subData.startDate,
            endDate: subData.endDate,
            paymentMethod: subData.paymentMethod || 'admin_activation'
          });
          await fetchToolTokens();
          return;
        }
      }

      // Check alternative location
      const toolsRef = ref(db, `users/${user.uid}/tools/${toolId}`);
      const toolsSnapshot = await get(toolsRef);

      if (toolsSnapshot.exists()) {
        const toolData = toolsSnapshot.val();
        if (toolData.isActive || toolData.status === 'active') {
          console.log('✅ Access found in users/tools');
          setHasAccess(true);
          setUserAccess({
            toolId,
            toolName: toolData.toolName || currentTool.name,
            isActive: true,
            startDate: toolData.startDate || Date.now(),
            endDate: toolData.endDate || Date.now() + (30 * 24 * 60 * 60 * 1000),
            paymentMethod: 'admin_activation'
          });
          await fetchToolTokens();
          return;
        }
      }

      console.log('❌ No access found');
      setHasAccess(false);
      setUserAccess(null);
      
    } catch (error) {
      console.error('❌ Error checking access:', error);
      setError('Failed to check access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tool tokens/credentials from Realtime Database
  const fetchToolTokens = async () => {
    if (!toolId) return;

    try {
      console.log(`🔑 Fetching tokens for ${toolId}`);
      const tokenPaths = currentTool.tokenPaths;

      for (const path of tokenPaths) {
        const tokenRef = ref(db, `toolTokens/${path}`);
        const snapshot = await get(tokenRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log(`Found data for ${path}:`, data);

          if (currentTool.useCredentials) {
            // Handle credentials (ID/Password)
            if (typeof data === 'object' && data !== null) {
              setCredentials({
                id: data.id || '',
                password: data.password || ''
              });
            }
          } else {
            // Handle tokens
            if (Array.isArray(data)) {
              setTokens(data.filter(token => token && token.trim()));
            } else if (typeof data === 'object' && data.value) {
              setSingleToken(data.value);
            } else if (typeof data === 'string') {
              setSingleToken(data);
            }
          }
          return;
        }
      }

      console.log(`No tokens found for ${toolId}`);
      
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'token' && typeof index === 'number') {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setCopiedField(type);
        setTimeout(() => setCopiedField(''), 2000);
      }
      showToast('Copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!user || !toolId) return;

    try {
      setLoading(true);
      console.log('🚀 Starting payment flow...');

      const response = await fetch('https://us-central1-rankblaze-138f7.cloudfunctions.net/initializePhonePePayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          toolId: toolId,
          toolName: currentTool.name,
          amount: currentTool.price
        })
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setError('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to start payment process.');
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (user && toolId) {
      checkUserAccess();
    }
  }, [user, toolId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl">Checking access...</p>
        </div>
      </div>
    );
  }

  // Login required
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-300 mb-6">Please login to access this tool</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  // Access granted - show tokens/credentials
  if (hasAccess && userAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="text-6xl mb-4">{currentTool.icon}</div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Access Granted! 🎉
            </h1>
            <p className="text-xl text-gray-300">
              You have active access to {currentTool.name}
            </p>
          </div>

          {/* Subscription Info */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Subscription Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Tool</p>
                <p className="text-white font-medium">{userAccess.toolName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-green-400 font-medium">Active</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Expires On</p>
                <p className="text-white font-medium">
                  {userAccess.endDate 
                    ? new Date(userAccess.endDate).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Extension Download */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              📥 Download Extension
            </h3>
            <p className="text-gray-300 mb-6">
              Download the RankBlaze extension to access {currentTool.name} and other premium tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://www.mediafire.com/file/4glcx3b2zjc325j/Rank+Blaze+extension+v1.002.zip/file"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Extension v1.002
              </a>
              <a
                href={currentTool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Open {currentTool.name}
              </a>
            </div>
          </div>

          {/* Tokens/Credentials Section */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              🔑 {currentTool.useCredentials ? 'Login Credentials' : 'Access Tokens'}
            </h3>

            {currentTool.useCredentials ? (
              // Show credentials for tools like Stealth Writer
              <div className="space-y-4">
                {credentials.id && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Login ID</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={credentials.id}
                        readOnly
                        className="bg-gray-700 text-white px-4 py-3 rounded-lg font-mono text-sm flex-1 border border-gray-600"
                      />
                      <button
                        onClick={() => copyToClipboard(credentials.id!, 'id')}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
                      >
                        {copiedField === 'id' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {credentials.password && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Password</label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={credentials.password}
                          readOnly
                          className="bg-gray-700 text-white px-4 py-3 rounded-lg font-mono text-sm w-full border border-gray-600"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <button
                        onClick={() => copyToClipboard(credentials.password!, 'password')}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
                      >
                        {copiedField === 'password' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {!credentials.id && !credentials.password && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No credentials available</p>
                    <p className="text-gray-500 text-sm mt-2">Contact admin if you need access</p>
                  </div>
                )}
              </div>
            ) : (
              // Show tokens for regular tools
              <div className="space-y-4">
                {/* Multiple tokens */}
                {tokens.length > 0 && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Available Tokens ({tokens.length})
                    </label>
                    <div className="space-y-2">
                      {tokens.map((token, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-gray-400 text-sm w-8">#{index + 1}</span>
                          <input
                            type="text"
                            value={token}
                            readOnly
                            className="bg-gray-700 text-white px-4 py-3 rounded-lg font-mono text-sm flex-1 border border-gray-600"
                          />
                          <button
                            onClick={() => copyToClipboard(token, 'token', index)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
                          >
                            {copiedIndex === index ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single token */}
                {!tokens.length && singleToken && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Access Token</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={singleToken}
                        readOnly
                        className="bg-gray-700 text-white px-4 py-3 rounded-lg font-mono text-sm flex-1 border border-gray-600"
                      />
                      <button
                        onClick={() => copyToClipboard(singleToken, 'single')}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
                      >
                        {copiedField === 'single' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* No tokens found */}
                {!tokens.length && !singleToken && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No tokens available</p>
                    <p className="text-gray-500 text-sm mt-2">Contact admin if you need access tokens</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No access - show purchase option
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="text-6xl mb-4">{currentTool.icon}</div>
          <h1 className="text-3xl font-bold text-white mb-2">{currentTool.name}</h1>
          <p className="text-gray-300">{currentTool.description}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Purchase Card */}
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">🔒</div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Required</h2>
            <p className="text-gray-300">Purchase access to use this premium tool</p>
          </div>

          <div className="mb-8">
            <div className="text-4xl font-bold text-white mb-2">₹{currentTool.price}</div>
            <p className="text-gray-400">One-time payment • 30 days access</p>
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-lg font-medium transition-colors w-full mb-4"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </div>
            ) : (
              <>💳 Purchase Access</>
            )}
          </button>

          <div className="text-sm text-gray-400 space-y-1">
            <p>💳 Secure payment via PhonePe</p>
            <p>📞 24/7 support available</p>
            <p>🔄 Instant activation after payment</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolAccess;
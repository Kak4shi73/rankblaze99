import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Download, Copy, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { db } from '../config/firebase';
import { ref, get, onValue } from 'firebase/database';

// Define tool information for rendering
const TOOL_INFO = {
  chatgpt_plus: {
    name: 'ChatGPT Plus',
    icon: '🤖',
    description: 'Access to advanced AI capabilities and GPT-4',
    downloadUrl: 'https://drive.google.com/file/d/1cCILqT0BWMqJRwqM0OIxtESbuR0bYaj-/view?usp=drivesdk'
  },
  envato_elements: {
    name: 'Envato Elements',
    icon: '🎨',
    description: 'Unlimited downloads of templates, photos, graphics, and more',
    downloadUrl: 'https://drive.google.com/file/d/1cCILqT0BWMqJRwqM0OIxtESbuR0bYaj-/view?usp=drivesdk'
  },
  canva_pro: {
    name: 'Canva Pro',
    icon: '✏️',
    description: 'Design anything with premium templates and assets',
    downloadUrl: 'https://drive.google.com/file/d/1cCILqT0BWMqJRwqM0OIxtESbuR0bYaj-/view?usp=drivesdk'
  },
  storyblocks: {
    name: 'Storyblocks',
    icon: '🎬',
    description: 'Access to royalty-free video, audio, and images',
    downloadUrl: 'https://drive.google.com/file/d/1cCILqT0BWMqJRwqM0OIxtESbuR0bYaj-/view?usp=drivesdk'
  },
  semrush: {
    name: 'SEMrush',
    icon: '📈',
    description: 'Advanced SEO and competitive analysis tools',
    downloadUrl: 'https://drive.google.com/file/d/1cCILqT0BWMqJRwqM0OIxtESbuR0bYaj-/view?usp=drivesdk'
  },
  // Default for any tool not specifically defined
  default: {
    name: 'Premium Tool',
    icon: '⚡',
    description: 'Access to premium features and capabilities',
    downloadUrl: 'https://drive.google.com/file/d/1cCILqT0BWMqJRwqM0OIxtESbuR0bYaj-/view?usp=drivesdk'
  }
};

const ToolAccess = () => {
  const { toolId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [toolInfo, setToolInfo] = useState<any>(null);

  useEffect(() => {
    if (!user || !toolId) return;

    // Set the tool info
    setToolInfo(TOOL_INFO[toolId as keyof typeof TOOL_INFO] || TOOL_INFO.default);
    
    // Generate a unique code based on user ID and tool ID
    const uniqueCode = `${toolId}_${user.id.substring(0, 8)}_${Date.now().toString(36)}`;
    setGeneratedCode(uniqueCode);

    // Check if user has access to this tool
    const checkAccess = () => {
      const subscriptionsRef = ref(db, 'subscriptions');
      
      onValue(subscriptionsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Find user subscriptions
          const userSubscriptions = Object.entries(data)
            .map(([id, value]: [string, any]) => ({
              id,
              ...value
            }))
            .filter(sub => sub.userId === user.id && sub.status === 'active');
          
          // Check if any subscription has this tool
          const hasTool = userSubscriptions.some(sub => {
            if (!sub.tools) return false;
            
            // Check tools array - tools can be either strings or objects with id/status
            return sub.tools.some((tool: any) => {
              if (typeof tool === 'string') {
                return tool === toolId;
              } else {
                return tool.id === toolId && tool.status === 'active';
              }
            });
          });
          
          if (hasTool) {
            setHasAccess(true);
            setSubscription(userSubscriptions[0]);
          } else {
            setHasAccess(false);
          }
        } else {
          setHasAccess(false);
        }
        setIsLoading(false);
      });
    };

    checkAccess();
  }, [user, toolId, showToast]);

  const handleDownload = () => {
    if (!hasAccess) {
      showToast('Access denied', 'error');
      return;
    }
    
    const downloadUrl = toolInfo?.downloadUrl || TOOL_INFO.default.downloadUrl;
    window.open(downloadUrl, '_blank');
  };

  const copyCode = () => {
    if (generatedCode && hasAccess) {
      navigator.clipboard.writeText(generatedCode);
      showToast('Code copied to clipboard', 'success');
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
        <div className="text-center p-8">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-indigo-200 mb-6">
            You don't have an active subscription for this tool.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <a
              href="/tools"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Browse Tools
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center mb-6 text-indigo-300 hover:text-indigo-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center">
                <div className="text-4xl mr-4">{toolInfo?.icon}</div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {toolInfo?.name}
                  </h1>
                  <p className="text-indigo-200">
                    {toolInfo?.description}
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-green-900/30 text-green-400 rounded-full text-sm font-medium">
                Active
              </div>
            </div>

            <div className="space-y-6">
              {/* Extension Download Section */}
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Download Extension</h2>
                <p className="text-indigo-200 mb-4">
                  Download our browser extension to start using {toolInfo?.name}.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download Extension
                </button>
              </div>

              {/* Code Display Section */}
              {generatedCode && (
                <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Access Code</h2>
                  <p className="text-indigo-200 mb-4">
                    Use this code to activate {toolInfo?.name}.
                  </p>
                  <div className="flex items-center bg-gray-800 rounded-lg border border-gray-600 p-4">
                    <code className="text-xl font-mono text-amber-400 flex-1 overflow-x-auto">
                      {generatedCode}
                    </code>
                    <button
                      onClick={copyCode}
                      className="ml-4 p-2 text-gray-400 hover:text-white transition-colors"
                      title="Copy code"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Important Notes */}
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Important Notes</h2>
                <ul className="space-y-2 text-indigo-200">
                  <li>• Keep your access code secure and don't share it with others</li>
                  <li>• This access is tied to your account only</li>
                  <li>• Contact support if you experience any access issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolAccess;
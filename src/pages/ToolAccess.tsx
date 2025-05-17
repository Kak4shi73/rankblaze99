import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
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
    downloadUrl: 'https://drive.google.com/file/d/17wKpTgwrEXj-UzA3hoNpn5cx0ykJ3oyw/view?usp=drive_link',
    toolUrl: 'https://chat.openai.com/'
  },
  envato_elements: {
    name: 'Envato Elements',
    icon: '🎨',
    description: 'Unlimited downloads of templates, photos, graphics, and more',
    downloadUrl: 'https://drive.google.com/file/d/17wKpTgwrEXj-UzA3hoNpn5cx0ykJ3oyw/view?usp=drive_link',
    toolUrl: 'https://elements.envato.com/'
  },
  canva_pro: {
    name: 'Canva Pro',
    icon: '✏️',
    description: 'Design anything with premium templates and assets',
    downloadUrl: 'https://drive.google.com/file/d/17wKpTgwrEXj-UzA3hoNpn5cx0ykJ3oyw/view?usp=drive_link',
    toolUrl: 'https://www.canva.com/'
  },
  storyblocks: {
    name: 'Storyblocks',
    icon: '🎬',
    description: 'Access to royalty-free video, audio, and images',
    downloadUrl: 'https://drive.google.com/file/d/17wKpTgwrEXj-UzA3hoNpn5cx0ykJ3oyw/view?usp=drive_link',
    toolUrl: 'https://www.storyblocks.com/'
  },
  semrush: {
    name: 'SEMrush',
    icon: '📈',
    description: 'Advanced SEO and competitive analysis tools',
    downloadUrl: 'https://drive.google.com/file/d/17wKpTgwrEXj-UzA3hoNpn5cx0ykJ3oyw/view?usp=drive_link',
    toolUrl: 'https://www.semrush.com/'
  },
  stealth_writer: {
    name: 'Stealth Writer',
    icon: '✍️',
    description: 'Advanced AI content creation tool with plagiarism avoidance',
    downloadUrl: 'https://drive.google.com/file/d/17wKpTgwrEXj-UzA3hoNpn5cx0ykJ3oyw/view?usp=drive_link',
    toolUrl: 'https://stealthwriter.ai/',
    useIdPassword: true // This tool uses ID and password instead of token
  },
  hix_bypass: {
    name: 'Hix Bypass',
    icon: '🔓',
    description: 'Advanced content protection bypass tool for researchers',
    downloadUrl: 'https://drive.google.com/file/d/17wKpTgwrEXj-UzA3hoNpn5cx0ykJ3oyw/view?usp=drive_link',
    toolUrl: 'https://hixbypass.com/'
  },
  // Default for any tool not specifically defined
  default: {
    name: 'Premium Tool',
    icon: '⚡',
    description: 'Access to premium features and capabilities',
    downloadUrl: 'https://drive.google.com/file/d/17wKpTgwrEXj-UzA3hoNpn5cx0ykJ3oyw/view?usp=drive_link',
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [access, setAccess] = useState<Access | null>(null);
  const [toolInfo, setToolInfo] = useState<ToolInfoItem | null>(null);
  const [tokenCopied, setTokenCopied] = useState<boolean>(false);
  const [idCopied, setIdCopied] = useState<boolean>(false);
  const [passwordCopied, setPasswordCopied] = useState<boolean>(false);
  const [toolToken, setToolToken] = useState<string | null>(null);
  const [toolLoginId, setToolLoginId] = useState<string | null>(null);
  const [toolPassword, setToolPassword] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user || !toolId) return;

    // Set the tool info
    setToolInfo(TOOL_INFO[toolId as keyof typeof TOOL_INFO] || TOOL_INFO.default);

    // Check if user has access to this tool
    const checkAccess = () => {
      const accessesRef = ref(db, 'subscriptions');
      
      return onValue(accessesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Find user accesses
          const userAccesses = Object.entries(data)
            .map(([id, value]: [string, any]) => ({
              id,
              ...value
            }))
            .filter(sub => sub.userId === user.id && sub.status === 'active');
          
          // Check if any access has this tool
          const hasTool = userAccesses.some(sub => {
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
            setAccess(userAccesses[0]);
            
            // Fetch the tool token
            fetchToolToken();
            
            // Also set up a real-time listener for token updates
            const tokenListener = onValue(ref(db, 'toolTokens'), () => {
              console.log("Tool tokens updated in Firebase, refreshing...");
              fetchToolToken();
            });
            
            // Return cleanup function
            return () => {
              tokenListener();
            };
          } else {
            setHasAccess(false);
            setIsLoading(false);
          }
        } else {
          setHasAccess(false);
          setIsLoading(false);
        }
      });
    };

    return checkAccess();
  }, [user, toolId]);

  const handleDownload = (): void => {
    if (!hasAccess) {
      showToast('Access denied', 'error');
      return;
    }
    
    const downloadUrl = toolInfo?.downloadUrl || TOOL_INFO.default.downloadUrl;
    window.open(downloadUrl, '_blank');
  };

  const copyToken = (): void => {
    if (toolToken && hasAccess) {
      navigator.clipboard.writeText(toolToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
      showToast('Token copied to clipboard', 'success');
    }
  };

  const copyId = (): void => {
    if (toolLoginId && hasAccess) {
      navigator.clipboard.writeText(toolLoginId);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
      showToast('ID copied to clipboard', 'success');
    }
  };

  const copyPassword = (): void => {
    if (toolPassword && hasAccess) {
      navigator.clipboard.writeText(toolPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
      showToast('Password copied to clipboard', 'success');
    }
  };

  const openTool = (): void => {
    if (!hasAccess || !toolId) {
      showToast('Access denied', 'error');
      return;
    }
    
    const toolUrl = toolInfo?.toolUrl || TOOL_INFO.default.toolUrl;
    window.open(toolUrl, '_blank');
    showToast('Opening tool in new tab', 'info');
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
            You don't have an active access for this tool.
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
              {/* Main Tool Token Section */}
              <div className="p-8 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg border border-purple-700 shadow-lg">
                <h2 className="text-2xl font-semibold text-white mb-4">Your Access {toolInfo?.useIdPassword ? 'Credentials' : 'Token'}</h2>
                <p className="text-indigo-200 mb-6">
                  {toolInfo?.useIdPassword 
                    ? `Use these credentials to access ${toolInfo?.name}. Copy the ID and password and use them to log in.` 
                    : `Use this token to access ${toolInfo?.name}. Copy it and use it to log in.`}
                </p>
                
                {isLoading ? (
                  <div className="flex justify-center p-6">
                    <div className="w-10 h-10 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
                  </div>
                ) : toolInfo?.useIdPassword ? (
                  // ID and Password display for tools that use credentials
                  <div className="flex flex-col space-y-5">
                    {/* ID Field */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">Login ID:</label>
                      <div className="relative">
                        <div className="p-5 bg-gray-800 rounded-lg border border-gray-700 font-mono text-md text-amber-400 break-all">
                          {toolLoginId || 'No ID available'}
                        </div>
                        <button
                          onClick={copyId}
                          disabled={!toolLoginId}
                          className="absolute top-3 right-3 p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
                          title="Copy ID"
                        >
                          {idCopied ? (
                            <Check className="h-5 w-5 text-green-400" />
                          ) : (
                            <Copy className="h-5 w-5 text-gray-300" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-sm font-medium text-indigo-300 mb-2">Password:</label>
                      <div className="relative">
                        <div className="p-5 bg-gray-800 rounded-lg border border-gray-700 font-mono text-md text-amber-400 break-all">
                          {toolPassword || 'No password available'}
                        </div>
                        <button
                          onClick={copyPassword}
                          disabled={!toolPassword}
                          className="absolute top-3 right-3 p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
                          title="Copy password"
                        >
                          {passwordCopied ? (
                            <Check className="h-5 w-5 text-green-400" />
                          ) : (
                            <Copy className="h-5 w-5 text-gray-300" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={copyId}
                        disabled={!toolLoginId}
                        className="flex-1 flex items-center justify-center px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        <Copy className="h-5 w-5 mr-2" />
                        Copy ID
                      </button>
                      
                      <button
                        onClick={copyPassword}
                        disabled={!toolPassword}
                        className="flex-1 flex items-center justify-center px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        <Copy className="h-5 w-5 mr-2" />
                        Copy Password
                      </button>
                      
                      <button
                        onClick={openTool}
                        className="flex-1 flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Open {toolInfo?.name}
                      </button>
                    </div>
                    
                    <p className="text-center text-indigo-200 mt-2">
                      First copy your ID and password, then click "Open {toolInfo?.name}" and use them to log in.
                    </p>
                  </div>
                ) : toolToken ? (
                  // Standard token display for other tools
                  <div className="flex flex-col space-y-5">
                    <div className="relative">
                      <div className="p-5 bg-gray-800 rounded-lg border border-gray-700 font-mono text-md text-amber-400 break-all">
                        {toolToken}
                      </div>
                      <button
                        onClick={copyToken}
                        className="absolute top-3 right-3 p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                        title="Copy token"
                      >
                        {tokenCopied ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5 text-gray-300" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={copyToken}
                        className="flex-1 flex items-center justify-center px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Copy className="h-5 w-5 mr-2" />
                        Copy Token
                      </button>
                      
                      <button
                        onClick={openTool}
                        className="flex-1 flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Open {toolInfo?.name}
                      </button>
                    </div>
                    
                    <p className="text-center text-indigo-200 mt-2">
                      First copy your token, then click "Open {toolInfo?.name}" and use the token to log in.
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-800/70 rounded-lg border border-gray-700">
                    <p className="text-indigo-200 mb-6 text-lg">
                      No {toolInfo?.useIdPassword ? 'credentials' : 'token'} found for {toolInfo?.name}. Please check back later or contact the administrator.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download Resources
                      </button>
                      
                      <button
                        onClick={openTool}
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        Open {toolInfo?.name}
                      </button>
                    </div>
                    
                    {/* Show refresh button to try fetching the token again */}
                    <button 
                      onClick={() => fetchToolToken()} 
                      className="mt-4 text-indigo-400 underline hover:text-indigo-300"
                    >
                      Refresh {toolInfo?.useIdPassword ? 'Credentials' : 'Token'}
                    </button>
                  </div>
                )}
              </div>

              {/* Subscription Info */}
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Access Info</h2>
                {access && (
                  <div className="space-y-2">
                    <p className="text-indigo-200">
                      <span className="text-gray-400">Status:</span> {access.status}
                    </p>
                    <p className="text-indigo-200">
                      <span className="text-gray-400">Valid until:</span> {new Date(access.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Download Resources Section */}
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Download Resources</h2>
                <p className="text-indigo-200 mb-4">
                  Need additional help? Download our extension for {toolInfo?.name}.
                </p>
                
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download extension
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolAccess;
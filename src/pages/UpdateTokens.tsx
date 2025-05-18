import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, Check, Copy, Plus, Trash } from 'lucide-react';
import { ref, onValue, update, get, set } from 'firebase/database';
import { db } from '../config/firebase';
import { useToast } from '../context/ToastContext';
import { toolsData } from '../data/tools';

interface ToolCredentials {
  id?: string;
  password?: string;
}

const UpdateTokens = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<{ [key: string]: string | string[] }>({});
  const [credentials, setCredentials] = useState<{ [key: string]: ToolCredentials }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTool, setCopiedTool] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // Check if admin is logged in via session storage
    const adminAuth = sessionStorage.getItem('adminAuth');
    
    if (!adminAuth) {
      navigate('/admin/login');
      return;
    }

    // Fetch existing tokens with real-time updates
    const fetchTokens = () => {
      try {
        const tokensRef = ref(db, 'toolTokens');
        
        // Set up real-time listener
        return onValue(tokensRef, async (snapshot) => {
          if (snapshot.exists()) {
            const tokenData = snapshot.val();
            const processedTokens: {[key: string]: string | string[]} = {};
            const processedCredentials: {[key: string]: ToolCredentials} = {};
            
            // Process each token to extract the value property or use the direct value
            Object.entries(tokenData).forEach(([toolId, tokenValue]) => {
              // Special handling for Stealth Writer which uses ID/password
              if (toolId === 'stealth_writer' || toolId === 'tool_19') {
                if (typeof tokenValue === 'object' && tokenValue !== null) {
                  // @ts-ignore
                  processedCredentials[toolId] = {
                    // @ts-ignore
                    id: tokenValue.id || '',
                    // @ts-ignore
                    password: tokenValue.password || ''
                  };
                } else if (typeof tokenValue === 'string') {
                  try {
                    // Try to parse as JSON if it's a string
                    const parsed = JSON.parse(tokenValue as string);
                    processedCredentials[toolId] = {
                      id: parsed.id || '',
                      password: parsed.password || ''
                    };
                  } catch (e) {
                    // If parsing fails, just use as token
                    processedTokens[toolId] = tokenValue as string;
                  }
                }
              } 
              // Special handling for ChatGPT Plus (tool_1) with multiple tokens
              else if (toolId === 'tool_1') {
                // If it's already an array, use it directly
                if (Array.isArray(tokenValue)) {
                  processedTokens[toolId] = tokenValue;
                } 
                // If it's a string, convert it to a single-item array
                else if (typeof tokenValue === 'string') {
                  processedTokens[toolId] = [tokenValue];
                } 
                // If it's an object with a value property
                else if (typeof tokenValue === 'object' && tokenValue !== null) {
                  // @ts-ignore
                  if (tokenValue.value) {
                    // @ts-ignore
                    processedTokens[toolId] = Array.isArray(tokenValue.value) 
                      // @ts-ignore
                      ? tokenValue.value 
                      // @ts-ignore
                      : [tokenValue.value];
                  }
                  // Try to parse it as an array directly
                  else {
                    try {
                      // @ts-ignore
                      processedTokens[toolId] = Array.isArray(tokenValue) 
                        ? tokenValue 
                        : [JSON.stringify(tokenValue)];
                    } catch (e) {
                      processedTokens[toolId] = [''];
                    }
                  }
                }
              }
              else {
                if (typeof tokenValue === 'string') {
                  processedTokens[toolId] = tokenValue as string;
                } else if (typeof tokenValue === 'object' && tokenValue !== null) {
                  // @ts-ignore
                  if (tokenValue.value) {
                    // @ts-ignore
                    processedTokens[toolId] = tokenValue.value;
                  }
                }
              }
            });
            
            // Also check for tool_19 at root level
            try {
              const tool19Ref = ref(db, 'tool_19');
              const tool19Snapshot = await get(tool19Ref);
              
              if (tool19Snapshot.exists()) {
                const data = tool19Snapshot.val();
                if (typeof data === 'object' && data !== null) {
                  processedCredentials['tool_19'] = {
                    id: data.id || '',
                    password: data.password || ''
                  };
                }
              }
            } catch (error) {
              console.error('Error fetching tool_19 from root:', error);
            }
            
            setTokens(processedTokens);
            setCredentials(processedCredentials);
          }
          setIsLoading(false);
        }, (error) => {
          console.error('Error fetching tokens:', error);
          showToast('Failed to fetch tokens', 'error');
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error setting up token listener:', error);
        showToast('Failed to set up token listener', 'error');
        setIsLoading(false);
        return () => {}; // Return empty function if setup fails
      }
    };

    // Set up real-time listener for token updates
    const unsubscribe = fetchTokens();
    
    // Clean up the listener when component unmounts
    return () => {
      unsubscribe();
    };
  }, [navigate, showToast]);

  const handleTokenChange = (toolId: string, value: string, index?: number) => {
    // If it's ChatGPT Plus (tool_1) with multiple tokens
    if (toolId === 'tool_1' && typeof index === 'number') {
      setTokens(prev => {
        const currentTokens = Array.isArray(prev[toolId]) 
          ? [...prev[toolId] as string[]] 
          : [prev[toolId] as string || ''];
        
        currentTokens[index] = value;
        
        return {
          ...prev,
          [toolId]: currentTokens
        };
      });
    } else {
      // Regular single token handling
      setTokens(prev => ({
        ...prev,
        [toolId]: value
      }));
    }
  };

  const addTokenToTool1 = () => {
    setTokens(prev => {
      const currentTokens = Array.isArray(prev['tool_1']) 
        ? [...prev['tool_1'] as string[]] 
        : [prev['tool_1'] as string || ''];
      
      // Only add new token if less than 5 tokens
      if (currentTokens.length < 5) {
        currentTokens.push('');
      } else {
        showToast('Maximum 5 tokens allowed for ChatGPT Plus', 'error');
      }
      
      return {
        ...prev,
        'tool_1': currentTokens
      };
    });
  };

  const removeTokenFromTool1 = (index: number) => {
    setTokens(prev => {
      const currentTokens = Array.isArray(prev['tool_1']) 
        ? [...prev['tool_1'] as string[]] 
        : [prev['tool_1'] as string || ''];
      
      // Only remove if we have more than 1 token
      if (currentTokens.length > 1) {
        currentTokens.splice(index, 1);
      } else {
        currentTokens[0] = '';
      }
      
      return {
        ...prev,
        'tool_1': currentTokens
      };
    });
  };

  const handleCredentialChange = (toolId: string, field: 'id' | 'password', value: string) => {
    setCredentials(prev => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        [field]: value
      }
    }));
  };

  const updateToken = async (toolId: string) => {
    try {
      // Special handling for Stealth Writer
      if (toolId === 'stealth_writer' || toolId === 'tool_19') {
        const creds = credentials[toolId];
        if (!creds || (!creds.id && !creds.password)) {
          showToast('Please enter ID and password', 'error');
          return;
        }

        // For tool_19, update directly at the root level
        if (toolId === 'tool_19') {
          const tokenRef = ref(db, `toolTokens/tool_19`);
          await set(tokenRef, {
            id: creds.id || '',
            password: creds.password || ''
          });
          
          // Also update the direct path for redundancy
          const directRef = ref(db, 'tool_19');
          await set(directRef, {
            id: creds.id || '',
            password: creds.password || ''
          });
        } else {
          const tokenRef = ref(db, `toolTokens/${toolId}`);
          await set(tokenRef, {
            id: creds.id || '',
            password: creds.password || ''
          });
        }
        
        console.log(`Credentials updated for ${toolId}:`, creds);
        showToast(`Credentials for ${toolId} updated successfully`, 'success');
        return;
      }
      
      // Special handling for ChatGPT Plus (tool_1) with multiple tokens
      if (toolId === 'tool_1') {
        const chatgptTokens = tokens[toolId];
        
        if (!Array.isArray(chatgptTokens) || chatgptTokens.length === 0 || 
            chatgptTokens.every(t => !t || t.trim() === '')) {
          showToast('Please enter at least one token value', 'error');
          return;
        }
        
        // Remove any empty tokens
        const validTokens = Array.isArray(chatgptTokens) 
          ? chatgptTokens.filter(token => token && token.trim() !== '')
          : [chatgptTokens];
        
        if (validTokens.length === 0) {
          showToast('Please enter at least one token value', 'error');
          return;
        }
        
        const tokenRef = ref(db, `toolTokens/${toolId}`);
        await set(tokenRef, validTokens);
        
        console.log(`Multiple tokens updated for ${toolId}:`, validTokens);
        showToast(`${validTokens.length} tokens for ${toolId} updated successfully`, 'success');
        return;
      }

      // Normal token handling for other tools
      if (!tokens[toolId] || (typeof tokens[toolId] === 'string' && tokens[toolId].trim() === '')) {
        showToast('Please enter a token value', 'error');
        return;
      }

      const tokenRef = ref(db, `toolTokens/${toolId}`);
      
      // Store the token directly as a string rather than in a value property
      await set(tokenRef, tokens[toolId]);
      
      console.log(`Token updated for ${toolId}:`, tokens[toolId]);
      showToast(`Token for ${toolId} updated successfully`, 'success');
    } catch (error) {
      console.error('Error updating token:', error);
      showToast('Failed to update token', 'error');
    }
  };

  const updateAllTokens = async () => {
    try {
      const tokenUpdates: Record<string, string | string[]> = {};
      const credentialUpdates: Record<string, ToolCredentials> = {};
      let hasValidUpdates = false;

      // Process tokens and validate
      Object.entries(tokens).forEach(([toolId, token]) => {
        if (toolId !== 'stealth_writer' && toolId !== 'tool_19') {
          if (toolId === 'tool_1') {
            // For ChatGPT Plus, filter out empty tokens
            if (Array.isArray(token)) {
              const validTokens = token.filter(t => t && t.trim() !== '');
              if (validTokens.length > 0) {
                tokenUpdates[toolId] = validTokens;
                hasValidUpdates = true;
              }
            } else if (token && typeof token === 'string' && token.trim() !== '') {
              tokenUpdates[toolId] = [token];
              hasValidUpdates = true;
            }
          } else if (token && typeof token === 'string' && token.trim() !== '') {
            tokenUpdates[toolId] = token;
            hasValidUpdates = true;
          }
        }
      });

      // Process credentials for special tools
      Object.entries(credentials).forEach(([toolId, creds]) => {
        if ((creds.id && creds.id.trim() !== '') || (creds.password && creds.password.trim() !== '')) {
          credentialUpdates[toolId] = creds;
          hasValidUpdates = true;
        }
      });

      if (!hasValidUpdates) {
        showToast('No valid tokens or credentials to update', 'error');
        return;
      }

      console.log('Updating tokens:', tokenUpdates);
      console.log('Updating credentials:', credentialUpdates);
      
      // Update each token individually with set() to ensure they're stored directly
      for (const [toolId, token] of Object.entries(tokenUpdates)) {
        const tokenRef = ref(db, `toolTokens/${toolId}`);
        await set(tokenRef, token);
      }

      // Update credentials for special tools
      for (const [toolId, creds] of Object.entries(credentialUpdates)) {
        if (toolId === 'tool_19') {
          // Update in both locations for tool_19
          const tokenRef = ref(db, `toolTokens/${toolId}`);
          await set(tokenRef, creds);
          
          // Also update direct path
          const directRef = ref(db, 'tool_19');
          await set(directRef, creds);
        } else {
          const tokenRef = ref(db, `toolTokens/${toolId}`);
          await set(tokenRef, creds);
        }
      }
      
      showToast('All tokens and credentials updated successfully', 'success');
    } catch (error) {
      console.error('Error updating tokens:', error);
      showToast('Failed to update tokens', 'error');
    }
  };

  const copyToken = (toolId: string, index?: number) => {
    if (toolId === 'tool_1' && Array.isArray(tokens[toolId]) && typeof index === 'number') {
      const tokenArray = tokens[toolId] as string[];
      if (tokenArray[index]) {
        navigator.clipboard.writeText(tokenArray[index]);
        setCopiedTool(`${toolId}_${index}`);
        setTimeout(() => setCopiedTool(null), 2000);
        showToast('Token copied to clipboard', 'success');
      }
    } else if (tokens[toolId] && typeof tokens[toolId] === 'string') {
      navigator.clipboard.writeText(tokens[toolId] as string);
      setCopiedTool(toolId);
      setTimeout(() => setCopiedTool(null), 2000);
      showToast('Token copied to clipboard', 'success');
    }
  };

  const filteredTools = toolsData.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof tool.id === 'number' && `tool_${tool.id}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper function to determine if a tool uses ID/password
  const usesIdPassword = (toolId: string) => {
    return toolId === 'stealth_writer' || toolId === 'tool_19';
  };

  // Helper function for multiple tokens
  const hasMultipleTokens = (toolId: string) => {
    return toolId === 'tool_1';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="mr-4 text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold text-white">Update Tool Tokens</h1>
          </div>
          <button
            onClick={updateAllTokens}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="h-5 w-5 mr-2" />
            Save All Changes
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Tool Tokens</h2>
            <p className="text-gray-400 mt-1">
              Manage access tokens for all tools. These tokens will be displayed to users who have purchased access.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tool</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Access Credentials</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTools.map((tool) => {
                  // Convert tool.id to string if it's a number
                  const toolId = typeof tool.id === 'number' ? `tool_${tool.id}` : String(tool.id);
                  const isIdPasswordTool = usesIdPassword(toolId);
                  const isMultipleTokensTool = hasMultipleTokens(toolId);
                  
                  return (
                    <tr key={toolId} className="bg-gray-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                            {tool.icon && <tool.icon className="h-5 w-5 text-white" />}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{tool.name}</div>
                            <div className="text-sm text-gray-400">{toolId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isIdPasswordTool ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">Login ID</label>
                              <input
                                type="text"
                                value={credentials[toolId]?.id || ''}
                                onChange={(e) => handleCredentialChange(toolId, 'id', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Enter login ID"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                              <input
                                type="text"
                                value={credentials[toolId]?.password || ''}
                                onChange={(e) => handleCredentialChange(toolId, 'password', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Enter password"
                              />
                            </div>
                          </div>
                        ) : isMultipleTokensTool ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-medium text-gray-400">
                                Multiple Tokens (Maximum 5)
                              </label>
                              <button 
                                onClick={addTokenToTool1}
                                className="inline-flex items-center px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
                                disabled={Array.isArray(tokens[toolId]) && (tokens[toolId] as string[]).length >= 5}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Token
                              </button>
                            </div>
                            
                            {Array.isArray(tokens[toolId]) && (tokens[toolId] as string[]).map((token, index) => (
                              <div key={`token_${index}`} className="flex items-center space-x-2">
                                <textarea
                                  value={token}
                                  onChange={(e) => handleTokenChange(toolId, e.target.value, index)}
                                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  rows={2}
                                  placeholder={`Enter token ${index + 1} value here`}
                                />
                                <div className="flex flex-col space-y-2">
                                  <button
                                    onClick={() => copyToken(toolId, index)}
                                    className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                                    title="Copy token"
                                  >
                                    {copiedTool === `${toolId}_${index}` ? 
                                      <Check className="h-4 w-4 text-green-400" /> : 
                                      <Copy className="h-4 w-4 text-gray-300" />
                                    }
                                  </button>
                                  
                                  <button
                                    onClick={() => removeTokenFromTool1(index)}
                                    className="p-2 bg-red-800 text-white rounded hover:bg-red-700 transition-colors"
                                    title="Remove token"
                                    disabled={(tokens[toolId] as string[]).length <= 1}
                                  >
                                    <Trash className="h-4 w-4 text-gray-300" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            value={tokens[toolId] as string || ''}
                            onChange={(e) => handleTokenChange(toolId, e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={2}
                            placeholder="Enter token value here"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateToken(toolId)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                          >
                            Update
                          </button>
                          
                          {!isIdPasswordTool && !isMultipleTokensTool && (
                            <button
                              onClick={() => copyToken(toolId)}
                              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm flex items-center"
                            >
                              {copiedTool === toolId ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                              {copiedTool === toolId ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateTokens; 
import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { 
  updateToolTokensFirestore, 
  getToolTokensFirestore, 
  syncTokensToFirestore 
} from '../utils/adminFirestore.js';

const AVAILABLE_TOOLS = [
  { id: 'chatgpt_plus', name: 'ChatGPT Plus', type: 'token' },
  { id: 'envato_elements', name: 'Envato Elements', type: 'token' },
  { id: 'canva_pro', name: 'Canva Pro', type: 'token' },
  { id: 'storyblocks', name: 'Storyblocks', type: 'token' },
  { id: 'semrush', name: 'SEMrush', type: 'token' },
  { id: 'stealth_writer', name: 'Stealth Writer', type: 'credentials' },
  { id: 'hix_bypass', name: 'Hix Bypass', type: 'token' }
];

const ToolTokensManager = () => {
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedTool, setSelectedTool] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loginIdInput, setLoginIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    loadAllTokens();
  }, []);

  const loadAllTokens = async () => {
    try {
      setLoading(true);
      const result = await getToolTokensFirestore();
      
      if (result.success) {
        setTokens(result.data || {});
        showToast(`Loaded tokens for ${Object.keys(result.data || {}).length} tools`, 'success');
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      showToast('Failed to load tokens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateToken = async (e) => {
    e.preventDefault();
    
    if (!selectedTool) {
      showToast('Please select a tool', 'warning');
      return;
    }

    const tool = AVAILABLE_TOOLS.find(t => t.id === selectedTool);
    if (!tool) {
      showToast('Invalid tool selected', 'error');
      return;
    }

    try {
      setUpdating(true);
      
      const tokenData = {};
      
      if (tool.type === 'credentials') {
        if (!loginIdInput || !passwordInput) {
          showToast('Please provide both login ID and password', 'warning');
          return;
        }
        tokenData.loginId = loginIdInput;
        tokenData.password = passwordInput;
      } else {
        if (!tokenInput) {
          showToast('Please provide a token', 'warning');
          return;
        }
        tokenData.token = tokenInput;
      }

      const result = await updateToolTokensFirestore(selectedTool, tokenData);
      
      if (result.success) {
        showToast(`Successfully updated tokens for ${tool.name}`, 'success');
        
        // Clear inputs
        setTokenInput('');
        setLoginIdInput('');
        setPasswordInput('');
        setSelectedTool('');
        
        // Reload tokens
        await loadAllTokens();
      }
    } catch (error) {
      console.error('Error updating token:', error);
      showToast('Failed to update token', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleSyncTokens = async () => {
    try {
      setUpdating(true);
      const result = await syncTokensToFirestore();
      
      if (result.success) {
        showToast(`Successfully synced ${result.synced} tokens to Firestore`, 'success');
        await loadAllTokens();
      }
    } catch (error) {
      console.error('Error syncing tokens:', error);
      showToast('Failed to sync tokens', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const selectedToolInfo = AVAILABLE_TOOLS.find(t => t.id === selectedTool);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Tool Tokens Manager</h2>
        <div className="flex gap-3">
          <button
            onClick={loadAllTokens}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleSyncTokens}
            disabled={updating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {updating ? 'Syncing...' : 'Sync from RTDB'}
          </button>
        </div>
      </div>

      {/* Token Update Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Update Tool Tokens</h3>
          
          <form onSubmit={handleUpdateToken} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Tool</label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Choose a tool...</option>
                {AVAILABLE_TOOLS.map(tool => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name} ({tool.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedToolInfo && (
              <>
                {selectedToolInfo.type === 'credentials' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Login ID</label>
                      <input
                        type="text"
                        value={loginIdInput}
                        onChange={(e) => setLoginIdInput(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Enter login ID..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        placeholder="Enter password..."
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Token</label>
                    <textarea
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Enter token..."
                      rows="3"
                      required
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={updating || !selectedTool}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {updating ? 'Updating...' : 'Update Token'}
            </button>
          </form>
        </div>

        {/* Current Tokens Display */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Current Tokens Status</h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-gray-400">Loading tokens...</p>
              </div>
            ) : (
              AVAILABLE_TOOLS.map(tool => {
                const tokenData = tokens[tool.id];
                const hasToken = tokenData && (
                  tool.type === 'credentials' 
                    ? (tokenData.loginId || tokenData.id) && tokenData.password
                    : tokenData.token
                );

                return (
                  <div key={tool.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-white">{tool.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasToken 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {hasToken ? 'Available' : 'Missing'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-2">Type: {tool.type}</p>
                    
                    {tokenData && (
                      <div className="text-xs text-gray-500">
                        {tool.type === 'credentials' ? (
                          <>
                            <p>Login ID: {tokenData.loginId || tokenData.id ? '***' : 'Not set'}</p>
                            <p>Password: {tokenData.password ? '***' : 'Not set'}</p>
                          </>
                        ) : (
                          <p>Token: {tokenData.token ? `${tokenData.token.substring(0, 20)}...` : 'Not set'}</p>
                        )}
                        {tokenData.updatedAt && (
                          <p>Last updated: {new Date(tokenData.lastModified || tokenData.updatedAt).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-white mb-2">📋 Instructions</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• <strong>Sync from RTDB:</strong> Import existing tokens from Realtime Database to Firestore</li>
          <li>• <strong>Token Tools:</strong> ChatGPT Plus, Envato Elements, Canva Pro, Storyblocks, SEMrush, Hix Bypass</li>
          <li>• <strong>Credential Tools:</strong> Stealth Writer (uses Login ID + Password)</li>
          <li>• <strong>Auto-sync:</strong> Updates are automatically synced to both Firestore and Realtime Database</li>
          <li>• <strong>User Access:</strong> Updated tokens will automatically appear on user tool access pages</li>
        </ul>
      </div>
    </div>
  );
};

export default ToolTokensManager; 
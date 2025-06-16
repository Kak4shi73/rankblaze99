import { useState } from 'react';
import { Menu, X, Settings, Key, Plug, Cookie, ChevronRight, Coins } from 'lucide-react';
import { ref, update, get, set } from 'firebase/database';
import { db } from '../../config/firebase';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

interface AdminHamburgerMenuProps {
  adminId: string;
}

const AdminHamburgerMenu = ({ adminId }: AdminHamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showCookiesModal, setShowCookiesModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [extensionUrl, setExtensionUrl] = useState('');
  const [toolCookies, setToolCookies] = useState<{[key: string]: string}>({});
  const [editingTool, setEditingTool] = useState('');
  const [editingCookie, setEditingCookie] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Fetch tool cookies when cookies modal is opened
  const fetchToolCookies = async () => {
    try {
      const cookiesRef = ref(db, 'toolCookies');
      const snapshot = await get(cookiesRef);
      if (snapshot.exists()) {
        setToolCookies(snapshot.val());
      }
    } catch (error) {
      console.error('Error fetching tool cookies:', error);
      showToast('Failed to fetch tool cookies', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    try {
      // Create a special document in Realtime Database for password change request
      const passwordChangeRequest = ref(db, `adminPasswordChangeRequests/${adminId}`);
      await set(passwordChangeRequest, {
        userId: adminId,
        newPassword: newPassword,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });
      
      // Update a timestamp in database to indicate password change
      const adminRef = ref(db, `users/admin`);
      await update(adminRef, {
        passwordUpdatedAt: new Date().toISOString()
      });
      
      showToast('Password change request submitted successfully', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error: any) {
      showToast(error.message || 'Failed to update password', 'error');
    }
  };

  const connectExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionUrl) return;

    try {
      // Store extension connection URL
      const extensionRef = ref(db, 'adminExtension');
      await update(extensionRef, {
        url: extensionUrl,
        connectedAt: new Date().toISOString(),
        status: 'connected'
      });
      
      showToast('Extension connected successfully', 'success');
      setShowExtensionModal(false);
      setExtensionUrl('');
    } catch (error: any) {
      showToast(error.message || 'Failed to connect extension', 'error');
    }
  };

  const updateCookie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool || !editingCookie) return;

    try {
      // Update the cookie value
      const cookieRef = ref(db, `toolCookies/${editingTool}`);
      await update(cookieRef, { value: editingCookie });
      
      // Update local state
      setToolCookies({
        ...toolCookies,
        [editingTool]: editingCookie
      });
      
      showToast(`Cookie for ${editingTool} updated successfully`, 'success');
      setEditingTool('');
      setEditingCookie('');
    } catch (error: any) {
      showToast(error.message || 'Failed to update cookie', 'error');
    }
  };

  const deleteCookie = async (toolId: string) => {
    try {
      // Delete the cookie
      const cookieRef = ref(db, `toolCookies/${toolId}`);
      await update(cookieRef, { value: null });
      
      // Update local state
      const updatedCookies = {...toolCookies};
      delete updatedCookies[toolId];
      setToolCookies(updatedCookies);
      
      showToast(`Cookie for ${toolId} deleted successfully`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete cookie', 'error');
    }
  };

  return (
    <div className="relative">
      {/* Menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-700 text-white transition-colors"
        aria-label="Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Admin Settings</h3>
          </div>
          
          <div className="py-2">
            {/* Password Change Option */}
            <button 
              onClick={() => {
                setIsOpen(false);
                setShowPasswordModal(true);
              }}
              className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Key size={18} className="mr-3 text-indigo-400" />
              <span>Change Admin Password</span>
              <ChevronRight size={16} className="ml-auto" />
            </button>
            
            {/* Extension Connection Option */}
            <button 
              onClick={() => {
                setIsOpen(false);
                setShowExtensionModal(true);
              }}
              className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Plug size={18} className="mr-3 text-indigo-400" />
              <span>Connect Extension</span>
              <ChevronRight size={16} className="ml-auto" />
            </button>
            
            {/* Tool Cookies Management */}
            <button 
              onClick={() => {
                setIsOpen(false);
                setShowCookiesModal(true);
                fetchToolCookies();
              }}
              className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Cookie size={18} className="mr-3 text-indigo-400" />
              <span>Manage Tool Cookies</span>
              <ChevronRight size={16} className="ml-auto" />
            </button>

            {/* Update Tokens Option */}
            <button 
              onClick={() => {
                setIsOpen(false);
                navigate('/admin/update-tokens');
              }}
              className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Coins size={18} className="mr-3 text-indigo-400" />
              <span>Update Tokens</span>
              <ChevronRight size={16} className="ml-auto" />
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Change Admin Password</h2>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extension Connection Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Connect Extension</h2>
              <button 
                onClick={() => setShowExtensionModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={connectExtension} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Extension URL</label>
                <input
                  type="text"
                  value={extensionUrl}
                  onChange={(e) => setExtensionUrl(e.target.value)}
                  placeholder="https://extension.example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExtensionModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tool Cookies Management Modal */}
      {showCookiesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Manage Tool Cookies</h2>
              <button 
                onClick={() => setShowCookiesModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* List of existing cookies */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-300 mb-2">Current Cookies</h3>
              
              {Object.keys(toolCookies).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(toolCookies).map(([toolId, cookie]) => (
                    <div key={toolId} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-indigo-300">{toolId}</h4>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setEditingTool(toolId);
                              setEditingCookie(cookie);
                            }}
                            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteCookie(toolId)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 break-all">
                        {cookie.length > 50 ? `${cookie.substring(0, 50)}...` : cookie}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No cookies found</p>
              )}
            </div>
            
            {/* Edit cookie form */}
            {editingTool && (
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-md font-semibold text-gray-300 mb-3">Edit Cookie for {editingTool}</h3>
                <form onSubmit={updateCookie} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Cookie Value</label>
                    <textarea
                      value={editingCookie}
                      onChange={(e) => setEditingCookie(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-24"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTool('');
                        setEditingCookie('');
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Update Cookie
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Add new cookie form */}
            {!editingTool && (
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-md font-semibold text-gray-300 mb-3">Add New Cookie</h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateCookie(e);
                  }} 
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tool ID</label>
                    <input
                      type="text"
                      value={editingTool}
                      onChange={(e) => setEditingTool(e.target.value)}
                      placeholder="e.g., chatgpt_plus"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Cookie Value</label>
                    <textarea
                      value={editingCookie}
                      onChange={(e) => setEditingCookie(e.target.value)}
                      placeholder="Enter cookie value here"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-24"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTool('');
                        setEditingCookie('');
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Add Cookie
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHamburgerMenu; 
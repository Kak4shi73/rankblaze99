import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, CreditCard, Package, User, Mail, LogOut, MessageCircle, ExternalLink } from 'lucide-react';
import { db } from '../config/firebase';
import { ref, onValue } from 'firebase/database';
import { getAuth, signOut } from 'firebase/auth';

// Define types
interface Access {
  id: string;
  userId: string;
  status: string;
  plan: string;
  startDate: number;
  endDate: number;
  tools: Tool[];
}

interface Tool {
  id: string;
  name: string;
  price: number;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    if (!user) return;

    // Load available tools (static data)
    const AVAILABLE_TOOLS = [
      { id: 'chatgpt_plus', name: 'ChatGPT Plus', price: 349 },
      { id: 'envato_elements', name: 'Envato Elements', price: 199 },
      { id: 'canva_pro', name: 'Canva Pro', price: 149 },
      { id: 'storyblocks', name: 'Storyblocks', price: 199 },
      { id: 'semrush', name: 'SEMrush', price: 299 },
      { id: 'grammarly', name: 'Grammarly', price: 99 },
      { id: 'netflix_premium', name: 'Netflix Premium', price: 179 },
      { id: 'spotify_premium', name: 'Spotify Premium', price: 50 },
      { id: 'youtube_premium', name: 'YouTube Premium', price: 60 },
      { id: 'helium10', name: 'Helium10', price: 299 },
      { id: 'writesonic', name: 'Writesonic', price: 149 },
      { id: 'leonardo_ai', name: 'Leonardo.ai', price: 199 },
      { id: 'coursera', name: 'Coursera', price: 99 },
      { id: 'linkedin_learning', name: 'LinkedIn Learning', price: 99 },
      { id: 'skillshare', name: 'Skillshare', price: 99 },
      { id: 'prezi', name: 'Prezi', price: 149 },
      { id: 'vistacreate', name: 'VistaCreate', price: 99 },
      { id: 'vecteezy', name: 'Vecteezy', price: 99 }
    ];
    setAvailableTools(AVAILABLE_TOOLS);

    // Listen for accesses from realtime database
    const accessesRef = ref(db, 'subscriptions');
    const unsubscribeAccesses = get(accessesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Find user accesses
        const userAccesses = Object.entries(data)
          .filter(([_, value]: [string, any]) => value.userId === user.id)
          .map(([key, value]: [string, any]) => ({
            id: key,
            ...value,
          }));
        
        setAccesses(userAccesses);
        
        // Extract tools from access
        const toolsFromSubs = userAccesses.flatMap(sub => sub.tools || []);
        setAccesses(userAccesses);
      } else {
        setAccesses([]);
      }
    });

    // Listen for payment data
    const paymentsRef = ref(db, 'payments');
    const unsubscribePayments = get(paymentsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userPayments = Object.entries(data)
          .map(([id, value]: [string, any]) => ({
            id,
            ...value
          }))
          .filter(payment => payment.userId === user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setPayments(userPayments);
      } else {
        setPayments([]);
      }
      setIsLoadingData(false);
    });

    return () => {
      unsubscribeAccesses();
      unsubscribePayments();
    };
  }, [user]);

  // Wait for authentication to complete before checking user
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only redirect if we're sure the user is not authenticated
  if (!isLoading && !user) {
    navigate('/login');
    return null;
  }

  const handleContactAdmin = () => {
    window.open('https://t.me/Ary4n_exe', '_blank');
  };

  const getToolName = (toolId: string) => {
    const tool = availableTools.find(t => t.id === toolId);
    return tool ? tool.name : toolId;
  };

  const accessTool = (toolId: string) => {
    navigate(`/tool-access/${toolId}`);
  };

  const getLastPayment = () => {
    if (payments.length > 0) {
      const lastPayment = payments[0];
      return {
        amount: lastPayment.amount,
        date: new Date(lastPayment.createdAt).toLocaleDateString(),
        method: lastPayment.paymentMethod
      };
    }
    return null;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <p className="text-indigo-300 mt-1">Manage your RANKBLAZE account</p>
        </div>

        {/* Dashboard Tabs */}
        <div className="mb-8 border-b border-gray-700">
          <nav className="flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-gray-400 hover:text-indigo-300'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'access'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-gray-400 hover:text-indigo-300'
              }`}
              onClick={() => setActiveTab('access')}
            >
              Tool Access
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'billing'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-gray-400 hover:text-indigo-300'
              }`}
              onClick={() => setActiveTab('billing')}
            >
              Billing
            </button>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Profile Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <p className="text-white font-medium">{user?.name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <p className="text-white font-medium">{user?.email || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Account ID</label>
                  <p className="text-white font-medium">{user?.id || 'Not available'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Account Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={handleContactAdmin}
                  className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Admin
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tools Section */}
        {activeTab === 'access' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Tool Access</h3>
            
            {isLoadingData ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
              </div>
            ) : accesses.length > 0 ? (
              <div className="space-y-6">
                {accesses.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="bg-navy-700/50 border border-royal-500/20 rounded-xl overflow-hidden"
                  >
                    <div className="p-6">
                      <h4 className="text-lg font-medium text-white">{sub.plan || 'Premium Tool Access'}</h4>
                      <div className="flex flex-wrap gap-4 mt-4 mb-6">
                        {sub.tools && sub.tools.map((tool) => (
                          <div key={tool.id} className="flex flex-col items-center bg-navy-800/40 p-3 rounded-lg border border-royal-500/10">
                            <div className="text-2xl mb-2">
                              {tool.id.includes('chatgpt') ? '🤖' : 
                               tool.id.includes('canva') ? '✏️' : 
                               tool.id.includes('envato') ? '🎨' : 
                               tool.id.includes('story') ? '🎬' : 
                               tool.id.includes('semrush') ? '📈' : 
                               tool.id.includes('gramm') ? '📝' : 
                               tool.id.includes('netflix') ? '🎬' : 
                               tool.id.includes('spotify') ? '🎵' : 
                               tool.id.includes('youtube') ? '📺' : '⚡'}
                            </div>
                            <span 
                              className="bg-navy-600/50 text-royal-300 text-xs py-1 px-3 rounded-full border border-royal-500/10 hover:bg-navy-500/50 cursor-pointer mb-3 text-center"
                            >
                              {getToolName(tool.id)}
                            </span>
                            <button 
                              onClick={() => accessTool(tool.id)}
                              className="w-full text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Access Tool
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <span className={`h-2 w-2 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-amber-500'} mr-2`}></span>
                          <span className="text-royal-200">
                            {sub.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <span className="text-royal-300">
                          Valid until: {new Date(sub.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={() => navigate('/tools')}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Get More Tool Access
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">You don't have any active tool access.</p>
                <button 
                  onClick={() => navigate('/tools')}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Get Tool Access
                </button>
              </div>
            )}
          </div>
        )}

        {/* Billing Section */}
        {activeTab === 'billing' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Billing Information</h3>
            
            {isLoadingData ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-6">
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Last Payment</h4>
                  {getLastPayment() && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white font-medium">₹{getLastPayment()?.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white">{getLastPayment()?.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Method:</span>
                        <span className="text-white capitalize">{getLastPayment()?.method}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Payment History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 text-sm">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {payments.slice(0, 5).map(payment => (
                          <tr key={payment.id} className="text-white">
                            <td className="py-3">{new Date(payment.createdAt).toLocaleDateString()}</td>
                            <td className="py-3">₹{payment.amount}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                payment.status === 'completed' ? 'bg-green-900 text-green-300' : 
                                payment.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 
                                'bg-red-900 text-red-300'
                              }`}>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">You don't have any payment history yet.</p>
                <p className="text-gray-400 mt-2">
                  Contact the administrator to update your billing information or payment methods.
                </p>
                <button
                  onClick={handleContactAdmin}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Admin
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
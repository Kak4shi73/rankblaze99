import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, CreditCard, Package, User, Mail, LogOut, MessageCircle, ExternalLink } from 'lucide-react';
import { firestore, collections, db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';

// Define types
interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  plan?: string;
  createdAt: string;
  tools?: ToolAccess[];
  lastPayment?: {
    amount: number;
    date: string;
    method: string;
  };
}

interface ToolAccess {
  id: string;
  status: string;
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [userTools, setUserTools] = useState<ToolAccess[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

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

    // Listen for subscriptions from realtime database
    const subscriptionsRef = ref(db, 'subscriptions');
    const unsubscribeSubscriptions = onValue(subscriptionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userSubscriptions = Object.entries(data)
          .map(([id, value]: [string, any]) => ({
            id,
            ...value
          }))
          .filter(sub => sub.userId === user.id && sub.status === 'active');
        
        setSubscriptions(userSubscriptions);
        
        // Extract tools from subscription
        const toolsFromSubs = userSubscriptions.flatMap(sub => sub.tools || []);
        setUserTools(toolsFromSubs);
      } else {
        setSubscriptions([]);
        setUserTools([]);
      }
    });

    // Listen for payment data
    const paymentsRef = ref(db, 'payments');
    const unsubscribePayments = onValue(paymentsRef, (snapshot) => {
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
      unsubscribeSubscriptions();
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
                activeTab === 'tools'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-gray-400 hover:text-indigo-300'
              }`}
              onClick={() => setActiveTab('tools')}
            >
              My Tools
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'subscriptions'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-gray-400 hover:text-indigo-300'
              }`}
              onClick={() => setActiveTab('subscriptions')}
            >
              Subscriptions
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
                  onClick={logout}
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
        {activeTab === 'tools' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Tools</h3>
            
            {isLoadingData ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
              </div>
            ) : userTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTools
                  .filter(tool => tool.status === 'active')
                  .map((tool) => (
                    <div key={tool.id} className="border border-gray-700 rounded-lg p-4 bg-gray-850 hover:bg-gray-750 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-white">{getToolName(tool.id)}</h4>
                          <p className="text-sm text-gray-400 mt-1">Status: Active</p>
                        </div>
                        <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      <button 
                        onClick={() => accessTool(tool.id)}
                        className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Access Tool
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">You don't have any active tools.</p>
                <button 
                  onClick={() => navigate('/tools')}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Browse Tools
                </button>
              </div>
            )}
          </div>
        )}

        {/* Subscriptions Section */}
        {activeTab === 'subscriptions' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Subscriptions</h3>
            
            {isLoadingData ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
              </div>
            ) : subscriptions.length > 0 ? (
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-white">{sub.plan || 'Premium Subscription'}</h4>
                        <p className="text-sm text-gray-400 mt-1">Active since: {new Date(sub.startDate || sub.createdAt).toLocaleDateString()}</p>
                        {sub.endDate && (
                          <p className="text-sm text-gray-400 mt-1">Valid until: {new Date(sub.endDate).toLocaleDateString()}</p>
                        )}
                      </div>
                      <span className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded-full">
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </div>
                    
                    {sub.tools && sub.tools.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-300 mb-2">Included Tools:</h5>
                        <div className="flex flex-wrap gap-2">
                          {sub.tools
                            .filter(tool => tool.status === 'active')
                            .map(tool => (
                              <span key={tool.id} className="bg-gray-700 text-indigo-300 text-xs px-2 py-1 rounded-md">
                                {getToolName(tool.id)}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">You don't have any active subscriptions.</p>
                <button 
                  onClick={() => navigate('/tools')}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Browse Plans
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
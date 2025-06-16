import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Activity, BarChart3, UserPlus, Key, Trash2, Eye, Lock, Unlock } from 'lucide-react';
import { auth, db, firestore } from '../config/firebase';
import { ref, onValue, update, set, remove, get } from 'firebase/database';
import { createUserWithEmailAndPassword, deleteUser, updatePassword } from 'firebase/auth';
import { useToast } from '../context/ToastContext';
import { clearSessionData } from '../utils/securityUtils';
import { doc, setDoc } from 'firebase/firestore';
import AdminSidebar from '../components/ui/AdminSidebar';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isAdmin?: boolean;
  lastLoginIP?: string;
  passwordHash?: string;
  disabled?: boolean;
}

interface Tool {
  id: string;
  name: string;
  purchaseDate: string;
  expiryDate: string;
  price: number;
  status?: string; // 'active' or 'suspended'
}

interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
  toolId?: string;
}

interface Subscription {
  id: string;
  userId: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  paymentId: string;
  tools?: { 
    id: string;
    status: string; // 'active' or 'suspended'
  }[];
}

// First, add a constant array with all available tools
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
  { id: 'vecteezy', name: 'Vecteezy', price: 99 },
  { id: 'stealth_writer', name: 'Stealth Writer', price: 449 },
  { id: 'hix_bypass', name: 'Hix Bypass', price: 299 }
];

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);
  const [showAssignTool, setShowAssignTool] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newTool, setNewTool] = useState({ name: '', price: 133 });
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      // Check if admin is logged in via session storage
      const adminAuth = sessionStorage.getItem('adminAuth');
      
      if (!adminAuth) {
        navigate('/admin/login');
        return;
      }

      try {
        // Get admin user from Realtime Database - using the new path
        const adminRef = ref(db, 'users/admin');
        const snapshot = await get(adminRef);
        
        if (!snapshot.exists() || !snapshot.val().isAdmin) {
          navigate('/admin/login');
          return;
        }

        // Subscribe to users
        const usersRef = ref(db, 'users');
        const unsubUsers = onValue(usersRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const usersArray = Object.entries(data)
              .map(([id, user]: [string, any]) => ({
                id,
                ...user,
              }))
              .filter(user => !user.isAdmin);
            setUsers(usersArray);
          }
        });

        // Subscribe to payments
        const paymentsRef = ref(db, 'payments');
        const unsubPayments = onValue(paymentsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const paymentsArray = Object.entries(data).map(([id, payment]: [string, any]) => ({
              id,
              ...payment,
            }));
            setPayments(paymentsArray);
            
            const revenue = paymentsArray
              .filter(payment => payment.status === 'completed')
              .reduce((total, payment) => total + payment.amount, 0);
            setTotalRevenue(revenue);
          }
        });

        // Subscribe to subscriptions
        const subsRef = ref(db, 'subscriptions');
        const unsubSubs = onValue(subsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const subsArray = Object.entries(data).map(([id, sub]: [string, any]) => ({
              id,
              ...sub,
            }));
            setSubscriptions(subsArray);
          }
          setIsLoading(false);
        });

        return () => {
          unsubUsers();
          unsubPayments();
          unsubSubs();
        };
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const now = new Date().toISOString();
      
      // Instead of storing the raw password, we'll store a placeholder indicator 
      // that a password exists (the actual auth is handled by Firebase Auth)
      await set(ref(db, `users/${userCredential.user.uid}`), {
        email: newUser.email,
        name: newUser.name,
        createdAt: now,
        lastLoginIP: 'Not logged in yet',
        passwordHash: '••••••••', // Just an indicator that a password exists
        disabled: false,
        isAdmin: false
      });

      showToast('User added successfully', 'success');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '' });
    } catch (error: any) {
      showToast(error.message || 'Failed to add user', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Don't allow deleting currently logged-in admin
      const adminAuth = sessionStorage.getItem('adminAuth');
      if (adminAuth === userId) {
        showToast('Cannot delete your own admin account', 'error');
        return;
      }
      
      // Delete user data
      await remove(ref(db, `users/${userId}`));
      
      // Delete user's subscriptions
      const userSubs = subscriptions.filter(sub => sub.userId === userId);
      for (const sub of userSubs) {
        await remove(ref(db, `subscriptions/${sub.id}`));
      }

      // Delete user's payments
      const userPayments = payments.filter(payment => payment.userId === userId);
      for (const payment of userPayments) {
        await remove(ref(db, `payments/${payment.id}`));
      }
      
      // Create a request for Firebase Auth user deletion
      // This should be handled by a Cloud Function for security
      const deleteRequest = doc(firestore, 'userDeletionRequests', userId);
      await setDoc(deleteRequest, {
        userId: userId,
        requestedBy: 'admin',
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });

      showToast('User deletion request submitted successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete user', 'error');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newPassword) return;

    try {
      // Get the user's email from the database
      const userRef = ref(db, `users/${selectedUserId}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        showToast('User not found', 'error');
        return;
      }
      
      const userEmail = userSnapshot.val().email;
      
      // For security reasons, we should use Firebase Admin SDK on the server
      // But as a workaround, we'll create a special document in Firestore that a Cloud Function can monitor
      // to perform the password change securely
      const passwordChangeRequest = doc(firestore, 'passwordChangeRequests', selectedUserId);
      await setDoc(passwordChangeRequest, {
        userId: selectedUserId,
        email: userEmail,
        newPassword: newPassword, // Note: In production, you should encrypt this or use a more secure method
        requestedBy: 'admin',
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });
      
      // Update a timestamp and password indicator in database
      await update(userRef, {
        passwordHash: '••••••••', // Just an indicator that a password was set
        passwordUpdatedAt: new Date().toISOString()
      });
      
      showToast('Password change request submitted successfully', 'success');
      setShowChangePassword(false);
      setNewPassword('');
      setSelectedUserId(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to update password', 'error');
    }
  };

  const handleSubscriptionUpdate = async (userId: string, status: string, singleToolId: string | null = null) => {
    try {
      const subscription = subscriptions.find(sub => sub.userId === userId);
      const now = new Date().toISOString();
      
      if (subscription) {
        const subRef = ref(db, `subscriptions/${subscription.id}`);
        await update(subRef, {
          status: status,
          updatedAt: now
        });
      } else if (status === 'active') {
        // Create a new payment record
        const paymentId = `payment_${Date.now()}`;
        const paymentRef = ref(db, `payments/${paymentId}`);
        
        // If singleToolId is provided, only add that tool
        // Otherwise leave tools as empty array
        let defaultTools: Array<{id: string; status: string}> = [];
        let paymentAmount = 399; // Default subscription amount
        
        if (singleToolId) {
          defaultTools = [{
            id: singleToolId,
            status: 'active'
          }];
          
          // Get the tool price from available tools
          const toolPrice = AVAILABLE_TOOLS.find(t => t.id === singleToolId)?.price || 133;
          
          // Use the tool price as the payment amount instead of creating a separate payment
          paymentAmount = toolPrice;
        }
        
        // Create a single payment record that includes the tool
        const paymentData = {
          userId,
          amount: paymentAmount,
          status: 'completed',
          paymentMethod: 'admin_activation',
          createdAt: now,
          toolId: singleToolId || undefined // Include toolId in the payment if provided
        };
        await set(paymentRef, paymentData);

        // Create a new subscription with only specified tool (or empty tools array)
        const subId = `sub_${Date.now()}`;
        const subRef = ref(db, `subscriptions/${subId}`);
        const subData = {
          userId,
          status: 'active',
          startDate: now,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          amount: paymentAmount,
          paymentId: paymentId,
          tools: defaultTools,
          createdAt: now
        };
        await set(subRef, subData);
      }

      showToast(`Subscription ${status === 'active' ? 'activated' : 'suspended'} successfully`, 'success');
    } catch (error) {
      console.error('Error updating subscription:', error);
      showToast('Failed to update subscription', 'error');
    }
  };

  const toggleToolStatus = async (
    userId: string, 
    subscriptionId: string, 
    toolId: string, 
    currentStatus: string
  ) => {
    try {
      const now = new Date().toISOString();
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      // Get the subscription
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      
      if (!subscription) {
        showToast('Subscription not found', 'error');
        return;
      }
      
      // Get the subscription tools array
      const tools = subscription.tools || [];
      
      // Find if the tool exists in the array
      const toolIndex = tools.findIndex(t => typeof t === 'object' ? t.id === toolId : t === toolId);
      
      let updatedTools = [];
      
      if (toolIndex >= 0) {
        // If tool is already an object with status
        if (typeof tools[toolIndex] === 'object') {
          updatedTools = [...tools];
          updatedTools[toolIndex] = { 
            ...updatedTools[toolIndex], 
            status: newStatus 
          };
        } else {
          // If tool is just a string, convert all to objects with status
          updatedTools = tools.map((t, index) => {
            // Convert string to object with status
            if (typeof t === 'string') {
              return { 
                id: t, 
                status: index === toolIndex ? newStatus : 'active' 
              };
            }
            return t;
          });
        }
      } else {
        showToast('Tool not found in subscription', 'error');
        return;
      }
      
      // Update the subscription in the database
      const subRef = ref(db, `subscriptions/${subscriptionId}`);
      await update(subRef, {
        tools: updatedTools,
        updatedAt: now
      });
      
      showToast(
        `Tool "${AVAILABLE_TOOLS.find(t => t.id === toolId)?.name || toolId}" ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`, 
        'success'
      );
    } catch (error) {
      console.error('Error toggling tool status:', error);
      showToast('Failed to update tool status', 'error');
    }
  };

  const assignToolToUser = async (userId: string, toolName: string, price: number = 133) => {
    try {
      const now = new Date().toISOString();
      
      // Check if the user already has this tool in any active subscription
      const activeSubscription = subscriptions.find(sub => 
        sub.userId === userId && 
        sub.status === 'active' && 
        sub.tools && 
        (sub.tools.some(t => typeof t === 'object' 
          ? t.id === toolName && t.status === 'active'
          : t === toolName))
      );
      
      if (activeSubscription) {
        showToast(`User already has access to "${toolName}" tool`, 'info');
        return;
      }
      
      // Find active subscription to add the tool to
      const userActiveSubscription = subscriptions.find(sub => 
        sub.userId === userId && sub.status === 'active'
      );
      
      if (userActiveSubscription) {
        // Create a payment record for the tool ONLY IF we're adding a new tool
        const toolPaymentId = `tool_payment_${Date.now()}`;
        const paymentRef = ref(db, `payments/${toolPaymentId}`);
        const paymentData = {
          userId,
          toolId: toolName,
          amount: price,
          status: 'completed',
          paymentMethod: 'admin_assignment',
          createdAt: now
        };

        // Update the subscription with the new tool
        const subRef = ref(db, `subscriptions/${userActiveSubscription.id}`);
        
        // Make sure we don't add duplicate tools
        const currentTools = userActiveSubscription.tools || [];
        const toolExists = currentTools.some(t => 
          typeof t === 'object' ? t.id === toolName : t === toolName
        );
        
        if (!toolExists) {
          // Create payment record only when actually adding a new tool
          await set(paymentRef, paymentData);
          
          // Convert all tools to objects if they aren't already
          const updatedTools = currentTools.map(t => 
            typeof t === 'object' ? t : { id: t, status: 'active' }
          );
          
          // Add the new tool as an object
          updatedTools.push({ id: toolName, status: 'active' });
          
          await update(subRef, {
            tools: updatedTools,
            updatedAt: now
          });
        }
      } else {
        // If no active subscription exists, create one with this tool
        await handleSubscriptionUpdate(userId, 'active', toolName);
        return; // handleSubscriptionUpdate already adds default tools including this one
      }
      
      showToast(`Tool "${toolName}" assigned to user successfully`, 'success');
    } catch (error) {
      console.error('Error assigning tool:', error);
      showToast('Failed to assign tool', 'error');
    }
  };

  const handleToggleAccountAccess = async (userId: string, currentStatus: boolean) => {
    try {
      // Update local database
      const userRef = ref(db, `users/${userId}`);
      await update(userRef, {
        disabled: !currentStatus,
        lastUpdatedAt: new Date().toISOString()
      });
      
      // Request account disable/enable in Firebase Auth
      // This should be handled by a Cloud Function for security
      const toggleRequest = doc(firestore, 'accountStatusRequests', userId);
      await setDoc(toggleRequest, {
        userId: userId,
        requestedStatus: !currentStatus ? 'disabled' : 'enabled',
        requestedBy: 'admin',
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });
      
      showToast(`Account ${!currentStatus ? 'disable' : 'enable'} request submitted successfully`, 'success');
    } catch (error) {
      console.error('Error updating account status:', error);
      showToast('Failed to update account status', 'error');
    }
  };

  const handleLogout = () => {
    // Clear admin session
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminEmail');
    
    // Sign out from Firebase Auth
    auth.signOut();
    
    // Clear any security-related data 
    // Admin users are exempted from session sharing protection in our utils
    clearSessionData('admin');
    
    showToast('Logged out successfully', 'success');
    navigate('/admin/login');
  };

  const deleteToolFromUser = async (
    userId: string,
    subscriptionId: string,
    toolId: string
  ) => {
    try {
      // Get subscription data
      const subscriptionRef = ref(db, `subscriptions/${subscriptionId}`);
      const snapshot = await get(subscriptionRef);
      
      if (!snapshot.exists()) {
        showToast('Subscription not found', 'error');
        return;
      }
      
      const subscription = snapshot.val();
      
      // Remove tool from tools array
      if (Array.isArray(subscription.tools)) {
        const updatedTools = subscription.tools.filter((t: any) => {
          if (typeof t === 'object') {
            return t.id !== toolId;
          }
          return t !== toolId;
        });
        
        // Update the subscription with the filtered tools array
        await update(subscriptionRef, { tools: updatedTools });
        
        showToast('Tool deleted successfully', 'success');
      } else {
        showToast('No tools found in subscription', 'error');
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      showToast('Failed to delete tool', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-[#0c0128] via-[#2a0669] to-[#0c0128]">
      {/* Add the sidebar */}
      <AdminSidebar />

      {/* Main content area - moved to the right */}
      <div className="ml-64 px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#131731] rounded-xl p-6 flex items-center">
            <div className="bg-blue-900/30 p-3 rounded-full mr-4">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(user => !user.disabled).length}
              </p>
            </div>
          </div>

          <div className="bg-[#131731] rounded-xl p-6 flex items-center">
            <div className="bg-green-900/30 p-3 rounded-full mr-4">
              <CreditCard className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-white">
                {subscriptions.filter(sub => sub.status === 'active').length}
              </p>
            </div>
          </div>

          <div className="bg-[#131731] rounded-xl p-6 flex items-center">
            <div className="bg-amber-900/30 p-3 rounded-full mr-4">
              <Activity className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Today's Payments</p>
              <p className="text-2xl font-bold text-white">
                {payments.filter(payment => {
                  const today = new Date().toISOString().split('T')[0];
                  return payment.createdAt.split('T')[0] === today;
                }).length}
              </p>
            </div>
          </div>

          <div className="bg-[#131731] rounded-xl p-6 flex items-center">
            <div className="bg-purple-900/30 p-3 rounded-full mr-4">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">₹{totalRevenue}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tools</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map(user => {
                  const subscription = subscriptions.find(sub => sub.userId === user.id);
                  const lastPayment = payments
                    .filter(payment => payment.userId === user.id)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                  
                  // Get user's active tools
                  const activeTools = subscription?.tools || [];

                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{user.name || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            subscription?.status === 'active'
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {subscription?.status || 'No subscription'}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.disabled 
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-green-900/30 text-green-400'
                          }`}>
                            {user.disabled ? 'Account Disabled' : 'Account Active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {user.lastLoginIP || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {subscription ? (
                          <div>
                            <div>Start: {new Date(subscription.startDate).toLocaleDateString()}</div>
                            <div>End: {new Date(subscription.endDate).toLocaleDateString()}</div>
                          </div>
                        ) : (
                          'No subscription'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {activeTools.length > 0 ? (
                            activeTools.map((tool, index) => {
                              // Handle both string and object format
                              const toolId = typeof tool === 'object' ? tool.id : tool;
                              const toolStatus = typeof tool === 'object' ? tool.status : 'active';
                              const toolInfo = AVAILABLE_TOOLS.find(t => t.id === toolId);
                              
                              // Only show active tools in the table row
                              if (toolStatus !== 'active') return null;
                              
                              return (
                                <span 
                                  key={index} 
                                  className="px-2 py-1 text-xs font-medium rounded-full bg-purple-900/30 text-purple-400"
                                  title={toolInfo ? `${toolInfo.name} - ₹${toolInfo.price}` : toolId}
                                >
                                  {toolInfo ? toolInfo.name.split(' ')[0] : (typeof toolId === 'string' ? toolId.split('_')[0] : 'Tool')}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-gray-500">No tools</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {lastPayment ? (
                          <div>
                            <div>₹{lastPayment.amount}</div>
                            <div>{new Date(lastPayment.createdAt).toLocaleDateString()}</div>
                          </div>
                        ) : (
                          'No payments'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setShowAssignTool(true);
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                          >
                            Add Tool
                          </button>
                          <button
                            onClick={() => handleSubscriptionUpdate(user.id, 'active')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleSubscriptionUpdate(user.id, 'suspended')}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleToggleAccountAccess(user.id, !!user.disabled)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title={user.disabled ? "Enable Account" : "Disable Account"}
                          >
                            {user.disabled ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setShowChangePassword(true);
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Change Password"
                          >
                            <Key className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setShowUserDetails(user.id)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Modal */}
        {showUserDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowUserDetails(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              
              {users.find(u => u.id === showUserDetails) && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">User Information</h3>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                      <p className="text-gray-400">Name: <span className="text-white">{users.find(u => u.id === showUserDetails)?.name}</span></p>
                      <p className="text-gray-400">Email: <span className="text-white">{users.find(u => u.id === showUserDetails)?.email}</span></p>
                      <p className="text-gray-400">User ID: <span className="text-white">{showUserDetails}</span></p>
                      <p className="text-gray-400">Last Login IP: <span className="text-white">{users.find(u => u.id === showUserDetails)?.lastLoginIP || 'Unknown'}</span></p>
                      <p className="text-gray-400">Joined: <span className="text-white">{new Date(users.find(u => u.id === showUserDetails)?.createdAt || '').toLocaleDateString()}</span></p>
                      <p className="text-gray-400">Password Hash: <span className="text-white">{users.find(u => u.id === showUserDetails)?.passwordHash ? '••••••••' : 'Not set'}</span></p>
                      <p className="text-gray-400">Account Status: 
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                          users.find(u => u.id === showUserDetails)?.disabled 
                            ? 'bg-red-900/30 text-red-400'
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {users.find(u => u.id === showUserDetails)?.disabled ? 'Disabled' : 'Active'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Active Subscriptions & Tools</h3>
                    <div className="space-y-3">
                      {subscriptions
                        .filter(sub => sub.userId === showUserDetails && sub.status === 'active')
                        .map(sub => (
                          <div key={sub.id} className="bg-gray-900 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="bg-green-900/30 text-green-400 px-2 py-1 text-xs font-medium rounded-full">
                                Active
                              </span>
                              <span className="text-gray-400">₹{sub.amount}</span>
                            </div>
                            <p className="text-sm text-gray-400">Start: {new Date(sub.startDate).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-400">End: {new Date(sub.endDate).toLocaleDateString()}</p>
                            <div className="mt-3">
                              <p className="text-sm font-semibold text-white mb-2">Tools Included:</p>
                              {sub.tools && sub.tools.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {sub.tools.map((tool, index) => {
                                    // Handle both string format and object format
                                    const toolId = typeof tool === 'object' ? tool.id : tool;
                                    const toolStatus = typeof tool === 'object' ? tool.status : 'active';
                                    
                                    // Find the tool details if available
                                    const toolInfo = AVAILABLE_TOOLS.find(t => t.id === toolId);
                                    const toolPayment = payments.find(p => p.toolId === toolId && p.userId === showUserDetails);
                                    
                                    return (
                                      <div 
                                        key={index}
                                        className="bg-gray-800 p-2 rounded-lg flex flex-col"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm text-white">
                                            {toolInfo ? toolInfo.name : toolId}
                                          </span>
                                          <span className={`text-xs px-2 py-1 rounded-full ${
                                            toolStatus === 'active' 
                                              ? 'bg-green-900/30 text-green-400'
                                              : 'bg-red-900/30 text-red-400'
                                          }`}>
                                            {toolStatus}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                          <div>
                                            {toolPayment && (
                                              <div className="text-xs text-gray-500">
                                                Added: {new Date(toolPayment.createdAt).toLocaleDateString()}
                                              </div>
                                            )}
                                            <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded-full">
                                              ₹{toolInfo ? toolInfo.price : '??'}
                                            </span>
                                          </div>
                                          
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => toggleToolStatus(
                                                showUserDetails as string,
                                                sub.id,
                                                toolId,
                                                toolStatus
                                              )}
                                              className={`text-xs px-2 py-1 rounded ${
                                                toolStatus === 'active'
                                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                                  : 'bg-green-600 text-white hover:bg-green-700'
                                              }`}
                                            >
                                              {toolStatus === 'active' ? 'Suspend Tool' : 'Activate Tool'}
                                            </button>
                                            <button
                                              onClick={() => deleteToolFromUser(
                                                showUserDetails as string,
                                                sub.id,
                                                toolId
                                              )}
                                              className="text-xs px-2 py-1 rounded bg-red-800 text-white hover:bg-red-900"
                                              title="Delete Tool Access"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No specific tools registered</p>
                              )}
                            </div>
                            <div className="mt-3 flex justify-between">
                              <button
                                onClick={() => {
                                  setSelectedUserId(showUserDetails);
                                  setShowAssignTool(true);
                                }}
                                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                              >
                                Add Tool
                              </button>
                              <button
                                onClick={() => handleSubscriptionUpdate(showUserDetails as string, 'suspended')}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                              >
                                Suspend Subscription
                              </button>
                            </div>
                          </div>
                        ))}
                      {!subscriptions.some(sub => sub.userId === showUserDetails && sub.status === 'active') && (
                        <div className="bg-gray-900 rounded-lg p-4 text-center">
                          <p className="text-gray-400">No active subscriptions</p>
                          <button
                            onClick={() => handleSubscriptionUpdate(showUserDetails as string, 'active')}
                            className="mt-3 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            Activate Subscription
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Subscription History</h3>
                    <div className="space-y-3">
                      {subscriptions
                        .filter(sub => sub.userId === showUserDetails)
                        .map(sub => (
                          <div key={sub.id} className="bg-gray-900 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                sub.status === 'active'
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-red-900/30 text-red-400'
                              }`}>
                                {sub.status}
                              </span>
                              <span className="text-gray-400">₹{sub.amount}</span>
                            </div>
                            <p className="text-sm text-gray-400">Start: {new Date(sub.startDate).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-400">End: {new Date(sub.endDate).toLocaleDateString()}</p>
                          </div>
                        ))}
                      {subscriptions.filter(sub => sub.userId === showUserDetails).length === 0 && (
                        <div className="bg-gray-900 rounded-lg p-4 text-center">
                          <p className="text-gray-400">No subscription history</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Payment History</h3>
                    <div className="space-y-3">
                      {payments
                        .filter(payment => payment.userId === showUserDetails)
                        .map(payment => (
                          <div key={payment.id} className="bg-gray-900 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                payment.status === 'completed'
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-yellow-900/30 text-yellow-400'
                              }`}>
                                {payment.status}
                              </span>
                              <span className="text-gray-400">₹{payment.amount}</span>
                            </div>
                            <p className="text-sm text-gray-400">Date: {new Date(payment.createdAt).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-400">Method: {payment.paymentMethod}</p>
                            {payment.toolId && (
                              <p className="text-sm text-gray-400">Tool: {payment.toolId}</p>
                            )}
                          </div>
                        ))}
                      {payments.filter(payment => payment.userId === showUserDetails).length === 0 && (
                        <div className="bg-gray-900 rounded-lg p-4 text-center">
                          <p className="text-gray-400">No payment history</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedUserId(showUserDetails);
                        setShowAssignTool(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Assign Tool
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUserId(showUserDetails);
                        setShowChangePassword(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Change Password
                    </button>
                    <button
                      onClick={() => handleToggleAccountAccess(
                        showUserDetails, 
                        !!users.find(u => u.id === showUserDetails)?.disabled
                      )}
                      className={`px-4 py-2 ${
                        users.find(u => u.id === showUserDetails)?.disabled
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white rounded-lg transition-colors`}
                    >
                      {users.find(u => u.id === showUserDetails)?.disabled
                        ? 'Enable Account'
                        : 'Disable Account'
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assign Tool Modal */}
        {showAssignTool && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">Assign Tool to User</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedUserId && newTool.name) {
                  assignToolToUser(selectedUserId, newTool.name, newTool.price);
                  setShowAssignTool(false);
                  setNewTool({ name: '', price: 133 });
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tool Name</label>
                  <select
                    value={newTool.name}
                    onChange={(e) => {
                      const selectedTool = AVAILABLE_TOOLS.find(tool => tool.id === e.target.value);
                      setNewTool({ 
                        name: e.target.value, 
                        price: selectedTool ? selectedTool.price : 133 
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  >
                    <option value="">Select a tool</option>
                    {AVAILABLE_TOOLS.map(tool => (
                      <option key={tool.id} value={tool.id}>
                        {tool.name} (₹{tool.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newTool.price}
                    onChange={(e) => setNewTool({ ...newTool, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default price is auto-filled based on selected tool</p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignTool(false);
                      setNewTool({ name: '', price: 133 });
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Assign Tool
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
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
                  onClick={() => {
                    setShowChangePassword(false);
                    setSelectedUserId(null);
                    setNewPassword('');
                  }}
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
    </div>
  );
};

export default Admin;
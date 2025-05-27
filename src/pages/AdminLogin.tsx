import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { ref, get, set } from 'firebase/database';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('aryansingh2611@outlook.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // For simplicity, directly check credentials since we know what they should be
      if (email === 'aryansingh2611@outlook.com' && password === 'Max@8009') {
        // Create admin user in database if it doesn't exist
        const adminRef = ref(db, 'users/admin');
        const snapshot = await get(adminRef);
        
        if (!snapshot.exists()) {
          await set(adminRef, {
            email: 'aryansingh2611@outlook.com',
            name: 'Admin',
            isAdmin: true,
            createdAt: new Date().toISOString(),
          });
        }
        
        // Store admin session in sessionStorage - this is separate from our security system
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminEmail', email);
        showToast('Successfully logged in as admin', 'success');
        navigate('/admin');
      } else {
        setError('Invalid credentials');
        showToast('Invalid credentials', 'error');
      }
    } catch (error) {
      console.error('Error logging in as admin:', error);
      setError('Something went wrong. Please try again.');
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-indigo-300">Sign in to access admin dashboard</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-900/70 text-white w-full pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-900/70 text-white w-full pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            {error && (
              <div className="py-2 px-3 bg-red-900/30 border border-red-800 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
            >
              {isLoading ? 'Logging in...' : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
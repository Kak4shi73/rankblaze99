import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Key, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { setupAdminAuth, adminLogin, checkAdminStatus, isCurrentUserAdmin } from '../utils/adminAuth';
import { useToast } from '../context/ToastContext';

const AdminSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState('');
  const [adminStatus, setAdminStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const steps = [
    'Initializing admin user',
    'Setting up authentication',
    'Configuring custom claims',
    'Verifying admin privileges',
    'Setup complete'
  ];

  const handleSetupAdmin = async () => {
    setIsLoading(true);
    setCurrentStep(0);
    setSetupStatus('Starting admin setup...');

    try {
      // Step 1: Initialize admin
      setCurrentStep(1);
      setSetupStatus('Initializing admin user...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual delay

      // Step 2: Setup authentication
      setCurrentStep(2);
      setSetupStatus('Setting up authentication...');
      const result = await setupAdminAuth();
      
      // Step 3: Verify setup
      setCurrentStep(3);
      setSetupStatus('Verifying admin privileges...');
      const status = await checkAdminStatus();
      setAdminStatus(status);
      
      // Step 4: Complete
      setCurrentStep(4);
      setSetupStatus('Setup completed successfully!');
      
      showToast('Admin authentication setup completed successfully!', 'success');
      
      // Redirect to admin panel after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
      
    } catch (error) {
      console.error('Setup failed:', error);
      setSetupStatus(`Setup failed: ${error.message}`);
      showToast(`Setup failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setSetupStatus('Logging in as admin...');

    try {
      const result = await adminLogin();
      const isAdmin = await isCurrentUserAdmin();
      
      if (isAdmin) {
        showToast('Admin login successful!', 'success');
        navigate('/admin');
      } else {
        throw new Error('Admin privileges not found. Please run setup first.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setSetupStatus(`Login failed: ${error.message}`);
      showToast(`Login failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsLoading(true);
    setSetupStatus('Checking admin status...');

    try {
      const status = await checkAdminStatus();
      setAdminStatus(status);
      setSetupStatus('Status check completed');
      showToast('Admin status checked successfully', 'success');
    } catch (error) {
      console.error('Status check failed:', error);
      setSetupStatus(`Status check failed: ${error.message}`);
      showToast(`Status check failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Authentication Setup</h1>
          <p className="text-gray-300">Initialize admin user with custom claims for Firestore access</p>
        </div>

        {/* Setup Progress */}
        {isLoading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-300">Setup Progress</span>
              <span className="text-sm text-purple-400">{currentStep}/{steps.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              ></div>
            </div>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className={`flex items-center space-x-3 ${
                  index < currentStep ? 'text-green-400' : 
                  index === currentStep ? 'text-purple-400' : 'text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : index === currentStep ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                  )}
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Display */}
        {setupStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            setupStatus.includes('failed') || setupStatus.includes('error') 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : setupStatus.includes('completed') || setupStatus.includes('successful')
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
            <div className="flex items-center space-x-2">
              {setupStatus.includes('failed') || setupStatus.includes('error') ? (
                <AlertCircle className="w-5 h-5" />
              ) : setupStatus.includes('completed') || setupStatus.includes('successful') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Loader className="w-5 h-5 animate-spin" />
              )}
              <span>{setupStatus}</span>
            </div>
          </div>
        )}

        {/* Admin Status Display */}
        {adminStatus && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Admin Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">User ID:</span>
                <span className="text-white font-mono">{adminStatus.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{adminStatus.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Admin Status:</span>
                <span className={`font-semibold ${adminStatus.isAdmin ? 'text-green-400' : 'text-red-400'}`}>
                  {adminStatus.isAdmin ? 'Admin' : 'Not Admin'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="text-white">{adminStatus.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Firestore Admin:</span>
                <span className={`font-semibold ${adminStatus.isAdminInFirestore ? 'text-green-400' : 'text-red-400'}`}>
                  {adminStatus.isAdminInFirestore ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleSetupAdmin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Setting up...' : 'Setup Admin Authentication'}</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleQuickLogin}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Quick Login</span>
            </button>

            <button
              onClick={handleCheckStatus}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Check Status</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h4 className="text-yellow-400 font-semibold mb-2">Instructions:</h4>
          <ul className="text-yellow-300 text-sm space-y-1">
            <li>1. Click "Setup Admin Authentication" to initialize admin user</li>
            <li>2. This will create admin user with custom claims in Firebase</li>
            <li>3. Use "Quick Login" if admin is already set up</li>
            <li>4. Use "Check Status" to verify current admin privileges</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup; 
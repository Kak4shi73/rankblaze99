import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  // Extract redirect URL from query parameters if present
  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      // The default navigation to /dashboard is in the AuthContext
      // We need to override it with our redirect
      navigate(redirectUrl);
    } catch (error: any) {
      showToast(error.message || 'Invalid email or password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // The default navigation to /dashboard is in the AuthContext
      // We need to override it with our redirect
      navigate(redirectUrl);
    } catch (error: any) {
      // Error is handled in the context
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Password reset link sent to your email', 'success');
      setIsForgotPassword(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to send reset link', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
            </h1>
            <p className="text-indigo-300">
              {isForgotPassword 
                ? 'Enter your email to receive a reset link'
                : 'Sign in to your RANKBLAZE account'}
            </p>
          </div>
          
          {!isForgotPassword && (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-white text-gray-900 font-medium mb-6 hover:bg-gray-100 transition-colors"
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="w-5 h-5 mr-2"
              />
              Continue with Google
            </button>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>
          
          <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-indigo-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-indigo-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-indigo-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-indigo-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {!isForgotPassword && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-indigo-300">
                    Remember me
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                isLoading 
                  ? 'bg-indigo-800 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30'
              }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isForgotPassword ? 'Send Reset Link' : 'Sign In'} <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            {isForgotPassword ? (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                Back to login
              </button>
            ) : (
              <p className="text-indigo-300">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-amber-400 hover:text-amber-300 transition-colors">
                  Sign up
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
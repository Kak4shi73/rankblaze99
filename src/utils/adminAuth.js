import { auth, functions } from '../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

// Initialize admin functions
const initializeAdminFunction = httpsCallable(functions, 'initializeAdmin');
const setAdminClaimsFunction = httpsCallable(functions, 'setAdminClaims');
const checkAdminStatusFunction = httpsCallable(functions, 'checkAdminStatus');
const refreshUserTokenFunction = httpsCallable(functions, 'refreshUserToken');

// Admin credentials
const ADMIN_EMAIL = 'aryansingh2611@outlook.com';
const ADMIN_PASSWORD = 'Max@8009';

/**
 * Initialize admin user with custom claims
 */
export const initializeAdmin = async () => {
  try {
    console.log('🔧 Initializing admin user...');
    const result = await initializeAdminFunction();
    console.log('✅ Admin initialized:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    throw error;
  }
};

/**
 * Set admin custom claims for a user
 */
export const setAdminClaims = async (email, makeAdmin = true) => {
  try {
    console.log(`🔧 Setting admin claims for ${email}...`);
    const result = await setAdminClaimsFunction({ email, makeAdmin });
    console.log('✅ Admin claims set:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error setting admin claims:', error);
    throw error;
  }
};

/**
 * Check current user's admin status
 */
export const checkAdminStatus = async () => {
  try {
    const result = await checkAdminStatusFunction();
    console.log('📋 Admin status:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    throw error;
  }
};

/**
 * Refresh user token to get updated custom claims
 */
export const refreshUserToken = async () => {
  try {
    console.log('🔄 Refreshing user token...');
    const result = await refreshUserTokenFunction();
    console.log('✅ Token refreshed:', result.data);
    
    // Force token refresh by signing out and back in
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.getIdToken(true); // Force refresh
    }
    
    return result.data;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    throw error;
  }
};

/**
 * Admin login with automatic setup
 */
export const adminLogin = async (email = ADMIN_EMAIL, password = ADMIN_PASSWORD) => {
  try {
    console.log('🔐 Admin login started...');
    
    // Step 1: Initialize admin if needed
    try {
      await initializeAdmin();
    } catch (error) {
      console.log('Admin already exists or initialization failed:', error.message);
    }
    
    // Step 2: Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Firebase Auth login successful:', user.uid);
    
    // Step 3: Set admin claims
    try {
      await setAdminClaims(email, true);
    } catch (error) {
      console.log('Admin claims already set or error:', error.message);
    }
    
    // Step 4: Refresh token to get updated claims
    await refreshUserToken();
    
    // Step 5: Verify admin status
    const adminStatus = await checkAdminStatus();
    
    if (!adminStatus.isAdmin) {
      throw new Error('Failed to set admin privileges');
    }
    
    console.log('✅ Admin login completed successfully');
    return {
      success: true,
      user,
      adminStatus
    };
    
  } catch (error) {
    console.error('❌ Admin login failed:', error);
    throw error;
  }
};

/**
 * Check if current user has admin privileges
 */
export const isCurrentUserAdmin = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }
    
    // Get fresh token to check claims
    const idTokenResult = await user.getIdTokenResult(true);
    const isAdmin = idTokenResult.claims.admin === true;
    
    console.log('🔍 Current user admin status:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('❌ Error checking current user admin status:', error);
    return false;
  }
};

/**
 * Admin logout
 */
export const adminLogout = async () => {
  try {
    await signOut(auth);
    console.log('✅ Admin logged out successfully');
  } catch (error) {
    console.error('❌ Error during admin logout:', error);
    throw error;
  }
};

/**
 * Setup admin authentication (one-time setup)
 */
export const setupAdminAuth = async () => {
  try {
    console.log('🚀 Setting up admin authentication...');
    
    // Step 1: Initialize admin user
    const initResult = await initializeAdmin();
    console.log('✅ Step 1: Admin user initialized');
    
    // Step 2: Login as admin
    const loginResult = await adminLogin();
    console.log('✅ Step 2: Admin login successful');
    
    // Step 3: Verify everything is working
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      throw new Error('Admin setup verification failed');
    }
    
    console.log('🎉 Admin authentication setup completed successfully!');
    return {
      success: true,
      message: 'Admin authentication setup completed',
      adminStatus: loginResult.adminStatus
    };
    
  } catch (error) {
    console.error('❌ Admin authentication setup failed:', error);
    throw error;
  }
};

// Export all functions
export default {
  initializeAdmin,
  setAdminClaims,
  checkAdminStatus,
  refreshUserToken,
  adminLogin,
  isCurrentUserAdmin,
  adminLogout,
  setupAdminAuth
}; 
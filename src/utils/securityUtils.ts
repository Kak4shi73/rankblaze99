// securityUtils.ts - Simplified authentication without session sharing protection
import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

/**
 * Check if user is an admin
 */
export const isAdminUser = async (userId: string | null): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // First check if this is the main admin
    if (userId === 'admin') return true;
    
    // Then check if user has admin role in the database
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.isAdmin === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Store session information - simplified to be a no-op that always succeeds
 */
export const storeSessionInfo = async (userId: string): Promise<string> => {
  console.log('Session storage disabled');
  return 'session-disabled';
};

/**
 * Validate session - simplified to always return true
 */
export const validateSession = async (userId: string | null): Promise<boolean> => {
  console.log('Session validation disabled - always returns true');
  return true;
};

/**
 * Clears all session data on logout - simplified
 */
export const clearSessionData = async (userId: string | null): Promise<void> => {
  console.log('Session clearing disabled');
  return;
};

/**
 * Sets up a session monitor - no-op
 */
export const setupSessionMonitor = (userId: string | null, logoutCallback: () => void): (() => void) => {
  return () => {};
}; 
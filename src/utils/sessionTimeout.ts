/**
 * Session Timeout Manager
 * Handles automatic logout after session duration expires
 */

import { auth } from '../config/firebase';

// Configuration
const SESSION_DURATION = 3600 * 1000; // 1 hour in milliseconds
const LOCAL_STORAGE_LOGIN_TIME = 'userLoginTime';

// Types
type TimeoutCallbacks = {
  onTimeout: () => Promise<void>;
  onWarning?: (remainingTime: number) => void;
};

let logoutTimer: NodeJS.Timeout | null = null;

/**
 * Initializes session timeout tracking
 */
export const initSessionTimeout = (callbacks: TimeoutCallbacks): (() => void) => {
  console.log('Session timeout initialized - 1 hour limit after login');
  
  // Set login time to current time or retrieve from localStorage
  const loginTime = localStorage.getItem(LOCAL_STORAGE_LOGIN_TIME) || Date.now().toString();
  localStorage.setItem(LOCAL_STORAGE_LOGIN_TIME, loginTime);
  
  // Calculate remaining time if user refreshes page
  const elapsedTime = Date.now() - parseInt(loginTime);
  const remainingTime = Math.max(0, SESSION_DURATION - elapsedTime);
  
  // If session time is already expired, logout immediately
  if (remainingTime <= 0) {
    callbacks.onTimeout();
    return () => {}; // Return empty cleanup function
  } 
  
  // Set timer for remaining time
  logoutTimer = setTimeout(() => {
    callbacks.onTimeout();
  }, remainingTime);
  
  // Show countdown in console
  const remainingMinutes = Math.ceil(remainingTime/60000);
  console.log(`Session will expire in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
  
  // Trigger warning callback with remaining time
  if (callbacks.onWarning) {
    callbacks.onWarning(remainingTime);
  }
  
  // Return cleanup function
  return () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      logoutTimer = null;
    }
  };
};

/**
 * Clears session data
 */
export const clearSessionData = (): void => {
  // Clear cookies
  const cookies = document.cookie.split(";");
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
  
  // Clear login time
  localStorage.removeItem(LOCAL_STORAGE_LOGIN_TIME);
  
  console.log('Session data cleared');
};

/**
 * Reset the session timer (use when user activity is detected)
 */
export const resetSession = (): void => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
  localStorage.setItem(LOCAL_STORAGE_LOGIN_TIME, Date.now().toString());
  console.log('Session timer reset');
};

/**
 * Force logout the user
 */
export const forceLogout = async (): Promise<void> => {
  clearSessionData();
  
  try {
    await auth.signOut();
    console.log('User logged out due to session timeout');
  } catch (error) {
    console.error('Error during forced logout:', error);
  }
}; 
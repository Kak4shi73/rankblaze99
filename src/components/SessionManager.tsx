import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { initSessionTimeout, resetSession, forceLogout } from '../utils/sessionTimeout';
import SessionCountdown from './SessionCountdown';
import SessionTimeoutWarning from './SessionTimeoutWarning';

const WARNING_THRESHOLD = 60; // Show warning 60 seconds before timeout
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

const SessionManager: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showSessionTimer, setShowSessionTimer] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [warningCountdown, setWarningCountdown] = useState(WARNING_THRESHOLD);

  // Handle user activity to reset the session timer
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserActivity = () => {
      // Only reset the session if not already in warning state
      if (!showWarning) {
        resetSession();
        // Re-initialize the timeout after reset
        initTimeout();
      }
    };

    // Add event listeners for user activity
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      // Clean up event listeners
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, showWarning]);

  // Initialize timeout tracking
  const initTimeout = () => {
    const cleanup = initSessionTimeout({
      onTimeout: async () => {
        await performLogout();
      },
      onWarning: (time) => {
        setRemainingTime(time);
        setShowSessionTimer(true);
        
        // Calculate when to show warning (WARNING_THRESHOLD seconds before timeout)
        if (time <= WARNING_THRESHOLD * 1000) {
          setShowWarning(true);
          setWarningCountdown(Math.floor(time / 1000));
        } else {
          // Schedule showing the warning at the appropriate time
          const warningTime = time - (WARNING_THRESHOLD * 1000);
          setTimeout(() => {
            setShowWarning(true);
            setWarningCountdown(WARNING_THRESHOLD);
          }, warningTime);
        }
      }
    });
    
    return cleanup;
  };

  // Initialize session timeout when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setShowSessionTimer(false);
      setShowWarning(false);
      return;
    }
    
    const cleanup = initTimeout();
    
    return () => {
      cleanup();
    };
  }, [isAuthenticated]);

  // Handle session extension when user clicks to continue
  const handleExtendSession = () => {
    setShowWarning(false);
    resetSession();
    initTimeout();
  };

  // Handle logout process
  const performLogout = async () => {
    setShowWarning(false);
    
    try {
      // First clear session data and cookies
      await forceLogout();
      // Then use application's logout function
      await logout();
    } catch (error) {
      console.error('Error during session timeout logout:', error);
      // Force a page reload as fallback
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Show countdown only if authenticated and showSessionTimer is true */}
      {isAuthenticated && showSessionTimer && (
        <SessionCountdown
          remainingTime={remainingTime}
          onTimeout={performLogout}
        />
      )}
      
      {/* Show warning modal */}
      {isAuthenticated && (
        <SessionTimeoutWarning
          showWarning={showWarning}
          remainingSeconds={warningCountdown}
          onExtendSession={handleExtendSession}
          onLogout={performLogout}
        />
      )}
    </>
  );
};

export default SessionManager; 
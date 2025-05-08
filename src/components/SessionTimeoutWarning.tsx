import React, { useState, useEffect } from 'react';

interface SessionTimeoutWarningProps {
  showWarning: boolean;
  remainingSeconds: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  showWarning,
  remainingSeconds,
  onExtendSession,
  onLogout
}) => {
  const [countdown, setCountdown] = useState(remainingSeconds);

  useEffect(() => {
    setCountdown(remainingSeconds);
    
    if (showWarning && remainingSeconds > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [showWarning, remainingSeconds]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Session Timeout Warning</h3>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-3">
            <p className="font-bold">Your session is about to expire!</p>
            <p>You will be logged out in {countdown} seconds due to inactivity.</p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Would you like to extend your session?
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onExtendSession}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Yes, Keep Me Signed In
            </button>
            <button
              onClick={onLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning; 
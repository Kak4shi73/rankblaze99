import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SessionDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{[key: string]: any}>({});
  const { user } = useAuth();
  
  // Check if debugging is enabled (via localStorage or URL parameter)
  useEffect(() => {
    const debugParam = new URLSearchParams(window.location.search).get('debug');
    const debugEnabled = localStorage.getItem('debug_mode') === 'true' || debugParam === 'true';
    setIsVisible(debugEnabled);
    
    if (debugEnabled) {
      console.log('🔍 Session debugger is active');
    }
  }, []);
  
  // Collect debug information
  useEffect(() => {
    if (!isVisible) return;
    
    const collectDebugInfo = () => {
      const info: {[key: string]: any} = {
        user: user ? { 
          id: user.id, 
          email: user.email,
          name: user.name
        } : null,
        sessionToken: localStorage.getItem('sessionToken'),
        deviceFingerprint: localStorage.getItem('deviceFingerprint'),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        storageItems: {}
      };
      
      // Get all localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            info.storageItems[key] = localStorage.getItem(key);
          } catch (e) {
            info.storageItems[key] = 'Error reading item';
          }
        }
      }
      
      setDebugInfo(info);
    };
    
    collectDebugInfo();
    const interval = setInterval(collectDebugInfo, 5000);
    
    return () => clearInterval(interval);
  }, [isVisible, user]);
  
  // Don't render anything if debugging is not enabled
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 z-50 p-4 bg-gray-900 text-white text-xs w-full md:w-auto rounded-tr-lg opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Session Debugger</h3>
        <button 
          onClick={() => {
            localStorage.removeItem('debug_mode');
            setIsVisible(false);
          }}
          className="text-red-400 hover:text-red-300"
        >
          Close
        </button>
      </div>
      
      <div className="overflow-auto max-h-60">
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
      
      <div className="border-t border-gray-700 mt-2 pt-2 flex gap-2">
        <button 
          onClick={() => {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('deviceFingerprint');
            window.location.reload();
          }}
          className="bg-red-800 hover:bg-red-700 rounded px-2 py-1 text-xs"
        >
          Clear Session
        </button>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(debugInfo));
          }}
          className="bg-blue-800 hover:bg-blue-700 rounded px-2 py-1 text-xs"
        >
          Copy Debug Info
        </button>
      </div>
    </div>
  );
};

export default SessionDebugger; 
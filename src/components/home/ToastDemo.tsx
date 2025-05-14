import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Demo component with buttons to manually trigger different toast types
 * Only visible in development mode
 */
const ToastDemo = () => {
  const { isAuthenticated, login, logout } = useAuth();
  const { showToast } = useToast();
  
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-20 right-5 z-50 bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-700 max-w-xs">
      <h3 className="text-white font-bold mb-3">Toast Testing Panel</h3>
      <div className="space-y-2">
        <button
          onClick={() => showToast('🚫 Please sign in to use this tool.', 'warning')}
          className="w-full px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
        >
          Sign-in Reminder
        </button>
        
        <button
          onClick={() => {
            const indianNames = ["Aarav", "Priya", "Rohan", "Neha", "Kabir"];
            const tools = ["ChatGPT Plus", "Canva Pro", "SEMrush", "Envato Elements"];
            const name = indianNames[Math.floor(Math.random() * indianNames.length)];
            const tool = tools[Math.floor(Math.random() * tools.length)];
            showToast(`🛒 ${name} just bought ${tool}!`, 'info');
          }}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Fake Purchase
        </button>
        
        <button
          onClick={() => showToast('🎉 Congratulations! You\'ve successfully logged in.', 'success')}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Login Success
        </button>
        
        <button
          onClick={() => {
            if (isAuthenticated) {
              logout();
            } else {
              // Just a demo - real login would require credentials
              showToast('This is a demo. Real login requires credentials.', 'error');
            }
          }}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          {isAuthenticated ? 'Logout' : 'Login (Demo)'}
        </button>
      </div>
    </div>
  );
};

export default ToastDemo; 
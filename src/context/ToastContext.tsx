import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate a unique toast ID
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }, []);

  // Add a new toast
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateId();
    
    // Check if this exact message already exists
    const duplicateIndex = toasts.findIndex(toast => toast.message === message && toast.type === type);
    
    if (duplicateIndex >= 0) {
      // Update the existing toast with a new timestamp to reset its timer
      setToasts(prev => 
        prev.map((toast, index) => 
          index === duplicateIndex 
            ? { ...toast, createdAt: Date.now() } 
            : toast
        )
      );
    } else {
      // Add new toast
      setToasts((prevToasts) => [
        ...prevToasts, 
        { id, message, type, createdAt: Date.now() }
      ]);
    }
  }, [toasts, generateId]);

  // Remove a specific toast
  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Auto-remove toasts after a delay
  useEffect(() => {
    if (toasts.length === 0) return;

    const now = Date.now();
    const timeouts = toasts.map(toast => {
      const timeElapsed = now - toast.createdAt;
      const remainingTime = Math.max(4000 - timeElapsed, 0);
      
      return setTimeout(() => {
        removeToast(toast.id);
      }, remainingTime);
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, clearAllToasts }}>
      {children}
      
      {/* Toast Container */}
      <div 
        className="fixed bottom-6 right-6 z-50 flex flex-col space-y-4 w-full max-w-sm"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`transform transition-all duration-300 ease-in-out flex items-center p-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-900 text-green-100 border-l-4 border-green-500' :
              toast.type === 'error' ? 'bg-red-900 text-red-100 border-l-4 border-red-500' :
              toast.type === 'warning' ? 'bg-amber-900 text-amber-100 border-l-4 border-amber-500' :
              'bg-indigo-900 text-indigo-100 border-l-4 border-indigo-500'
            }`}
            role="alert"
          >
            <div className="flex-1 mr-2">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
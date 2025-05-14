import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface CustomToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'warning';
}

const CustomToast = ({ 
  message, 
  onClose, 
  duration = 4000,
  type = 'info'
}: CustomToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete before removing
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Gradient and styles based on type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'from-emerald-800 to-green-900 border-l-4 border-emerald-500';
      case 'error':
        return 'from-red-800 to-rose-900 border-l-4 border-red-500';
      case 'warning':
        return 'from-amber-800 to-orange-900 border-l-4 border-amber-500';
      case 'info':
      default:
        return 'from-purple-800 to-indigo-600 border-l-4 border-purple-500';
    }
  };

  return (
    <div 
      className={`fixed bottom-5 right-5 bg-gradient-to-r ${getToastStyles()} text-white font-medium p-4 px-6 rounded-xl shadow-xl z-50 animate-slide-in max-w-xs transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-center justify-between">
        <div dangerouslySetInnerHTML={{ __html: message }} />
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-4 text-white/70 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CustomToast; 
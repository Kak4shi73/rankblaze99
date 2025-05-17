import { ReactNode, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { clearAllToasts } = useToast();
  const location = useLocation();
  
  // Clear any toast notifications when the route changes
  useEffect(() => {
    clearAllToasts();
  }, [location.pathname, clearAllToasts]);

  return (
    <div className="min-h-screen w-full max-w-screen flex flex-col overflow-x-hidden">
      {children}
    </div>
  );
};

export default MainLayout; 
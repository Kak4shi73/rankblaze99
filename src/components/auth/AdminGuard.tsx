import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { db } from '../../config/firebase';
import { ref, get } from 'firebase/database';

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Check if admin is logged in via session storage
      const adminAuth = sessionStorage.getItem('adminAuth');
      
      if (!adminAuth) {
        setIsAdmin(false);
        return;
      }

      try {
        // Get admin user from Realtime Database - using the new path
        const adminRef = ref(db, 'users/admin');
        const snapshot = await get(adminRef);
        
        if (snapshot.exists()) {
          const adminData = snapshot.val();
          setIsAdmin(adminData.isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  return <>{children}</>;
};

export default AdminGuard;
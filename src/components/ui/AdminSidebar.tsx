import { useNavigate, useLocation } from 'react-router-dom';
import { Users, CreditCard, Key } from 'lucide-react';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  // Define sidebar items
  const sidebarItems = [
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Users',
      path: '/admin',
      active: location.pathname === '/admin'
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Update Tokens',
      path: '/admin/update-tokens',
      active: location.pathname === '/admin/update-tokens'
    }
  ];

  return (
    <div className="h-full min-h-screen bg-gray-900 w-64 border-r border-gray-800 fixed left-0 top-0 pt-20">
      <div className="p-4">
        <h2 className="text-xl font-bold text-white mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          
          {/* Logout button at the bottom */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors mt-6"
          >
            <Key className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar; 
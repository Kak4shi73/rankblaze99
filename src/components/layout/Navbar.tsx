import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogIn } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';
import LiveUserCounter from '../ui/LiveUserCounter';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { cartItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Tools', path: '/tools' },
    { name: 'About', path: '/about' },
    { name: 'Reviews', path: '/reviews' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-midnight-950/95 backdrop-blur-md py-3 shadow-md shadow-gold-900/10' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <Logo className="h-8 w-8" />
          <span className="ml-2 text-xl font-playfair font-bold text-platinum-100">RANKBLAZE</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <ul className="flex space-x-8">
            {navItems.map((item) => (
              <li key={item.name}>
                {item.name === 'About' ? (
                  <a
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-base font-montserrat transition-colors hover:text-gold-400 ${
                      location.pathname === item.path ? 'text-gold-400' : 'text-platinum-100'
                    }`}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    to={item.path}
                    className={`text-base font-montserrat transition-colors hover:text-gold-400 ${
                      location.pathname === item.path ? 'text-gold-400' : 'text-platinum-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          
          <div className="flex items-center space-x-4 border-l border-platinum-700 pl-6">
            <LiveUserCounter />
            <Link 
              to="/cart" 
              className="relative p-2 text-platinum-300 hover:text-gold-400 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-midnight-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <div className="relative group">
                <button 
                  className="p-2 text-platinum-300 hover:text-gold-400 transition-colors flex items-center"
                >
                  <User className="h-6 w-6" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-midnight-800 border border-platinum-700 rounded-lg shadow-luxury opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                  <div className="py-2 px-4 border-b border-platinum-700">
                    <p className="font-medium text-platinum-100">{user?.name || 'User'}</p>
                    <p className="text-sm text-platinum-400 truncate" title={user?.email || 'user@example.com'}>{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-platinum-300 hover:bg-midnight-700 hover:text-platinum-100 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-platinum-300 hover:bg-midnight-700 hover:text-platinum-100 transition-colors">
                      Settings
                    </Link>
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-platinum-300 hover:bg-midnight-700 hover:text-platinum-100 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="px-5 py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 font-medium text-sm transition-all duration-300 hover:shadow-luxury flex items-center"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Link>
            )}
          </div>
        </nav>
        
        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-platinum-300 hover:text-platinum-100 transition-colors"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      <div 
        className={`fixed inset-y-0 right-0 transform md:hidden w-full max-w-xs bg-midnight-900 overflow-y-auto transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center">
              <Logo className="h-8 w-8" />
              <span className="ml-2 text-xl font-playfair font-bold text-platinum-100">RANKBLAZE</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="text-platinum-300 hover:text-platinum-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="space-y-6">
            <div className="flex justify-center">
              <LiveUserCounter />
            </div>
            
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.name}>
                  {item.name === 'About' ? (
                    <a
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-lg font-montserrat transition-colors hover:text-gold-400 ${
                        location.pathname === item.path ? 'text-gold-400' : 'text-platinum-100'
                      }`}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      className={`block text-lg font-montserrat transition-colors hover:text-gold-400 ${
                        location.pathname === item.path ? 'text-gold-400' : 'text-platinum-100'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            
            <div className="pt-6 border-t border-platinum-700">
              {isAuthenticated ? (
                <>
                  <div className="mb-4">
                    <p className="font-medium text-platinum-100">{user?.name || 'User'}</p>
                    <p className="text-sm text-platinum-400 truncate" title={user?.email || 'user@example.com'}>{user?.email || 'user@example.com'}</p>
                  </div>
                  <Link 
                    to="/dashboard" 
                    className="block py-2 text-base text-platinum-300 hover:text-gold-400 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/settings" 
                    className="block py-2 text-base text-platinum-300 hover:text-gold-400 transition-colors"
                  >
                    Settings
                  </Link>
                  <button 
                    onClick={logout}
                    className="block py-2 text-base text-platinum-300 hover:text-gold-400 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="block w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 font-medium text-center transition-all duration-300 hover:shadow-luxury"
                >
                  Sign In
                </Link>
              )}
            </div>
            
            <div className="pt-6 border-t border-platinum-700">
              <Link 
                to="/cart" 
                className="flex items-center justify-between py-3 text-platinum-300 hover:text-gold-400 transition-colors"
              >
                <span className="text-lg">Cart</span>
                <div className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gold-500 text-midnight-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </nav>
        </div>
      </div>
      
      {/* Overlay for mobile menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-midnight-950/50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Navbar;
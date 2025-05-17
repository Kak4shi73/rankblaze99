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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Tools', path: '/tools' },
    { name: 'About', path: '/about' },
    { name: 'Reviews', path: '/reviews' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full ${
        scrolled 
          ? 'bg-midnight-950/95 backdrop-blur-md py-2 sm:py-3 shadow-md shadow-gold-900/10' 
          : 'bg-transparent py-3 sm:py-5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <Logo className="h-6 w-6 sm:h-8 sm:w-8" />
          <span className="ml-2 text-lg sm:text-xl font-playfair font-bold text-platinum-100">RANKBLAZE</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
          <ul className="flex space-x-4 lg:space-x-8">
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
          
          <div className="flex items-center space-x-3 lg:space-x-4 border-l border-platinum-700 pl-4 lg:pl-6">
            <LiveUserCounter />
            <Link 
              to="/cart" 
              className="relative p-2 text-platinum-300 hover:text-gold-400 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
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
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
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
                className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 font-medium text-sm transition-all duration-300 hover:shadow-luxury flex items-center"
              >
                <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Sign In
              </Link>
            )}
          </div>
        </nav>
        
        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-platinum-300 hover:text-platinum-100 transition-colors p-1.5"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      <div 
        className={`fixed inset-0 bg-midnight-900/95 backdrop-blur-sm md:hidden transition-opacity duration-300 ease-in-out z-50 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-4 sm:p-6 flex items-center justify-between">
            <Link to="/" className="flex items-center" onClick={() => setIsOpen(false)}>
              <Logo className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="ml-2 text-xl font-playfair font-bold text-platinum-100">RANKBLAZE</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="text-platinum-300 hover:text-platinum-100 transition-colors p-1.5"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-grow flex flex-col justify-between p-4 sm:p-6">
            <div className="space-y-6">
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
                        className={`block text-lg font-montserrat transition-colors hover:text-gold-400 text-center ${
                          location.pathname === item.path ? 'text-gold-400' : 'text-platinum-100'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        to={item.path}
                        className={`block text-lg font-montserrat transition-colors hover:text-gold-400 text-center ${
                          location.pathname === item.path ? 'text-gold-400' : 'text-platinum-100'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-6 border-t border-platinum-700/50 mt-6">
              {isAuthenticated ? (
                <>
                  <div className="mb-4 text-center">
                    <p className="font-medium text-platinum-100">{user?.name || 'User'}</p>
                    <p className="text-sm text-platinum-400 truncate" title={user?.email || 'user@example.com'}>{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="space-y-2">
                    <Link 
                      to="/dashboard" 
                      className="block py-2 text-base text-platinum-300 hover:text-gold-400 transition-colors text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/settings" 
                      className="block py-2 text-base text-platinum-300 hover:text-gold-400 transition-colors text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="block w-full py-2 text-base text-platinum-300 hover:text-gold-400 transition-colors text-center"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="block w-full py-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 font-medium text-center transition-all duration-300 hover:shadow-luxury"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
              
              <Link 
                to="/cart" 
                className="flex items-center justify-center gap-2 py-3 mt-4 text-platinum-300 hover:text-gold-400 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-lg">Cart</span>
                {cartItems.length > 0 && (
                  <span className="bg-gold-500 text-midnight-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
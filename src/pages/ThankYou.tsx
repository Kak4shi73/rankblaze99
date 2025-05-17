import { Link } from 'react-router-dom';
import { Home, MessageSquare, Check, ShoppingBag } from 'lucide-react';

const ThankYou = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-navy-800/90 backdrop-blur-xl rounded-2xl border border-royal-500/20 p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <Check className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-royal-50 to-royal-200 mb-4 font-playfair">
            Thank You for Your Purchase!
          </h1>
          
          <p className="text-royal-300 mb-6">
            Your order has been successfully placed. You will receive access to your tools shortly.
          </p>
          
          <div className="border-t border-royal-500/20 pt-6 mb-6">
            <h2 className="text-2xl font-bold text-royal-100 mb-4 font-playfair">
              Share Your Payment Proof
            </h2>
            
            <p className="text-royal-300 mb-6">
              Please share your confirmed payment screenshot with our admin to expedite your tool access.
            </p>
            
            <a 
              href="https://wa.me/917982604809?text=Hello%2C%20I%E2%80%99m%20sharing%20my%20payment%20proof%20with%20you."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 text-white mb-6"
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              Share Payment Proof on WhatsApp
            </a>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-royal-400 to-royal-600 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-royal-500/25 transition-all duration-300"
            >
              <Home className="h-5 w-5 mr-2" />
              Return Home
            </Link>
            
            <Link
              to="/tools"
              className="inline-flex items-center px-6 py-3 bg-navy-700 rounded-xl text-royal-200 font-medium border border-royal-500/20 hover:bg-navy-600 transition-colors"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Browse More Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou; 
import { useState, useEffect } from 'react';
import { Trash2, X, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CurrencySelector from '../components/cart/CurrencySelector';
import { Currency, convertCurrency, formatCurrency } from '../utils/currencyConverter';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart, updateQuantity } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Always reset to INR for checkout since PhonePe only works with INR
  useEffect(() => {
    if (isCheckingOut) {
      setSelectedCurrency('INR');
    }
  }, [isCheckingOut]);

  const convertPrice = (price: number): number => {
    return convertCurrency(price, 'INR', selectedCurrency);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(itemId, newQuantity);
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  const convertedSubtotal = convertPrice(subtotal);
  const transactionFee = convertedSubtotal * 0.022; // 2.2% transaction fee
  const gstOnFee = transactionFee * 0.18; // 18% GST on transaction fee
  const total = convertedSubtotal + transactionFee + gstOnFee;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: '/cart' } });
      return;
    }

    if (!termsAccepted) {
      setErrorMessage("Please accept the terms and conditions to proceed");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-24 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
        <div className="container mx-auto p-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-white mb-8">Your Cart</h1>
          
          <div className="bg-gray-800 rounded-lg p-12 text-center shadow-lg">
            <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-medium text-white mb-3">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Looks like you haven't added any tools to your cart yet.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Browse Tools
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Left column - Cart items */}
          <div className="w-full md:w-8/12">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Your Cart</h1>
              <button
                onClick={() => {
                  clearCart();
                  showToast('Cart cleared', 'success');
                }}
                className="text-sm text-indigo-300 hover:text-indigo-200"
              >
                Clear All
              </button>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border-b border-gray-700 last:border-none flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white font-medium">{item.name}</h3>
                      <button
                        onClick={() => {
                          removeFromCart(item.id);
                          showToast(`${item.name} removed from cart`, 'success');
                        }}
                        className="text-gray-400 hover:text-red-400 p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center">
                        <label className="text-gray-400 mr-2 text-sm">Qty:</label>
                        <div className="flex border border-gray-600 rounded-md">
                          <button 
                            className="px-2 py-1 text-gray-300 hover:bg-gray-700 rounded-l-md"
                            onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                            disabled={(item.quantity || 1) <= 1}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-white bg-gray-700">{item.quantity || 1}</span>
                          <button 
                            className="px-2 py-1 text-gray-300 hover:bg-gray-700 rounded-r-md"
                            onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-indigo-300 font-bold">
                        {formatCurrency(item.price * (item.quantity || 1), selectedCurrency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right column - Order summary */}
          <div className="w-full md:w-4/12 sticky top-24">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-gray-700">Order Summary</h2>
              
              <div className="mb-4">
                <CurrencySelector 
                  selectedCurrency={selectedCurrency}
                  onCurrencyChange={setSelectedCurrency}
                />
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(convertedSubtotal, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="flex items-center">
                    <span>Transaction Fee</span>
                    <span className="text-xs ml-1">(2.2%)</span>:
                  </span>
                  <span>{formatCurrency(transactionFee, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="flex items-center">
                    <span>GST</span>
                    <span className="text-xs ml-1">(18%)</span>:
                  </span>
                  <span>{formatCurrency(gstOnFee, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-3 border-t border-gray-700">
                  <span>Total:</span>
                  <span>{formatCurrency(total, selectedCurrency)}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-start mb-3">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    className="mr-2 mt-1" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms" className="text-gray-300 text-sm">
                    I agree to the <a href="/terms" className="text-indigo-300 hover:text-indigo-200">Terms and Conditions</a> and <a href="/privacy" className="text-indigo-300 hover:text-indigo-200">Privacy Policy</a>
                  </label>
                </div>
                
                {errorMessage && (
                  <div className="bg-red-900/30 border border-red-800 text-red-300 p-2 rounded-md text-sm mb-4">
                    {errorMessage}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !termsAccepted || cartItems.length === 0}
                  className={`w-full py-3 rounded-md font-semibold flex items-center justify-center 
                    ${isCheckingOut || !termsAccepted
                      ? 'bg-indigo-800/50 text-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  {isCheckingOut ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </div>
                  )}
                </button>
                
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center">
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Secure Checkout
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Instant Access
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
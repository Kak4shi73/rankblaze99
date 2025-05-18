import { useState } from 'react';
import { Trash2, X, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CurrencySelector from '../components/cart/CurrencySelector';
import { Currency, convertCurrency, formatCurrency } from '../utils/currencyConverter';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const convertPrice = (price: number): number => {
    return convertCurrency(price, 'INR', selectedCurrency);
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price, 0);
  const convertedSubtotal = convertPrice(subtotal);
  const transactionFee = convertedSubtotal * 0.022; // 2.2% transaction fee
  const gstOnFee = transactionFee * 0.18; // 18% GST on transaction fee
  const total = convertedSubtotal + transactionFee + gstOnFee;

  const handleCheckout = async () => {
    if (!user) {
      showToast('Please login to continue', 'error');
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    
    setIsCheckingOut(true);
    setErrorMessage(null);
    
    try {
      showToast('Redirecting to checkout...', 'info');
      
      // Navigate to the checkout page
      navigate('/checkout');
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Checkout initialization failed';
      setErrorMessage(errorMsg);
      showToast(errorMsg, 'error');
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-white mb-8">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-300 mb-6">Browse our tools and add some to your cart.</p>
            <button
              onClick={() => navigate('/tools')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md transition-colors"
            >
              Browse Tools
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Cart Items</h2>
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-300 flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Clear All
                  </button>
                </div>
                
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border-b border-gray-700 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{item.name}</h3>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">
                        {formatCurrency(convertPrice(item.price), selectedCurrency)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 mt-1 inline-flex items-center text-sm"
                      >
                        <X size={14} className="mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg overflow-hidden sticky top-24">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-white">Order Summary</h2>
                </div>
                
                <div className="p-4">
                  <div className="mb-2 flex justify-between">
                    <CurrencySelector
                      selectedCurrency={selectedCurrency}
                      onChange={setSelectedCurrency}
                    />
                  </div>
                  
                  <div className="mb-4 mt-6 space-y-2">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span>{formatCurrency(convertedSubtotal, selectedCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Transaction Fee (2.2%)</span>
                      <span>{formatCurrency(transactionFee, selectedCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>GST on Fee (18%)</span>
                      <span>{formatCurrency(gstOnFee, selectedCurrency)}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-bold text-white">
                      <span>Total</span>
                      <span>{formatCurrency(total, selectedCurrency)}</span>
                    </div>
                  </div>
                  
                  {errorMessage && (
                    <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-md mb-4 text-sm">
                      {errorMessage}
                    </div>
                  )}
                  
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || cartItems.length === 0}
                    className={`w-full py-3 rounded-md font-semibold transition-colors flex items-center justify-center ${
                      isCheckingOut || cartItems.length === 0
                        ? 'bg-indigo-800/50 text-indigo-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isCheckingOut ? (
                      'Processing...'
                    ) : (
                      <>
                        <CreditCard size={18} className="mr-2" />
                        Proceed to Checkout
                      </>
                    )}
                  </button>
                  
                  <div className="mt-4 text-center text-sm text-gray-400">
                    <div className="flex items-center justify-center mb-1">
                      <Shield size={14} className="mr-1 text-green-400" />
                      <span>Secure Checkout</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <CheckCircle size={14} className="mr-1 text-green-400" />
                      <span>Satisfaction Guaranteed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
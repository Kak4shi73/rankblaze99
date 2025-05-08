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
    
    try {
      navigate('/payment', { 
        state: { 
          cartItems,
          total: Math.round(total * 100) / 100
        }
      });
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('Payment failed', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Your Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.length > 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">Cart Items ({cartItems.length})</h2>
                </div>
                
                <div className="divide-y divide-gray-700">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        <p className="text-indigo-300 text-sm mt-1">
                          {item.billingCycle ? `${item.billingCycle} subscription` : 'One-time purchase'}
                        </p>
                      </div>
                      
                      <div className="flex items-center mt-4 sm:mt-0">
                        <span className="text-white font-medium mr-6">
                          {formatCurrency(convertPrice(item.price), selectedCurrency)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 border-t border-gray-700 flex justify-between">
                  <button
                    onClick={() => clearCart()}
                    className="text-indigo-300 hover:text-indigo-200 text-sm font-medium transition-colors"
                  >
                    Clear Cart
                  </button>
                  
                  <a
                    href="/tools"
                    className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                  >
                    Continue Shopping
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
                <X className="h-16 w-16 text-indigo-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
                <p className="text-indigo-300 mb-6">
                  Looks like you haven't added any subscriptions or tools to your cart yet.
                </p>
                <a
                  href="/tools"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                  Browse Tools
                </a>
              </div>
            )}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Order Summary</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <CurrencySelector
                  selectedCurrency={selectedCurrency}
                  onCurrencyChange={setSelectedCurrency}
                />
                
                <div className="flex justify-between text-indigo-200">
                  <span>Subtotal</span>
                  <span>{formatCurrency(convertedSubtotal, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>Transaction Fee (2.2%)</span>
                  <span>{formatCurrency(transactionFee, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-indigo-200">
                  <span>GST on Fee (18%)</span>
                  <span>{formatCurrency(gstOnFee, selectedCurrency)}</span>
                </div>
                <div className="border-t border-gray-700 pt-4 flex justify-between font-bold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(total, selectedCurrency)}</span>
                </div>
                
                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0 || isCheckingOut}
                    className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${
                      cartItems.length === 0 || isCheckingOut
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 hover:shadow-lg hover:shadow-amber-500/30'
                    }`}
                  >
                    {isCheckingOut ? (
                      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Proceed to Checkout
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-indigo-300 text-sm">
                    <Shield className="h-4 w-4 mr-2 text-green-400" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center text-indigo-300 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    <span>30-day money-back guarantee</span>
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
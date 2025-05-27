import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { initializePhonePePayment } from '../utils/payment';
import { CreditCard } from 'lucide-react';
// Import these specific icons directly to avoid issues
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';

const Checkout = () => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const totalAmount = getTotalPrice();

  // Redirect if no user or empty cart
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!cartItems.length) {
      navigate('/cart');
    }
  }, [user, cartItems, navigate]);

  // Test API connectivity
  React.useEffect(() => {
    console.log("🔄 Testing API connectivity...");
    fetch('https://us-central1-rankblaze-138f7.cloudfunctions.net/api/cors-test')
      .then(res => res.json())
      .then(data => console.log('✅ API Connected:', data))
      .catch(err => console.error('❌ API Error:', err));
      
    // Test payment endpoint specifically
    console.log("🔄 Testing payment endpoint...");
    fetch('https://us-central1-rankblaze-138f7.cloudfunctions.net/api/initializePayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1,
        userId: 'test-user',
        toolId: 'test-tool',
      }),
    })
      .then(res => {
        console.log('✅ Payment API status:', res.status);
        return res.text();
      })
      .then(text => {
        console.log('✅ Payment API response:', text);
        try {
          const json = JSON.parse(text);
          console.log('✅ Payment API parsed:', json);
        } catch (e) {
          console.error('❌ Payment API parse error:', e);
        }
      })
      .catch(err => console.error('❌ Payment API Error:', err));
  }, []);

  const handlePlaceOrder = async () => {
    console.log("🟠 Pay button clicked");
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      console.log('=== PAYMENT DEBUG START ===');
      console.log('Cart items:', cartItems);
      console.log('User:', user);
      console.log('Total amount:', totalAmount);
      
      // Get the first tool ID from cart (we'll associate the payment with this tool)
      const primaryToolId = cartItems[0]?.id;
      console.log('Primary tool ID:', primaryToolId);
      
      // Validate parameters before sending
      if (!primaryToolId) {
        throw new Error('No item in cart. Please add an item before checkout.');
      }
      
      if (!user?.uid) {
        throw new Error('User authentication required. Please log in again.');
      }
      
      if (totalAmount <= 0) {
        throw new Error('Invalid amount. Total amount must be greater than 0.');
      }
      
      // Log what we're about to send
      console.log('Sending payment request with:', {
        amount: totalAmount,
        userId: user.uid,
        toolId: primaryToolId
      });

      // Initialize PhonePe payment
      console.log('Calling initializePhonePePayment...');
      const response = await initializePhonePePayment(
        totalAmount,
        user.uid,
        primaryToolId
      );
      console.log('Payment initialization response:', response);

      if (response.success && response.payload && response.checksum) {
        console.log('Payment initialization successful, preparing payment form');
        // Store cart items in session storage for reference after payment
        sessionStorage.setItem('pendingCartItems', JSON.stringify(cartItems));
        sessionStorage.setItem('merchantTransactionId', response.merchantTransactionId);
        
        // Instead of form submission, create a popup window with proper attributes
        const paymentUrl = 'https://pay-api.phonepe.com/apis/hermes/pg/v1/pay';
        console.log('Payment URL:', paymentUrl);
        
        // Create a form for the popup window
        const formHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Processing Payment...</title>
            <script>
              window.onload = function() {
                document.getElementById('paymentForm').submit();
                console.log('Payment form submitted');
              }
            </script>
          </head>
          <body>
            <form id="paymentForm" method="POST" action="${paymentUrl}">
              <input type="hidden" name="request" value="${response.payload}">
              <input type="hidden" name="X-VERIFY" value="${response.checksum}">
            </form>
            <div style="text-align:center; margin-top:20px;">
              <p>Processing your payment...</p>
            </div>
          </body>
          </html>
        `;
        
        // Create a blob from the HTML content
        const blob = new Blob([formHtml], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        console.log('Created blob URL for payment form');
        
        // Open the payment in a new window with proper attributes
        console.log('Opening payment window...');
        const paymentWindow = window.open(
          blobUrl,
          'phonepePayment',
          'width=800,height=600,noopener,noreferrer'
        );
        
        if (!paymentWindow) {
          console.error('Payment popup was blocked');
          throw new Error('Payment popup was blocked. Please allow popups for this website.');
        }
        console.log('Payment window opened');
        
        // Start monitoring payment status
        if (response.merchantTransactionId) {
          console.log('Starting payment status monitoring for transaction:', response.merchantTransactionId);
          monitorPaymentStatus(response.merchantTransactionId);
        }
        
        // Clean up the blob URL when done
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          console.log('Blob URL revoked');
        }, 60000); // Clean up after 1 minute
        
      } else {
        console.error('Payment initialization failed:', response.error);
        throw new Error(response.error || 'Payment initialization failed');
      }
      console.log('=== PAYMENT DEBUG END ===');
    } catch (error) {
      console.error('=== PAYMENT ERROR ===', error);
      setIsProcessing(false);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred during payment initialization');
      console.error('Payment error:', error);
    }
  };
  
  // Function to monitor payment status
  const monitorPaymentStatus = async (merchantTransactionId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // Check for up to ~1 minute (20 * 3s)
    
    const checkStatus = async () => {
      try {
        if (attempts >= maxAttempts) {
          setIsProcessing(false);
          setErrorMessage('Payment verification timed out. Please check your payment status in your account.');
          return;
        }
        
        attempts++;
        
        const { initializePhonePePayment, verifyPaymentStatus } = await import('../utils/payment');
        const result = await verifyPaymentStatus(merchantTransactionId);
        
        if (result.success) {
          // Payment successful, redirect to payment success page
          clearCart();
          navigate(`/payment-success?merchantTransactionId=${merchantTransactionId}`);
        } else if (attempts < maxAttempts) {
          // Check again after 3 seconds
          setTimeout(checkStatus, 3000);
        } else {
          setIsProcessing(false);
          setErrorMessage('Payment verification timed out. Please check your payment status in your account.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setIsProcessing(false);
        setErrorMessage('Error verifying payment. Please check your payment status in your account.');
      }
    };
    
    // Start checking
    setTimeout(checkStatus, 5000); // First check after 5 seconds
  };

  const handleGoBack = () => {
    navigate('/cart');
  };

  return (
    <div className="min-h-screen pt-12 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <button 
          onClick={handleGoBack}
          className="flex items-center text-indigo-400 hover:text-indigo-300 mb-8 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Cart
        </button>
        
        <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-xl">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ShoppingBag size={20} className="mr-2 text-indigo-400" />
                  Order Summary
                </h2>
                
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between border-b border-gray-600/50 pb-3">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-gray-400 text-sm">{item.description}</p>
                      </div>
                      <p className="text-indigo-300 font-medium">₹{item.price}</p>
                    </div>
                  ))}
                  
                  <div className="flex justify-between pt-2">
                    <p className="text-white font-bold">Total</p>
                    <p className="text-indigo-300 font-bold">₹{totalAmount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <CreditCard size={20} className="mr-2 text-indigo-400" />
                  Payment Method
                </h2>
                
                <div className="flex items-center p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <div className="w-12 h-12 flex items-center justify-center bg-white rounded-md mr-4">
                    <img 
                      src="/images/phonepe-logo.png" 
                      alt="PhonePe" 
                      className="h-8 w-auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://www.phonepe.com/webstatic/static/favicon-32x32-9c2f9f1e.png";
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium">PhonePe</p>
                    <p className="text-gray-400 text-sm">UPI, Cards, Wallets</p>
                  </div>
                </div>
                
                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-gray-700/50 rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-white mb-4">Payment Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <p className="text-gray-300">Subtotal</p>
                    <p className="text-white">₹{totalAmount}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-300">Tax</p>
                    <p className="text-white">₹0</p>
                  </div>
                  <div className="border-t border-gray-600 my-2 pt-2"></div>
                  <div className="flex justify-between">
                    <p className="text-white font-bold">Total</p>
                    <p className="text-indigo-300 font-bold">₹{totalAmount}</p>
                  </div>
                </div>
                
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                    isProcessing 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Pay Now'
                  )}
                </button>
                
                <p className="text-gray-400 text-sm text-center mt-4">
                  By clicking "Pay Now", you agree to our{' '}
                  <a href="/terms" className="text-indigo-400 hover:text-indigo-300">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
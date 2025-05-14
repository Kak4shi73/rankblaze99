import crypto from 'crypto';

// Razorpay key ID for client-side usage
export const RAZORPAY_KEY_ID = 'rzp_test_OChtDbosOz00ju';

// This should be kept secret and only used on the server
// In a production environment, this would be stored securely on your backend
const KEY_SECRET = '0A8EfMcUW90DE57mNtffGeqy';

/**
 * Creates a new order in Razorpay
 * @param options Order options
 * @returns Promise with order details
 */
export const createOrder = async (options: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}) => {
  try {
    // In a production app, you'd call your own backend API which would then use the Razorpay SDK
    // For demo purposes, we're making a direct API call (NOT recommended for production)
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${KEY_SECRET}`)
      },
      body: JSON.stringify({
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt || `receipt_${Date.now()}`,
        notes: options.notes || {}
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Order creation failed:', errorData);
      throw new Error(errorData.error?.description || 'Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw error;
  }
};

/**
 * Verifies Razorpay payment signature
 * In a production app, this should be done on the server side!
 */
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  // In a real app, you would call your backend API to verify the signature
  // For demo purposes, we're just returning true
  console.warn('Payment signature verification should be performed on the server side');
  return true;
};

/**
 * Fetch payment details from Razorpay
 * In a production app, this should be done on the server side!
 */
export const fetchPaymentDetails = async (paymentId: string) => {
  try {
    // In a real app, you would call your backend API
    console.warn('This should be done on the server side');
    // Just returning a dummy successful response for demo
    return {
      id: paymentId,
      status: 'captured',
      method: 'card'
    };
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    throw error;
  }
};

/**
 * Fetch order details from Razorpay
 * In a production app, this should be done on the server side!
 */
export const fetchOrderDetails = async (orderId: string) => {
  try {
    // In a real app, you would call your backend API
    console.warn('This should be done on the server side');
    // Just returning a dummy successful response for demo
    return {
      id: orderId,
      status: 'paid'
    };
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    throw error;
  }
}; 
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with the provided API keys
const razorpayInstance = new Razorpay({
  key_id: 'rzp_test_OChtDbosOz00ju',
  key_secret: '0A8EfMcUW90DE57mNtffGeqy',
});

// Store key secret for verification purposes
const KEY_SECRET = '0A8EfMcUW90DE57mNtffGeqy';

interface OrderOptions {
  amount: number;  // amount in the smallest currency unit (paise for INR)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

/**
 * Creates a new order in Razorpay
 * @param options Order options
 * @returns Promise with order details
 */
export const createOrder = async (options: OrderOptions) => {
  const orderOptions = {
    amount: options.amount,
    currency: options.currency || 'INR',
    receipt: options.receipt || `receipt_${Date.now()}`,
    notes: options.notes || {},
  };

  try {
    return await razorpayInstance.orders.create(orderOptions);
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw error;
  }
};

/**
 * Verifies Razorpay payment signature
 * @param orderId Order ID
 * @param paymentId Payment ID
 * @param signature Razorpay signature
 * @returns Boolean indicating if signature is valid
 */
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
) => {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

/**
 * Fetch payment details by payment ID
 * @param paymentId Razorpay payment ID
 * @returns Payment details
 */
export const fetchPaymentDetails = async (paymentId: string) => {
  try {
    return await razorpayInstance.payments.fetch(paymentId);
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    throw error;
  }
};

/**
 * Fetch order details by order ID
 * @param orderId Razorpay order ID
 * @returns Order details
 */
export const fetchOrderDetails = async (orderId: string) => {
  try {
    return await razorpayInstance.orders.fetch(orderId);
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    throw error;
  }
}; 
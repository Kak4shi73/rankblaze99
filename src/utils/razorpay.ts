import crypto from 'crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Razorpay key ID for client-side usage
export const RAZORPAY_KEY_ID = 'rzp_test_OChtDbosOz00ju';

// This should be kept secret and only used on the server
// In a production environment, this would be stored securely on your backend
const KEY_SECRET = '0A8EfMcUW90DE57mNtffGeqy';

// Type definitions
export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Creates a new order in Razorpay via Firebase Functions
 */
export const createOrder = async (options: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> => {
  try {
    const functions = getFunctions();
    const createRazorpayOrderFn = httpsCallable<typeof options, RazorpayOrderResponse>(
      functions, 
      'createRazorpayOrder'
    );
    
    const result = await createRazorpayOrderFn({
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt: options.receipt || `receipt_${Date.now()}`,
      notes: options.notes || {}
    });
    
    // The result.data will contain the order details
    return result.data;
  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    
    // Extract more detailed error message from Firebase Functions if available
    if (error.code === 'functions/internal') {
      throw new Error('Internal server error. This could be due to an issue with the Razorpay API or missing dependencies.');
    } else if (error.details) {
      throw new Error(`${error.message}: ${error.details}`);
    }
    
    throw error;
  }
};

/**
 * Verifies Razorpay payment signature via Firebase Functions
 */
export const verifyPaymentSignature = async (
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> => {
  try {
    const functions = getFunctions();
    const verifyRazorpayPaymentFn = httpsCallable<
      { orderId: string; paymentId: string; signature: string },
      { isValid: boolean }
    >(functions, 'verifyRazorpayPayment');
    
    const result = await verifyRazorpayPaymentFn({
      orderId,
      paymentId,
      signature
    });
    
    // The result.data will contain { isValid: boolean }
    return result.data.isValid;
  } catch (error: any) {
    console.error('Signature verification failed:', error);
    
    // Log more detailed error information
    if (error.code === 'functions/internal') {
      console.error('Internal server error in Firebase Function');
    }
    
    return false;
  }
};

// Temporary fallback method to create order directly (for testing)
export const createOrderDirectly = async (options: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<any> => {
  try {
    // WARNING: This is NOT secure for production - API key should never be on client
    // This is only for testing/demo purposes
    console.warn('Using direct API call - NOT SECURE FOR PRODUCTION');
    
    const KEY_SECRET = '0A8EfMcUW90DE57mNtffGeqy'; // Should never be in client code
    
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
      throw new Error(errorData.error?.description || 'Failed to create order');
    }

    const data = await response.json();
    return {
      orderId: data.id,
      amount: data.amount,
      currency: data.currency
    };
  } catch (error) {
    console.error('Direct order creation failed:', error);
    throw error;
  }
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
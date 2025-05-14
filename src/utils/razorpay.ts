import crypto from 'crypto';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getApp } from 'firebase/app';

// Razorpay key ID for client-side usage (public key, safe to expose)
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
 * Get Firebase functions instance with optional emulator connection
 */
const getFunctionsInstance = () => {
  const functions = getFunctions(getApp());
  
  // Uncomment this in development to connect to the emulator
  // if (process.env.NODE_ENV === 'development') {
  //   connectFunctionsEmulator(functions, 'localhost', 5001);
  // }
  
  return functions;
};

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
    console.log('Creating Razorpay order with Firebase function');
    const functions = getFunctionsInstance();
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
    
    console.log('Order created successfully:', result.data);
    return result.data;
  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    
    if (error.code === 'functions/internal' || error.code === 'functions/unavailable') {
      console.error('Using HTTP endpoint as fallback...');
      return createOrderViaHttp(options);
    }
    
    throw error;
  }
};

/**
 * Fallback method to create order using HTTP function endpoint
 */
export const createOrderViaHttp = async (options: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> => {
  try {
    // Get the region and project ID from Firebase
    const functions = getFunctionsInstance();
    const region = 'us-central1'; // or your specific region
    const projectId = process.env.FIREBASE_PROJECT_ID || 'rankblaze-138f7'; // Use your actual project ID
    
    const url = `https://${region}-${projectId}.cloudfunctions.net/createOrder`;
    console.log('Calling HTTP endpoint:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
      throw new Error(errorData.error || 'Failed to create order');
    }

    const data = await response.json();
    return {
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency
    };
  } catch (error) {
    console.error('HTTP order creation failed:', error);
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
    const functions = getFunctionsInstance();
    const verifyRazorpayPaymentFn = httpsCallable<
      { orderId: string; paymentId: string; signature: string },
      { isValid: boolean }
    >(functions, 'verifyRazorpayPayment');
    
    const result = await verifyRazorpayPaymentFn({
      orderId,
      paymentId,
      signature
    });
    
    return result.data.isValid;
  } catch (error: any) {
    console.error('Signature verification failed:', error);
    
    if (error.code === 'functions/internal' || error.code === 'functions/unavailable') {
      console.error('Using HTTP endpoint as fallback...');
      return verifyPaymentViaHttp(orderId, paymentId, signature);
    }
    
    return false;
  }
};

/**
 * Fallback method to verify payment using HTTP function endpoint
 */
export const verifyPaymentViaHttp = async (
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> => {
  try {
    // Get the region and project ID from Firebase
    const region = 'us-central1'; // or your specific region
    const projectId = process.env.FIREBASE_PROJECT_ID || 'rankblaze-138f7'; // Use your actual project ID
    
    const url = `https://${region}-${projectId}.cloudfunctions.net/verifyPayment`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to verify payment');
    }

    const data = await response.json();
    return data.isValid;
  } catch (error) {
    console.error('HTTP payment verification failed:', error);
    return false;
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
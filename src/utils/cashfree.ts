import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

// Cashfree key ID for client-side usage (public key, safe to expose)
export const CASHFREE_APP_ID = '9721923531a775ba3e2dcb8259291279';

// Type definitions
export interface CashfreeOrderResponse {
  orderId: string;
  payment_session_id: string;
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
 * Creates a new order in Cashfree via Firebase Functions
 */
export const createOrder = async (options: {
  amount: number;
  currency?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: Record<string, string>;
}): Promise<CashfreeOrderResponse> => {
  try {
    console.log('Creating Cashfree order with Firebase function');
    const functions = getFunctionsInstance();
    const createCashfreeOrderFn = httpsCallable<typeof options, CashfreeOrderResponse>(
      functions, 
      'createCashfreeOrder'
    );
    
    const result = await createCashfreeOrderFn({
      amount: options.amount,
      currency: options.currency || 'INR',
      customerName: options.customerName,
      customerPhone: options.customerPhone,
      customerEmail: options.customerEmail,
      notes: options.notes || {}
    });
    
    console.log('Order created successfully:', result.data);
    return result.data;
  } catch (error: any) {
    console.error('Cashfree order creation failed:', error);
    
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
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: Record<string, string>;
}): Promise<CashfreeOrderResponse> => {
  try {
    // Get the region and project ID from Firebase
    const region = 'us-central1'; // or your specific region
    const projectId = process.env.FIREBASE_PROJECT_ID || 'rankblaze-138f7'; // Use your actual project ID
    
    const url = `https://${region}-${projectId}.cloudfunctions.net/api/createCashfreeOrder`;
    console.log('Calling HTTP endpoint:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: options.amount,
        currency: options.currency || 'INR',
        customerName: options.customerName,
        customerPhone: options.customerPhone,
        customerEmail: options.customerEmail,
        notes: options.notes || {}
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }

    const data = await response.json();
    return {
      orderId: data.order_id,
      payment_session_id: data.payment_session_id,
      amount: data.order_amount,
      currency: data.order_currency
    };
  } catch (error) {
    console.error('HTTP order creation failed:', error);
    throw error;
  }
};

/**
 * Verifies Cashfree payment status via Firebase Functions
 */
export const verifyPaymentStatus = async (
  orderId: string,
  orderAmount?: number
): Promise<boolean> => {
  try {
    const functions = getFunctionsInstance();
    const verifyCashfreePaymentFn = httpsCallable<
      { orderId: string; orderAmount?: number },
      { isValid: boolean }
    >(functions, 'verifyCashfreePayment');
    
    const result = await verifyCashfreePaymentFn({
      orderId,
      orderAmount
    });
    
    return result.data.isValid;
  } catch (error: any) {
    console.error('Payment verification failed:', error);
    
    if (error.code === 'functions/internal' || error.code === 'functions/unavailable') {
      console.error('Using HTTP endpoint as fallback...');
      return verifyPaymentViaHttp(orderId, orderAmount);
    }
    
    return false;
  }
};

/**
 * Fallback method to verify payment using HTTP function endpoint
 */
export const verifyPaymentViaHttp = async (
  orderId: string,
  orderAmount?: number
): Promise<boolean> => {
  try {
    // Get the region and project ID from Firebase
    const region = 'us-central1'; // or your specific region
    const projectId = process.env.FIREBASE_PROJECT_ID || 'rankblaze-138f7'; // Use your actual project ID
    
    const url = `https://${region}-${projectId}.cloudfunctions.net/api/verifyCashfreePayment`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        orderAmount
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
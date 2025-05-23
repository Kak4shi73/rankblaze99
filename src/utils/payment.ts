import { db, firestore } from '../config/firebase';
import { ref, get, set } from 'firebase/database';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, updateDoc, arrayUnion as firestoreArrayUnion } from 'firebase/firestore';

// API base URL for backend functions
const API_BASE_URL = 'https://us-central1-rankblaze-138f7.cloudfunctions.net/api';

interface PaymentInitResponse {
  success: boolean;
  payload: string;
  checksum: string;
  merchantTransactionId: string;
  error?: string;
}

/**
 * Initialize a PhonePe payment
 * @param amount - The payment amount in INR
 * @param userId - The user ID
 * @param toolId - The tool ID
 * @returns Promise with payment initialization response
 */
export const initializePhonePePayment = async (
  amount: number,
  userId: string,
  toolId: string
): Promise<PaymentInitResponse> => {
  try {
    // Call the backend API to initialize the payment
    const response = await fetch(`${API_BASE_URL}/initializePayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        userId,
        toolId,
      }),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment API error:', errorText);
      return {
        success: false,
        payload: '',
        checksum: '',
        merchantTransactionId: '',
        error: `Payment failed with status code ${response.status}: ${errorText}`
      };
    }
    
    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        payload: '',
        checksum: '',
        merchantTransactionId: '',
        error: data.error || 'Failed to initialize payment'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error in payment initialization:', error);
    return {
      success: false,
      payload: '',
      checksum: '',
      merchantTransactionId: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Verify the payment status
 * @param merchantTransactionId - The merchant transaction ID
 * @returns Promise with payment verification result
 */
export const verifyPaymentStatus = async (merchantTransactionId: string): Promise<boolean> => {
  try {
    // Call the backend API to verify the payment
    const response = await fetch(
      `${API_BASE_URL}/verifyPayment?merchantTransactionId=${merchantTransactionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to verify payment');
    }

    return data.status === 'completed';
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};

/**
 * Process a successful payment
 * @param merchantTransactionId - The merchant transaction ID
 * @param userId - The user ID
 * @param toolIds - Array of tool IDs purchased
 * @returns Promise with processing result
 */
export const processSuccessfulPayment = async (
  merchantTransactionId: string,
  userId: string,
  toolIds: string[]
): Promise<boolean> => {
  try {
    // Update the user's profile with the purchased tools
    const userRef = doc(firestore, 'users', userId);
    
    // Add each tool to the user's tools array
    for (const toolId of toolIds) {
      await updateDoc(userRef, {
        tools: firestoreArrayUnion(toolId),
        updatedAt: serverTimestamp(),
      });
    }
    
    // Create a payment record
    const paymentRef = doc(firestore, 'user_payments', `${userId}_${merchantTransactionId}`);
    await setDoc(paymentRef, {
      userId,
      toolIds,
      merchantTransactionId,
      status: 'completed',
      createdAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error processing successful payment:', error);
    return false;
  }
};
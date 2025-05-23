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
): Promise<{ success: boolean; payload?: string; checksum?: string; merchantTransactionId?: string; error?: string }> => {
  console.log("🚨 INITIALIZE PHONEPE PAYMENT FUNCTION TRIGGERED 🚨");
  console.log("🟢 Starting PhonePe payment...", { amount, userId, toolId });
  try {
    console.log('=== PAYMENT UTILITY DEBUG START ===');
    // Validate input parameters
    if (!amount || amount <= 0) {
      console.error('❌ Invalid amount:', amount);
      return { success: false, error: 'Amount must be greater than 0' };
    }

    if (!userId) {
      console.error('❌ Missing userId');
      return { success: false, error: 'User ID is required' };
    }

    if (!toolId) {
      console.error('❌ Missing toolId');
      return { success: false, error: 'Tool ID is required' };
    }

    // Log the data being sent
    console.log('📤 Sending payment request to backend:', { amount, userId, toolId });
    console.log('🔗 API URL:', `${API_BASE_URL}/initializePayment`);

    try {
      console.log("⏳ About to make fetch request to initializePayment endpoint");
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
      
      console.log('✅ Fetch request completed');
      console.log('📊 Got response with status:', response.status);
      console.log('🔤 Response headers:', Object.fromEntries([...response.headers.entries()]));

      // Handle non-200 responses
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Raw error response:', responseText);
        
        let errorData: { error?: string } = {};
        try {
          errorData = JSON.parse(responseText);
          console.error('❌ Parsed error response:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response as JSON');
        }
        
        return {
          success: false,
          error: errorData.error || `Payment failed with status code ${response.status}: ${responseText}`
        };
      }

      const responseText = await response.text();
      console.log('📝 Raw success response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📦 Parsed response data:', data);
      } catch (e) {
        console.error('❌ Could not parse success response as JSON:', e);
        return {
          success: false,
          error: `Invalid response format: ${responseText}`
        };
      }

      if (!data.success) {
        console.error('❌ Payment initialization failed:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to initialize payment'
        };
      }

      console.log('✅ Payment initialization successful:', {
        merchantTransactionId: data.merchantTransactionId,
        hasPayload: !!data.payload,
        hasChecksum: !!data.checksum
      });
      
      console.log('=== PAYMENT UTILITY DEBUG END ===');
      return {
        success: true,
        payload: data.payload,
        checksum: data.checksum,
        merchantTransactionId: data.merchantTransactionId,
      };
    } catch (networkError) {
      console.error('❌ Network error during API call:', networkError);
      return {
        success: false,
        error: `Network error: ${networkError instanceof Error ? networkError.message : String(networkError)}`
      };
    }
  } catch (error) {
    console.error('❌ Error in payment initialization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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

// Helper function to simulate Firebase's arrayUnion
const arrayUnion = (...elements: any[]) => {
  return {
    __op: 'ArrayUnion',
    elements,
  };
};
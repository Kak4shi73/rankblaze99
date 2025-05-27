import { db, firestore } from '../config/firebase';
import { ref, get, set } from 'firebase/database';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, updateDoc, arrayUnion as firestoreArrayUnion } from 'firebase/firestore';

// API base URL for backend functions
const API_BASE_URL = 'https://us-central1-rankblaze-138f7.cloudfunctions.net/api';

interface PaymentInitResponse {
  success: boolean;
  checkoutUrl?: string;
  merchantTransactionId?: string;
  error?: string;
  token?: string; // For SDK integration
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
    console.log(`Making request to ${API_BASE_URL}/initializePhonePePayment`);
    
    // Call the backend API to initialize the payment
    const response = await fetch(`${API_BASE_URL}/initializePhonePePayment`, {
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
    
    // Log complete response for debugging
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Payment API error:', errorText);
      return {
        success: false,
        error: `Payment failed with status code ${response.status}: ${errorText}`
      };
    }
    
    // Get the full response as text first for debugging
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    // Parse the JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return {
        success: false,
        error: 'Invalid JSON response from server'
      };
    }
    
    console.log('Parsed response data:', data);
    
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to initialize payment'
      };
    }
    
    return {
      success: true,
      checkoutUrl: data.checkoutUrl,
      merchantTransactionId: data.merchantTransactionId,
    };
  } catch (error) {
    console.error('Error in payment initialization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Initialize a PhonePe SDK payment for frontend integration
 * @param amount - The payment amount in INR
 * @param userId - The user ID
 * @param toolId - The tool ID
 * @returns Promise with payment initialization response including SDK token
 */
export const initializePhonePeSdkPayment = async (
  amount: number,
  userId: string,
  toolId: string
): Promise<PaymentInitResponse> => {
  try {
    // Call the backend API to initialize the payment
    const response = await fetch(`${API_BASE_URL}/createPhonePeSdkOrder`, {
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
      console.error('SDK Payment API error:', errorText);
      return {
        success: false,
        error: `SDK Payment failed with status code ${response.status}: ${errorText}`
      };
    }
    
    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to initialize SDK payment'
      };
    }
    
    return {
      success: true,
      token: data.token,
      merchantTransactionId: data.merchantOrderId,
    };
  } catch (error) {
    console.error('Error in SDK payment initialization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Verify the payment status
 * @param merchantTransactionId - The merchant transaction ID
 * @returns Promise with payment verification result
 */
export const verifyPaymentStatus = async (merchantTransactionId: string): Promise<{success: boolean, state?: string, error?: string}> => {
  try {
    // Call the backend API to verify the payment
    const response = await fetch(
      `${API_BASE_URL}/verifyPhonePePayment?merchantOrderId=${merchantTransactionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Verification failed with status code ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to verify payment'
      };
    }

    return {
      success: true,
      state: data.state
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Verify the payment and grant tool access using the new POST endpoint
 * @param txnId - The merchant transaction ID
 * @returns Promise with payment verification and tool access result
 */
export const verifyAndGrantAccess = async (txnId: string): Promise<{success: boolean, message?: string, error?: string}> => {
  try {
    console.log(`Verifying and granting access for transaction ${txnId}`);
    
    // Call the backend API to verify the payment and grant tool access
    const response = await fetch(
      `${API_BASE_URL}/verifyPhonePePayment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txnId }),
        credentials: 'include',
        mode: 'cors'
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Verification and access grant failed with status ${response.status}:`, errorText);
      return {
        success: false,
        error: `Failed with status code ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('Verification response:', data);

    if (!data.success) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to verify payment'
      };
    }

    return {
      success: true,
      message: data.message || 'Tool access granted successfully'
    };
  } catch (error) {
    console.error('Error in verifyAndGrantAccess:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
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
    
    // Get the user document to check if it exists
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found when processing payment');
      return false;
    }
    
    // Add each tool to the user's tools array and set access status as "active"
    await updateDoc(userRef, {
      tools: firestoreArrayUnion(...toolIds),
      updatedAt: serverTimestamp(),
    });
    
    // Create or update tool access records for each tool
    for (const toolId of toolIds) {
      // Create a unique access record ID
      const accessId = `${userId}_${toolId}`;
      
      const toolAccessRef = doc(firestore, 'tool_access', accessId);
      await setDoc(toolAccessRef, {
        userId,
        toolId,
        status: 'active',
        activatedAt: serverTimestamp(),
        paymentId: merchantTransactionId
      }, { merge: true });
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
    
    // Also save a reference in the user_purchases collection
    const purchaseRef = doc(firestore, 'user_purchases', merchantTransactionId);
    await setDoc(purchaseRef, {
      userId,
      orderId: merchantTransactionId,
      purchasedAt: serverTimestamp(),
      tools: toolIds.map(id => ({ id }))
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error processing successful payment:', error);
    return false;
  }
};

/**
 * Automatically verify and process payment using all available methods
 * This provides a direct way to handle payment success and activation with comprehensive logging
 * @param merchantTransactionId - The merchant transaction ID
 * @param userId - The user ID (optional, will try to verify without it if not provided)
 * @returns Promise with processing result
 */
export const autoVerifyAndProcessPayment = async (
  merchantTransactionId: string,
  userId?: string
): Promise<{success: boolean; message?: string; error?: string}> => {
  try {
    console.log(`Starting auto verification for transaction: ${merchantTransactionId}`);
    
    // Step 1: Try the new direct verification and tool access endpoint
    const directResult = await verifyAndGrantAccess(merchantTransactionId);
    
    if (directResult.success) {
      console.log('Direct verification and access grant succeeded:', directResult.message);
      return directResult;
    }
    
    console.log('Direct verification failed, falling back to older methods:', directResult.error);
    
    // Step 2: Verify the payment status using the GET endpoint
    const verificationResult = await verifyPaymentStatus(merchantTransactionId);
    
    if (!verificationResult.success) {
      console.error(`Payment verification failed for ${merchantTransactionId}:`, verificationResult.error);
      return {
        success: false,
        error: verificationResult.error || 'Payment verification failed'
      };
    }
    
    console.log(`Payment verification successful for ${merchantTransactionId}`);
    
    // Step 3: If userId is not provided, try to find it from the transaction data
    let actualUserId = userId;
    if (!actualUserId) {
      try {
        // Try to get userId from Realtime Database
        const transactionRef = ref(db, `transactions/${merchantTransactionId}`);
        const transactionSnapshot = await get(transactionRef);
        
        if (transactionSnapshot.exists()) {
          const transaction = transactionSnapshot.val();
          if (transaction.userId) {
            actualUserId = transaction.userId;
            console.log(`Found userId ${actualUserId} in transaction data`);
          }
        }
        
        // If still not found, check Firestore
        if (!actualUserId) {
          const userPurchaseRef = doc(firestore, 'user_purchases', merchantTransactionId);
          const userPurchaseSnapshot = await getDoc(userPurchaseRef);
          
          if (userPurchaseSnapshot.exists()) {
            const purchaseData = userPurchaseSnapshot.data();
            if (purchaseData.userId) {
              actualUserId = purchaseData.userId;
              console.log(`Found userId ${actualUserId} in user_purchases collection`);
            }
          }
        }
      } catch (error) {
        console.error('Error finding userId:', error);
        // Continue execution even if we can't find userId
      }
    }
    
    if (!actualUserId) {
      return {
        success: false,
        error: 'User ID not found for this transaction'
      };
    }
    
    // Step 4: Get the tools associated with this transaction
    let toolIds: string[] = [];
    
    // Check Realtime Database first
    const transactionRef = ref(db, `transactions/${merchantTransactionId}`);
    const transactionSnapshot = await get(transactionRef);
    
    if (transactionSnapshot.exists()) {
      const transaction = transactionSnapshot.val();
      
      if (transaction.tools && Array.isArray(transaction.tools)) {
        toolIds = transaction.tools.map((tool: any) => tool.id);
      } else if (transaction.toolId) {
        toolIds = [transaction.toolId];
      }
      
      console.log(`Found ${toolIds.length} tools in transaction data:`, toolIds);
    } 
    
    // If no tools found in Realtime DB, check Firestore
    if (toolIds.length === 0) {
      const userPurchaseRef = doc(firestore, 'user_purchases', merchantTransactionId);
      const userPurchaseSnapshot = await getDoc(userPurchaseRef);
      
      if (userPurchaseSnapshot.exists()) {
        const purchaseData = userPurchaseSnapshot.data();
        if (purchaseData.tools && Array.isArray(purchaseData.tools)) {
          toolIds = purchaseData.tools.map((tool: any) => tool.id);
        }
        
        console.log(`Found ${toolIds.length} tools in user_purchases collection:`, toolIds);
      }
    }
    
    if (toolIds.length === 0) {
      return {
        success: false,
        error: 'No tools found for this transaction'
      };
    }
    
    // Step 5: Process the successful payment
    const processingResult = await processSuccessfulPayment(merchantTransactionId, actualUserId, toolIds);
    
    if (!processingResult) {
      return {
        success: false,
        error: 'Failed to process the payment and activate tools'
      };
    }
    
    return {
      success: true,
      message: `Successfully activated ${toolIds.length} tools for user ${actualUserId}`
    };
  } catch (error) {
    console.error('Error in auto verification and processing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
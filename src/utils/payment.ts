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
  payload?: string; // For PhonePe form submission
  checksum?: string; // For PhonePe form submission
}

/**
 * Initialize a PhonePe payment
 * @param amount - The payment amount in INR
 * @param userId - The user I
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
      payload: data.payload,
      checksum: data.checksum
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
    
    // Store transaction attempt in session storage as fallback
    sessionStorage.setItem('lastTransactionId', txnId);
    
    // Try multiple possible transaction ID formats
    const transactionIds = [
      txnId, 
      sessionStorage.getItem('merchantTransactionId') || '',
      sessionStorage.getItem('lastTransactionId') || ''
    ].filter(id => id && id.length > 0);
    
    // Remove duplicates
    const uniqueTransactionIds = [...new Set(transactionIds)];
    
    console.log('Attempting verification with transaction IDs:', uniqueTransactionIds);
    
    // Try each transaction ID until one succeeds
    for (const transactionId of uniqueTransactionIds) {
      try {
        console.log(`Trying transaction ID: ${transactionId}`);
        
        // Call the backend API to verify the payment and grant tool access
        const response = await fetch(
          `${API_BASE_URL}/verifyPhonePePayment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              txnId: transactionId,
              merchantTransactionId: transactionId,
              merchantOrderId: transactionId
            }),
            credentials: 'include',
            mode: 'cors'
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Verification failed with status ${response.status} for ID ${transactionId}:`, errorText);
          continue; // Try next transaction ID
        }

        const data = await response.json();
        console.log(`Verification response for ID ${transactionId}:`, data);

        if (data.success) {
          // If verification succeeded, store this transaction ID as the valid one
          sessionStorage.setItem('validTransactionId', transactionId);
          
          return {
            success: true,
            message: data.message || 'Tool access granted successfully'
          };
        }
      } catch (requestError) {
        console.error(`Error making verification request for ID ${transactionId}:`, requestError);
        // Continue to try next transaction ID
      }
    }
    
    // If we get here, all verification attempts failed
    return {
      success: false,
      error: 'Failed to verify payment with any available transaction ID'
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
 * Auto-verify and process payment by checking status and granting tool access
 * @param merchantTransactionId - The merchant transaction ID
 * @param userId - The user ID (optional)
 * @returns Promise with verification result
 */
export const autoVerifyAndProcessPayment = async (
  merchantTransactionId: string,
  userId?: string
): Promise<{success: boolean; message?: string; error?: string}> => {
  try {
    console.log(`Auto-verifying payment for transaction ${merchantTransactionId}`);
    
    // First try to verify payment status through the API
    const verificationResult = await verifyPaymentStatus(merchantTransactionId);
    
    if (verificationResult.success && verificationResult.state === 'COMPLETED') {
      console.log('Payment verified as COMPLETED');
      
      // Extract user ID and tool ID from transaction ID if possible
      // Format is typically: ord_userId_toolId_timestamp
      let extractedUserId: string | undefined;
      let extractedToolId: string | undefined;
      
      if (merchantTransactionId.startsWith('ord_')) {
        const parts = merchantTransactionId.split('_');
        if (parts.length >= 3) {
          extractedUserId = parts[1];
          extractedToolId = parts[2];
          console.log(`Extracted userId=${extractedUserId} and toolId=${extractedToolId} from transaction ID`);
        }
      }
      
      // Use provided userId if available, otherwise use extracted one
      const finalUserId = userId || extractedUserId;
      
      if (finalUserId && extractedToolId) {
        try {
          // Try to grant access directly
          console.log(`Granting tool ${extractedToolId} access to user ${finalUserId}`);
          
          // Create a transaction record
          const transactionData = {
            userId: finalUserId,
            toolId: extractedToolId,
            status: 'completed',
            merchantTransactionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Store in Firestore
          try {
            const txnRef = doc(firestore, 'transactions', merchantTransactionId);
            await setDoc(txnRef, transactionData, { merge: true });
            console.log('Transaction record created/updated in Firestore');
          } catch (firestoreError) {
            console.error('Error storing transaction in Firestore:', firestoreError);
            // Continue anyway since this is just record keeping
          }
          
          // Store in Realtime Database as backup
          try {
            const rtdbRef = ref(db, `transactions/${merchantTransactionId}`);
            await set(rtdbRef, transactionData);
            console.log('Transaction record created/updated in Realtime Database');
          } catch (rtdbError) {
            console.error('Error storing transaction in Realtime Database:', rtdbError);
            // Continue anyway since this is just record keeping
          }
          
          // Grant tool access to user
          const userToolRef = doc(firestore, 'users', finalUserId, 'tools', extractedToolId);
          await setDoc(userToolRef, {
            activatedAt: new Date().toISOString(),
            toolId: extractedToolId,
            source: 'auto_verification'
          });
          
          // Update user's tools array for backward compatibility
          const userRef = doc(firestore, 'users', finalUserId);
          await updateDoc(userRef, {
            tools: firestoreArrayUnion(extractedToolId),
            updatedAt: new Date().toISOString()
          });
          
          console.log('Tool access granted successfully');
          return {
            success: true,
            message: 'Payment verified and tool access granted'
          };
        } catch (accessError) {
          console.error('Error granting tool access:', accessError);
          return {
            success: false,
            error: 'Payment verified but failed to grant tool access'
          };
        }
      } else {
        console.error('Could not determine user ID or tool ID from transaction');
        return {
          success: false,
          error: 'Payment verified but could not determine user or tool information'
        };
      }
    } else if (verificationResult.success) {
      console.log(`Payment verification returned non-completed state: ${verificationResult.state}`);
      return {
        success: false,
        error: `Payment verification returned status: ${verificationResult.state}`
      };
    } else {
      console.error('Payment verification failed:', verificationResult.error);
      return {
        success: false,
        error: verificationResult.error || 'Payment verification failed'
      };
    }
  } catch (error) {
    console.error('Error in auto verification process:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in payment verification'
    };
  }
};
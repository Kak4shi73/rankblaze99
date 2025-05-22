import { db, firestore } from '../config/firebase';
import { ref, get, set } from 'firebase/database';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PaymentInitResponse {
  success: boolean;
  payload: string;
  checksum: string;
  merchantTransactionId: string;
}

export const initializePhonePePayment = async (
  amount: number, 
  userId: string, 
  toolId: string
): Promise<PaymentInitResponse> => {
  try {
    // First create an order record in Firestore
    const orderRef = collection(firestore, 'orders');
    await addDoc(orderRef, {
      userId,
      toolId,
      amount,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Call the backend API to initialize payment
    const response = await fetch(
      'https://us-central1-rankblaze-138f7.cloudfunctions.net/api/initializePayment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, userId, toolId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initialize payment');
    }

    const data = await response.json();
    
    // Store transaction info in realtime database for faster access
    const transactionRef = ref(db, `client_transactions/${data.merchantTransactionId}`);
    await set(transactionRef, {
      status: 'initiated',
      amount,
      userId,
      toolId,
      createdAt: Date.now()
    });

    return data;
  } catch (error) {
    console.error('Payment initialization failed:', error);
    throw error;
  }
};

export const verifyPaymentStatus = async (merchantTransactionId: string): Promise<boolean> => {
  try {
    // First try to check from realtime database for fast response
    const transactionRef = ref(db, `transactions/${merchantTransactionId}`);
    
    // Check status up to 30 times with 1 second interval
    for (let i = 0; i < 30; i++) {
      const snapshot = await get(transactionRef);
      if (snapshot.exists()) {
        const transaction = snapshot.val();
        if (transaction.status === 'completed') {
          return true;
        } else if (transaction.status === 'failed') {
          return false;
        }
      }
      
      // If still pending, also check with the API
      if (i % 5 === 0) {  // Check every 5 seconds via API
        try {
          const response = await fetch(
            `https://us-central1-rankblaze-138f7.cloudfunctions.net/api/verifyPayment?merchantTransactionId=${merchantTransactionId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.status === 'completed') {
              return true;
            } else if (data.status === 'failed') {
              return false;
            }
          }
        } catch (apiError) {
          console.error('API verification error:', apiError);
          // Continue with polling realtime DB
        }
      }

      // Wait for 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // If we've waited 30 seconds and still no definitive status, do one final API check
    try {
      const response = await fetch(
        `https://us-central1-rankblaze-138f7.cloudfunctions.net/api/verifyPayment?merchantTransactionId=${merchantTransactionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.status === 'completed';
      }
    } catch (finalApiError) {
      console.error('Final API verification error:', finalApiError);
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying payment status:', error);
    return false;
  }
};
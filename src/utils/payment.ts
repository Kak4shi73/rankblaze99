```typescript
import { db } from '../config/firebase';
import { ref, get, onValue } from 'firebase/database';

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
      throw new Error('Failed to initialize payment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment initialization failed:', error);
    throw error;
  }
};

export const verifyPaymentStatus = async (merchantTransactionId: string): Promise<boolean> => {
  try {
    const transactionRef = ref(db, `transactions/${merchantTransactionId}`);
    
    // Wait for status update for up to 30 seconds
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying payment status:', error);
    return false;
  }
};
```
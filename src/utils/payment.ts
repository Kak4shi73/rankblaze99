import { db } from '../config/firebase';
import { ref, set, push } from 'firebase/database';

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

export const redirectToPhonePe = (payload: string, checksum: string): void => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://pay.phonepe.com/api/v1/redirect';

  const payloadInput = document.createElement('input');
  payloadInput.type = 'hidden';
  payloadInput.name = 'request';
  payloadInput.value = payload;

  const checksumInput = document.createElement('input');
  checksumInput.type = 'hidden';
  checksumInput.name = 'checksum';
  checksumInput.value = checksum;

  form.appendChild(payloadInput);
  form.appendChild(checksumInput);
  document.body.appendChild(form);
  form.submit();
};

export const verifyPaymentStatus = async (merchantTransactionId: string): Promise<boolean> => {
  try {
    const transactionRef = ref(db, `transactions/${merchantTransactionId}`);
    const snapshot = await new Promise((resolve) => {
      const unsubscribe = onValue(transactionRef, (snapshot) => {
        unsubscribe();
        resolve(snapshot);
      });
    });

    if (snapshot.exists()) {
      const transaction = snapshot.val();
      return transaction.status === 'completed';
    }

    return false;
  } catch (error) {
    console.error('Error verifying payment status:', error);
    return false;
  }
};
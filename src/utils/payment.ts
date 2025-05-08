import { db } from '../config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export const initializePayment = async (amount: number, userId: string, productDetails: any) => {
  try {
    // Create subscription record
    const subscriptionRef = await addDoc(collection(db, 'subscriptions'), {
      userId,
      productId: productDetails.id,
      productName: productDetails.name,
      price: productDetails.price,
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
      status: 'active',
      createdAt: Timestamp.now()
    });

    // Generate access token
    await addDoc(collection(db, 'access_tokens'), {
      userId,
      subscriptionId: subscriptionRef.id,
      token: crypto.randomUUID(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
      isActive: true,
      createdAt: Timestamp.now()
    });

    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Payment initialization failed:', error);
    throw error;
  }
};
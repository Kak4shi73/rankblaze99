import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

// Step 1: User Registration/Login - Save user to Firestore
export const createOrUpdateUser = async (user) => {
  try {
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      name: user.displayName || user.name || 'User',
      email: user.email,
      uid: user.uid,
      updatedAt: serverTimestamp()
    };
    
    if (!userDoc.exists()) {
      userData.createdAt = serverTimestamp();
      userData.totalSpent = 0;
      userData.activeSubscriptions = [];
    }
    
    await setDoc(userRef, userData, { merge: true });
    console.log('✅ User created/updated in Firestore');
    return userData;
    
  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    throw error;
  }
};

// Step 2: Create Order when user selects a tool
export const createOrder = async (userId, toolId, toolName, amount) => {
  try {
    const orderData = {
      userId,
      toolId,
      toolName,
      amount,
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const orderRef = await addDoc(collection(firestore, 'orders'), orderData);
    console.log('✅ Order created in Firestore:', orderRef.id);
    
    return {
      orderId: orderRef.id,
      ...orderData
    };
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
};

// Step 3: Initialize PhonePe Payment
export const initializePhonePePayment = async (orderId, amount, userId, toolId) => {
  try {
    const API_BASE_URL = 'https://us-central1-rankblaze-138f7.cloudfunctions.net';
    
    const response = await fetch(`${API_BASE_URL}/initializePhonePePayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        userId,
        toolId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to initialize payment');
    }
    
    // Update order with payment details
    await updateDoc(doc(firestore, 'orders', orderId), {
      merchantTransactionId: result.merchantTransactionId,
      paymentInitiatedAt: serverTimestamp(),
      paymentStatus: 'initiated'
    });
    
    console.log('✅ PhonePe payment initialized');
    return result;
    
  } catch (error) {
    console.error('❌ Error initializing PhonePe payment:', error);
    throw error;
  }
};

// Step 4: Check Payment Status
export const checkPaymentStatus = async (merchantTransactionId) => {
  try {
    const API_BASE_URL = 'https://us-central1-rankblaze-138f7.cloudfunctions.net';
    
    const response = await fetch(`${API_BASE_URL}/verifyPhonePePayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantTransactionId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to check payment status');
    }
    
    console.log('✅ Payment status checked:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    throw error;
  }
};

// Step 5: Activate Subscription after successful payment
export const activateSubscription = async (userId, toolId, toolName, orderId, transactionId, amount) => {
  try {
    const subscriptionId = `${userId}_${toolId}`;
    const subscriptionData = {
      userId,
      toolId,
      toolName,
      orderId,
      transactionId,
      amount,
      isActive: true,
      subscribedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Create subscription
    await setDoc(doc(firestore, 'subscriptions', subscriptionId), subscriptionData);
    console.log('✅ Subscription activated in Firestore');
    
    // Update order status
    await updateDoc(doc(firestore, 'orders', orderId), {
      paymentStatus: 'completed',
      completedAt: serverTimestamp(),
      subscriptionId
    });
    console.log('✅ Order updated as completed');
    
    // Update user's active subscriptions
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const activeSubscriptions = userData.activeSubscriptions || [];
    if (!activeSubscriptions.includes(toolId)) {
      activeSubscriptions.push(toolId);
    }
    
    await updateDoc(userRef, {
      activeSubscriptions,
      totalSpent: (userData.totalSpent || 0) + amount,
      lastPurchase: {
        toolId,
        toolName,
        amount,
        date: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    console.log('✅ User updated with new subscription');
    
    // Create payment record
    await addDoc(collection(firestore, 'payments'), {
      userId,
      toolId,
      toolName,
      orderId,
      transactionId,
      amount,
      status: 'completed',
      paymentMethod: 'PhonePe',
      createdAt: serverTimestamp()
    });
    console.log('✅ Payment record created');
    
    return subscriptionData;
    
  } catch (error) {
    console.error('❌ Error activating subscription:', error);
    throw error;
  }
};

// Step 6: Check if user has access to a tool
export const checkToolAccess = async (userId, toolId) => {
  try {
    const subscriptionId = `${userId}_${toolId}`;
    const subscriptionRef = doc(firestore, 'subscriptions', subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      return { hasAccess: false, access: null };
    }
    
    const subscription = subscriptionDoc.data();
    const isActive = subscription.isActive && new Date() < subscription.expiresAt.toDate();
    
    return {
      hasAccess: isActive,
      access: isActive ? subscription : null
    };
    
  } catch (error) {
    console.error('❌ Error checking tool access:', error);
    return { hasAccess: false, access: null };
  }
};

// Get user's active subscriptions
export const getUserSubscriptions = async (userId) => {
  try {
    const subscriptionsQuery = query(
      collection(firestore, 'subscriptions'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
    const subscriptions = [];
    
    subscriptionsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Check if subscription is still valid
      if (new Date() < data.expiresAt.toDate()) {
        subscriptions.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return subscriptions;
    
  } catch (error) {
    console.error('❌ Error getting user subscriptions:', error);
    return [];
  }
};

// Get user's payment history
export const getUserPayments = async (userId) => {
  try {
    const paymentsQuery = query(
      collection(firestore, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = [];
    
    paymentsSnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return payments;
    
  } catch (error) {
    console.error('❌ Error getting user payments:', error);
    return [];
  }
};

// Real-time subscription listener
export const subscribeToUserSubscriptions = (userId, callback) => {
  try {
    const subscriptionsQuery = query(
      collection(firestore, 'subscriptions'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const unsubscribe = onSnapshot(subscriptionsQuery, (snapshot) => {
      const subscriptions = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Check if subscription is still valid
        if (new Date() < data.expiresAt.toDate()) {
          subscriptions.push({
            id: doc.id,
            ...data
          });
        }
      });
      callback(subscriptions);
    });
    
    return unsubscribe;
    
  } catch (error) {
    console.error('❌ Error setting up subscription listener:', error);
    return () => {};
  }
};

// Complete payment flow
export const completePaymentFlow = async (userId, toolId, toolName, amount) => {
  try {
    console.log('🚀 Starting complete payment flow...');
    
    // Step 1: Create order
    const order = await createOrder(userId, toolId, toolName, amount);
    console.log('📝 Order created:', order.orderId);
    
    // Step 2: Initialize PhonePe payment
    const paymentResult = await initializePhonePePayment(order.orderId, amount, userId, toolId);
    console.log('💳 Payment initialized:', paymentResult.merchantTransactionId);
    
    return {
      success: true,
      orderId: order.orderId,
      merchantTransactionId: paymentResult.merchantTransactionId,
      paymentUrl: paymentResult.paymentUrl || paymentResult.redirectUrl,
      message: 'Payment flow initiated successfully'
    };
    
  } catch (error) {
    console.error('❌ Error in complete payment flow:', error);
    throw error;
  }
};

// Verify and complete payment
export const verifyAndCompletePayment = async (merchantTransactionId) => {
  try {
    console.log('🔍 Verifying payment:', merchantTransactionId);
    
    // Check payment status with PhonePe
    const paymentStatus = await checkPaymentStatus(merchantTransactionId);
    
    if (paymentStatus.success && paymentStatus.status === 'completed') {
      // Get order details
      const ordersQuery = query(
        collection(firestore, 'orders'),
        where('merchantTransactionId', '==', merchantTransactionId)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        throw new Error('Order not found');
      }
      
      const orderDoc = ordersSnapshot.docs[0];
      const orderData = orderDoc.data();
      
      // Activate subscription
      const subscription = await activateSubscription(
        orderData.userId,
        orderData.toolId,
        orderData.toolName,
        orderDoc.id,
        merchantTransactionId,
        orderData.amount
      );
      
      return {
        success: true,
        access: subscription,
        message: 'Payment verified and subscription activated'
      };
    } else {
      return {
        success: false,
        message: 'Payment not completed or failed'
      };
    }
    
  } catch (error) {
    console.error('❌ Error verifying and completing payment:', error);
    throw error;
  }
}; 
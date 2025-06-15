import { functions } from '../config/firebase';

// Create subscription after payment
export const createSubscriptionAfterPayment = async (userId, toolId, merchantTransactionId, amount = 0) => {
  try {
    console.log(`🔧 Creating subscription for user ${userId}, tool ${toolId}`);
    
    const createSubscriptionFunction = functions.httpsCallable('createSubscriptionAfterPayment');
    const result = await createSubscriptionFunction({
      userId,
      toolId,
      merchantTransactionId,
      amount
    });
    
    console.log('✅ Subscription creation result:', result.data);
    return result.data;
    
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
};

// Fix missing subscriptions for a user or all users
export const fixMissingSubscriptions = async (userId = null) => {
  try {
    console.log(`🔧 Fixing missing subscriptions${userId ? ` for user ${userId}` : ' for all users'}`);
    
    const fixSubscriptionsFunction = functions.httpsCallable('fixMissingSubscriptions');
    const result = await fixSubscriptionsFunction({
      userId
    });
    
    console.log('✅ Fix subscriptions result:', result.data);
    return result.data;
    
  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error);
    throw error;
  }
};

// Verify payment and create subscription via HTTP endpoint
export const verifyPaymentAndCreateSubscription = async (merchantTransactionId, userId = null, toolId = null) => {
  try {
    const API_BASE_URL = 'https://us-central1-rankblaze-138f7.cloudfunctions.net';
    
    const response = await fetch(`${API_BASE_URL}/verifyPaymentAndCreateSubscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantTransactionId,
        userId,
        toolId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to verify payment and create subscription');
    }
    
    console.log('✅ Payment verification and subscription creation result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error verifying payment and creating subscription:', error);
    throw error;
  }
};

// Check user's current subscriptions
export const checkUserSubscriptions = async (userId) => {
  try {
    const { db } = await import('../config/firebase');
    const { ref, get } = await import('firebase/database');
    
    const subscriptionsRef = ref(db, 'subscriptions');
    const snapshot = await get(subscriptionsRef);
    
    if (!snapshot.exists()) {
      return { subscriptions: [], hasActiveSubscriptions: false };
    }
    
    const allSubscriptions = snapshot.val();
    const userSubscriptions = Object.entries(allSubscriptions)
      .filter(([_, sub]) => sub.userId === userId)
      .map(([id, sub]) => ({ id, ...sub }));
    
    const activeSubscriptions = userSubscriptions.filter(sub => sub.status === 'active');
    
    return {
      subscriptions: userSubscriptions,
      activeSubscriptions,
      hasActiveSubscriptions: activeSubscriptions.length > 0
    };
    
  } catch (error) {
    console.error('❌ Error checking user subscriptions:', error);
    return { subscriptions: [], hasActiveSubscriptions: false };
  }
};

// Get all completed transactions for a user
export const getUserTransactions = async (userId) => {
  try {
    const { db } = await import('../config/firebase');
    const { ref, get } = await import('firebase/database');
    
    const transactionsRef = ref(db, 'transactions');
    const snapshot = await get(transactionsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allTransactions = snapshot.val();
    const userTransactions = Object.entries(allTransactions)
      .filter(([_, txn]) => txn.userId === userId && txn.status === 'completed')
      .map(([id, txn]) => ({ id, ...txn }));
    
    return userTransactions;
    
  } catch (error) {
    console.error('❌ Error getting user transactions:', error);
    return [];
  }
};

// Comprehensive fix for a specific user
export const comprehensiveUserFix = async (userId) => {
  try {
    console.log(`🔧 Running comprehensive fix for user ${userId}`);
    
    // Step 1: Get user's completed transactions
    const transactions = await getUserTransactions(userId);
    console.log(`Found ${transactions.length} completed transactions`);
    
    // Step 2: Check current subscriptions
    const { activeSubscriptions } = await checkUserSubscriptions(userId);
    console.log(`Found ${activeSubscriptions.length} active subscriptions`);
    
    // Step 3: Find transactions without corresponding subscriptions
    const missingSubscriptions = [];
    
    for (const txn of transactions) {
      const hasSubscription = activeSubscriptions.some(sub => 
        sub.tools && sub.tools.some(tool => 
          (typeof tool === 'string' ? tool === txn.toolId : tool.id === txn.toolId)
        )
      );
      
      if (!hasSubscription) {
        missingSubscriptions.push(txn);
      }
    }
    
    console.log(`Found ${missingSubscriptions.length} transactions without subscriptions`);
    
    // Step 4: Create missing subscriptions
    const results = [];
    for (const txn of missingSubscriptions) {
      try {
        const result = await createSubscriptionAfterPayment(
          txn.userId,
          txn.toolId,
          txn.id,
          txn.amount || 0
        );
        results.push({ transaction: txn.id, result, success: true });
      } catch (error) {
        results.push({ transaction: txn.id, error: error.message, success: false });
      }
    }
    
    return {
      success: true,
      totalTransactions: transactions.length,
      existingSubscriptions: activeSubscriptions.length,
      missingSubscriptions: missingSubscriptions.length,
      fixedSubscriptions: results.filter(r => r.success).length,
      failedFixes: results.filter(r => !r.success).length,
      results
    };
    
  } catch (error) {
    console.error('❌ Error in comprehensive user fix:', error);
    throw error;
  }
}; 
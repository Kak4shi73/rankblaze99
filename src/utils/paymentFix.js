import { functions } from '../config/firebase';

// Fix payment and grant tools for a specific transaction
export const fixPaymentAndGrantTools = async (merchantTransactionId, userId = null, toolId = null) => {
  try {
    console.log(`🔧 Attempting to fix payment: ${merchantTransactionId}`);
    
    const fixPaymentFunction = functions.httpsCallable('fixPaymentAndGrantTools');
    const result = await fixPaymentFunction({
      merchantTransactionId,
      userId,
      toolId
    });
    
    console.log('✅ Payment fix result:', result.data);
    return result.data;
    
  } catch (error) {
    console.error('❌ Error fixing payment:', error);
    throw error;
  }
};

// Bulk fix multiple payments
export const bulkFixPayments = async (transactions) => {
  try {
    console.log(`🔧 Attempting to bulk fix ${transactions.length} payments`);
    
    const bulkFixFunction = functions.httpsCallable('bulkFixPayments');
    const result = await bulkFixFunction({
      transactions
    });
    
    console.log('✅ Bulk fix result:', result.data);
    return result.data;
    
  } catch (error) {
    console.error('❌ Error bulk fixing payments:', error);
    throw error;
  }
};

// Check and fix payment via HTTP endpoint
export const checkAndFixPaymentHttp = async (merchantTransactionId, userId = null, toolId = null) => {
  try {
    const API_BASE_URL = 'https://us-central1-rankblaze-138f7.cloudfunctions.net';
    
    const response = await fetch(`${API_BASE_URL}/checkAndFixPayment`, {
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
      throw new Error(result.error || 'Failed to fix payment');
    }
    
    console.log('✅ HTTP fix result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error fixing payment via HTTP:', error);
    throw error;
  }
};

// Extract user ID and tool ID from transaction ID
export const parseTransactionId = (merchantTransactionId) => {
  try {
    // Format: ord_userId_toolId_timestamp
    const parts = merchantTransactionId.split('_');
    
    if (parts.length >= 3 && parts[0] === 'ord') {
      return {
        userId: parts[1],
        toolId: parts[2],
        timestamp: parts[3] || null
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error parsing transaction ID:', error);
    return null;
  }
};

// Manual tool granting function (for admin use)
export const manualGrantTool = async (userId, toolId, transactionId = null) => {
  try {
    console.log(`🔧 Manually granting tool ${toolId} to user ${userId}`);
    
    // Create a fake transaction ID if not provided
    const merchantTransactionId = transactionId || `ord_${userId}_${toolId}_${Date.now()}`;
    
    const result = await fixPaymentAndGrantTools(merchantTransactionId, userId, toolId);
    
    console.log('✅ Manual grant result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error manually granting tool:', error);
    throw error;
  }
};

// Check if user has access to a tool
export const checkUserToolAccess = async (userId, toolId) => {
  try {
    const { db } = await import('../config/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const userToolRef = doc(db, 'users', userId, 'tools', toolId);
    const userToolSnap = await getDoc(userToolRef);
    
    return {
      hasAccess: userToolSnap.exists(),
      data: userToolSnap.exists() ? userToolSnap.data() : null
    };
    
  } catch (error) {
    console.error('❌ Error checking user tool access:', error);
    return { hasAccess: false, data: null };
  }
}; 
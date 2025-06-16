/**
 * Payment Debug Utility
 * Helps troubleshoot payment-related issues by checking URL parameters and session storage
 */

// Debug function to check all possible transaction ID sources
export const debugTransactionId = () => {
  console.log('🔍 Payment Debug - Checking Transaction ID Sources:');
  
  // 1. Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlTxnId = urlParams.get('txnId') || 
                   urlParams.get('merchantTransactionId') || 
                   urlParams.get('transactionId') || 
                   urlParams.get('merchantOrderId') ||
                   urlParams.get('providerReferenceId');
  
  console.log('📍 URL Parameters:', Object.fromEntries(urlParams.entries()));
  console.log('🆔 Transaction ID from URL:', urlTxnId);
  
  // 2. Check session storage
  const sessionTxnId = sessionStorage.getItem('merchantTransactionId') || 
                       sessionStorage.getItem('lastTransactionId');
  
  console.log('💾 Session Storage Transaction ID:', sessionTxnId);
  
  // 3. Check local storage (backup)
  const localTxnId = localStorage.getItem('merchantTransactionId') || 
                     localStorage.getItem('lastTransactionId');
  
  console.log('🗄️ Local Storage Transaction ID:', localTxnId);
  
  // 4. Final recommendation
  const finalTxnId = urlTxnId || sessionTxnId || localTxnId;
  console.log('✅ Recommended Transaction ID to use:', finalTxnId);
  
  return {
    urlTxnId,
    sessionTxnId,
    localTxnId,
    finalTxnId,
    allUrlParams: Object.fromEntries(urlParams.entries())
  };
};

// Function to store transaction ID in multiple places for backup
export const storeTransactionId = (txnId) => {
  if (!txnId) return;
  
  console.log('💾 Storing transaction ID in multiple locations:', txnId);
  
  // Store in session storage (primary)
  sessionStorage.setItem('merchantTransactionId', txnId);
  sessionStorage.setItem('lastTransactionId', txnId);
  
  // Store in local storage (backup)
  localStorage.setItem('merchantTransactionId', txnId);
  localStorage.setItem('lastTransactionId', txnId);
  
  // Store with timestamp for debugging
  const timestamp = new Date().toISOString();
  sessionStorage.setItem('lastTransactionTimestamp', timestamp);
  localStorage.setItem('lastTransactionTimestamp', timestamp);
  
  console.log('✅ Transaction ID stored successfully');
};

// Function to clear all stored transaction IDs
export const clearStoredTransactionIds = () => {
  console.log('🧹 Clearing all stored transaction IDs');
  
  // Clear session storage
  sessionStorage.removeItem('merchantTransactionId');
  sessionStorage.removeItem('lastTransactionId');
  sessionStorage.removeItem('lastTransactionTimestamp');
  
  // Clear local storage
  localStorage.removeItem('merchantTransactionId');
  localStorage.removeItem('lastTransactionId');
  localStorage.removeItem('lastTransactionTimestamp');
  
  console.log('✅ All transaction IDs cleared');
};

// Function to validate transaction ID format
export const validateTransactionId = (txnId) => {
  if (!txnId) {
    return { valid: false, error: 'Transaction ID is empty or null' };
  }
  
  if (typeof txnId !== 'string') {
    return { valid: false, error: 'Transaction ID must be a string' };
  }
  
  if (txnId.length < 5) {
    return { valid: false, error: 'Transaction ID is too short' };
  }
  
  // Check if it follows our format: ord_userId_toolId_timestamp
  if (txnId.startsWith('ord_')) {
    const parts = txnId.split('_');
    if (parts.length >= 3) {
      return { 
        valid: true, 
        format: 'RankBlaze format',
        userId: parts[1],
        toolId: parts[2],
        timestamp: parts[3] || null
      };
    }
  }
  
  // Check if it's a PhonePe format
  if (txnId.startsWith('RB_')) {
    return { valid: true, format: 'PhonePe format' };
  }
  
  return { valid: true, format: 'Unknown format' };
};

// Function to extract user and tool info from transaction ID
export const parseTransactionId = (txnId) => {
  const validation = validateTransactionId(txnId);
  
  if (!validation.valid) {
    return { error: validation.error };
  }
  
  if (validation.format === 'RankBlaze format') {
    return {
      userId: validation.userId,
      toolId: validation.toolId,
      timestamp: validation.timestamp,
      format: validation.format
    };
  }
  
  return { format: validation.format };
};

// Function to check payment status with detailed logging
export const debugPaymentStatus = async (txnId) => {
  console.log('🔍 Debugging payment status for:', txnId);
  
  const validation = validateTransactionId(txnId);
  console.log('✅ Transaction ID validation:', validation);
  
  if (!validation.valid) {
    return { error: validation.error };
  }
  
  try {
    // Try to verify payment status
    const response = await fetch(`https://us-central1-rankblaze-138f7.cloudfunctions.net/api/verifyPhonePePayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txnId }),
    });
    
    console.log('📊 Payment verification response status:', response.status);
    
    const result = await response.json();
    console.log('📋 Payment verification result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    return { error: error.message };
  }
};

// Main debug function to run all checks
export const runPaymentDebug = async () => {
  console.log('🚀 Running comprehensive payment debug...');
  
  // 1. Check transaction ID sources
  const txnDebug = debugTransactionId();
  
  // 2. If we have a transaction ID, check its status
  if (txnDebug.finalTxnId) {
    const statusDebug = await debugPaymentStatus(txnDebug.finalTxnId);
    return {
      transactionDebug: txnDebug,
      statusDebug
    };
  }
  
  return {
    transactionDebug: txnDebug,
    error: 'No transaction ID found to debug'
  };
};

// Export for global access in browser console
if (typeof window !== 'undefined') {
  window.paymentDebug = {
    debugTransactionId,
    storeTransactionId,
    clearStoredTransactionIds,
    validateTransactionId,
    parseTransactionId,
    debugPaymentStatus,
    runPaymentDebug
  };
  
  console.log('🔧 Payment debug utilities available at window.paymentDebug');
} 
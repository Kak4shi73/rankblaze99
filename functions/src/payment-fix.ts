import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Comprehensive Payment Fix Function
export const fixPaymentAndGrantTools = functions.https.onCall(
  async (data: { merchantTransactionId: string, userId?: string, toolId?: string }, context) => {
    try {
      const { merchantTransactionId, userId: providedUserId, toolId: providedToolId } = data;
      
      if (!merchantTransactionId) {
        throw new functions.https.HttpsError('invalid-argument', 'merchantTransactionId is required');
      }

      console.log(`🔧 Fixing payment for transaction: ${merchantTransactionId}`);
      
      const db = admin.firestore();
      const rtdb = admin.database();
      
      // Step 1: Extract userId and toolId from transaction ID if not provided
      let userId = providedUserId;
      let toolId = providedToolId;
      
      if (!userId || !toolId) {
        // Parse transaction ID format: ord_userId_toolId_timestamp
        const parts = merchantTransactionId.split('_');
        if (parts.length >= 3 && parts[0] === 'ord') {
          userId = userId || parts[1];
          toolId = toolId || parts[2];
        }
      }
      
      if (!userId || !toolId) {
        throw new functions.https.HttpsError('invalid-argument', 'Could not determine userId or toolId');
      }
      
      console.log(`👤 User: ${userId}, 🔧 Tool: ${toolId}`);
      
      // Step 2: Check if user already has access to this tool
      const userToolRef = db.collection('users').doc(userId).collection('tools').doc(toolId);
      const userToolSnap = await userToolRef.get();
      
      if (userToolSnap.exists) {
        console.log(`✅ User already has access to tool ${toolId}`);
        return { 
          success: true, 
          message: 'User already has access to this tool',
          alreadyGranted: true 
        };
      }
      
      // Step 3: Grant tool access
      await userToolRef.set({
        activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        toolId,
        source: 'manual_fix',
        transactionId: merchantTransactionId,
        paymentMethod: 'PhonePe'
      });
      
      console.log(`✅ Tool access granted in Firestore`);
      
      // Step 4: Update user's tools array
      await db.collection('users').doc(userId).update({
        tools: admin.firestore.FieldValue.arrayUnion(toolId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastPayment: {
          toolId,
          transactionId: merchantTransactionId,
          date: admin.firestore.FieldValue.serverTimestamp(),
          method: 'PhonePe',
          status: 'completed'
        }
      });
      
      console.log(`✅ User tools array updated`);
      
      // Step 5: Create/Update transaction record
      await db.collection('transactions').doc(merchantTransactionId).set({
        userId,
        toolId,
        status: 'completed',
        merchantTransactionId,
        paymentMethod: 'PhonePe',
        source: 'manual_fix',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`✅ Transaction record updated`);
      
      // Step 6: Update Realtime Database for quick access
      await rtdb.ref(`users/${userId}/tools/${toolId}`).set({
        activatedAt: Date.now(),
        toolId,
        source: 'manual_fix',
        transactionId: merchantTransactionId
      });
      
      console.log(`✅ Realtime Database updated`);
      
      // Step 7: Create payment record
      await db.collection('user_payments').add({
        userId,
        toolId,
        paymentMethod: 'PhonePe',
        status: 'completed',
        merchantTransactionId,
        source: 'manual_fix',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Payment record created`);
      
      return {
        success: true,
        message: 'Tool access granted successfully',
        userId,
        toolId,
        transactionId: merchantTransactionId
      };
      
    } catch (error) {
      console.error('❌ Error in fixPaymentAndGrantTools:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fix payment and grant tools');
    }
  }
);

// Bulk fix function for multiple transactions
export const bulkFixPayments = functions.https.onCall(
  async (data: { transactions: Array<{ merchantTransactionId: string, userId?: string, toolId?: string }> }, context) => {
    try {
      const { transactions } = data;
      
      if (!transactions || !Array.isArray(transactions)) {
        throw new functions.https.HttpsError('invalid-argument', 'transactions array is required');
      }
      
      const results = [];
      
      for (const txn of transactions) {
        try {
          const result = await fixPaymentAndGrantTools.run(txn, context);
          results.push({ ...txn, result, success: true });
        } catch (error) {
          results.push({ ...txn, error: error.message, success: false });
        }
      }
      
      return {
        success: true,
        results,
        total: transactions.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
      
    } catch (error) {
      console.error('❌ Error in bulkFixPayments:', error);
      throw new functions.https.HttpsError('internal', 'Failed to bulk fix payments');
    }
  }
);

// Check payment status and grant tools if needed
export const checkAndFixPayment = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { merchantTransactionId, userId, toolId } = req.method === 'GET' ? req.query : req.body;
    
    if (!merchantTransactionId) {
      res.status(400).json({ success: false, error: 'merchantTransactionId is required' });
      return;
    }
    
    // Call the fix function
    const result = await fixPaymentAndGrantTools.run(
      { merchantTransactionId: merchantTransactionId as string, userId: userId as string, toolId: toolId as string },
      { auth: null, rawRequest: req } as any
    );
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Error in checkAndFixPayment:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}); 
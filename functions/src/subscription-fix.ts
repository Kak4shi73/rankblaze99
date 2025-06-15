import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Fix subscription creation after payment
export const createSubscriptionAfterPayment = functions.https.onCall(
  async (data: { 
    userId: string, 
    toolId: string, 
    merchantTransactionId: string,
    amount?: number,
    duration?: number 
  }, context) => {
    try {
      const { userId, toolId, merchantTransactionId, amount = 0, duration = 30 } = data;
      
      if (!userId || !toolId || !merchantTransactionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
      }

      console.log(`🔧 Creating subscription for user ${userId}, tool ${toolId}`);
      
      const db = admin.firestore();
      const rtdb = admin.database();
      
      // Calculate subscription dates
      const startDate = Date.now();
      const endDate = startDate + (duration * 24 * 60 * 60 * 1000); // duration in days
      
      // Create subscription ID
      const subscriptionId = `sub_${userId}_${toolId}_${Date.now()}`;
      
      // Step 1: Create subscription in Realtime Database (this is what ToolAccess checks)
      const subscriptionData = {
        userId,
        status: 'active',
        plan: 'premium',
        startDate,
        endDate,
        tools: [{
          id: toolId,
          name: getToolName(toolId),
          status: 'active'
        }],
        paymentDetails: {
          transactionId: merchantTransactionId,
          amount,
          method: 'PhonePe',
          date: startDate
        },
        createdAt: startDate,
        updatedAt: startDate
      };
      
      await rtdb.ref(`subscriptions/${subscriptionId}`).set(subscriptionData);
      console.log(`✅ Subscription created in Realtime Database: ${subscriptionId}`);
      
      // Step 2: Also create in Firestore for consistency
      await db.collection('subscriptions').doc(subscriptionId).set({
        ...subscriptionData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Subscription created in Firestore: ${subscriptionId}`);
      
      // Step 3: Update user's subscription reference
      await rtdb.ref(`users/${userId}/activeSubscriptions/${toolId}`).set({
        subscriptionId,
        toolId,
        status: 'active',
        startDate,
        endDate
      });
      console.log(`✅ User subscription reference updated`);
      
      // Step 4: Grant tool access (if not already done)
      await rtdb.ref(`users/${userId}/tools/${toolId}`).set({
        activatedAt: startDate,
        toolId,
        source: 'subscription',
        subscriptionId,
        transactionId: merchantTransactionId
      });
      console.log(`✅ Tool access granted`);
      
      return {
        success: true,
        subscriptionId,
        message: 'Subscription created successfully',
        data: subscriptionData
      };
      
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create subscription');
    }
  }
);

// Fix existing payments by creating missing subscriptions
export const fixMissingSubscriptions = functions.https.onCall(
  async (data: { userId?: string }, context) => {
    try {
      const { userId } = data;
      
      console.log(`🔧 Fixing missing subscriptions${userId ? ` for user ${userId}` : ' for all users'}`);
      
      const db = admin.firestore();
      const rtdb = admin.database();
      
      // Get all completed transactions
      const transactionsRef = rtdb.ref('transactions');
      const transactionsSnapshot = await transactionsRef.once('value');
      
      if (!transactionsSnapshot.exists()) {
        return { success: true, message: 'No transactions found', fixed: 0 };
      }
      
      const transactions = transactionsSnapshot.val();
      const results = [];
      let fixedCount = 0;
      
      for (const [txnId, txnData] of Object.entries(transactions)) {
        const transaction = txnData as any;
        
        // Skip if not completed or if userId filter doesn't match
        if (transaction.status !== 'completed') continue;
        if (userId && transaction.userId !== userId) continue;
        
        const { userId: txnUserId, toolId } = transaction;
        
        if (!txnUserId || !toolId) continue;
        
        // Check if subscription already exists
        const subscriptionsSnapshot = await rtdb.ref('subscriptions')
          .orderByChild('userId')
          .equalTo(txnUserId)
          .once('value');
        
        let hasSubscriptionForTool = false;
        
        if (subscriptionsSnapshot.exists()) {
          const subscriptions = subscriptionsSnapshot.val();
          hasSubscriptionForTool = Object.values(subscriptions).some((sub: any) => 
            sub.tools && sub.tools.some((tool: any) => 
              (typeof tool === 'string' ? tool === toolId : tool.id === toolId)
            )
          );
        }
        
        if (!hasSubscriptionForTool) {
          try {
            // Create missing subscription
            const result = await createSubscriptionAfterPayment.run({
              userId: txnUserId,
              toolId,
              merchantTransactionId: txnId,
              amount: transaction.amount || 0
            }, context);
            
            results.push({ txnId, result, success: true });
            fixedCount++;
            
          } catch (error) {
            results.push({ txnId, error: (error as any)?.message || 'Unknown error', success: false });
          }
        }
      }
      
      return {
        success: true,
        message: `Fixed ${fixedCount} missing subscriptions`,
        fixed: fixedCount,
        results
      };
      
    } catch (error) {
      console.error('❌ Error fixing missing subscriptions:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fix missing subscriptions');
    }
  }
);

// Enhanced payment verification that creates subscription
export const verifyPaymentAndCreateSubscription = functions.https.onRequest(async (req, res) => {
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
    
    const rtdb = admin.database();
    
    // Check if transaction exists and is completed
    const transactionRef = rtdb.ref(`transactions/${merchantTransactionId}`);
    const transactionSnapshot = await transactionRef.once('value');
    
    if (!transactionSnapshot.exists()) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }
    
    const transactionData = transactionSnapshot.val();
    
    if (transactionData.status !== 'completed') {
      res.status(400).json({ success: false, error: 'Transaction not completed' });
      return;
    }
    
    // Extract user and tool info
    const finalUserId = userId || transactionData.userId;
    const finalToolId = toolId || transactionData.toolId;
    
    if (!finalUserId || !finalToolId) {
      res.status(400).json({ success: false, error: 'Could not determine userId or toolId' });
      return;
    }
    
    // Create subscription
    const subscriptionResult = await createSubscriptionAfterPayment.run({
      userId: finalUserId,
      toolId: finalToolId,
      merchantTransactionId: merchantTransactionId as string,
      amount: transactionData.amount || 0
    }, { auth: null, rawRequest: req } as any);
    
    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription created',
      subscription: subscriptionResult
    });
    
  } catch (error) {
    console.error('❌ Error in verifyPaymentAndCreateSubscription:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Helper function to get tool name
function getToolName(toolId: string): string {
  const toolNames: { [key: string]: string } = {
    'chatgpt_plus': 'ChatGPT Plus',
    'envato_elements': 'Envato Elements',
    'canva_pro': 'Canva Pro',
    'storyblocks': 'Storyblocks',
    'semrush': 'SEMrush',
    'stealth_writer': 'Stealth Writer',
    'hix_bypass': 'Hix Bypass'
  };
  
  return toolNames[toolId] || toolId;
} 
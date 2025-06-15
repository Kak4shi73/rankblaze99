import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Type declaration for node-fetch
const fetch = require('node-fetch');

const firestore = admin.firestore();

// PhonePe Configuration
const PHONEPE_CONFIG = {
  merchantId: 'PGTESTPAYUAT86',
  saltKey: '96434309-7796-489d-8924-ab56988a6076',
  saltIndex: 1,
  apiEndpoint: 'https://api-preprod.phonepe.com/apis/pg-sandbox'
};

// Helper function to generate PhonePe checksum
const generateChecksum = (payload: string, endpoint: string): string => {
  const string = payload + endpoint + PHONEPE_CONFIG.saltKey;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  return sha256 + '###' + PHONEPE_CONFIG.saltIndex;
};

// Helper function to get tool name
const getToolName = (toolId: string): string => {
  const toolNames: { [key: string]: string } = {
    'chatgpt-plus': 'ChatGPT Plus',
    'envato-elements': 'Envato Elements',
    'canva-pro': 'Canva Pro',
    'storyblocks': 'Storyblocks',
    'semrush': 'SEMrush',
    'stealth-writer': 'Stealth Writer',
    'hix-bypass': 'Hix Bypass'
  };
  return toolNames[toolId] || 'Premium Tool';
};

// Step 1: Initialize PhonePe Payment
export const initializePhonePePayment = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const { orderId, amount, userId, toolId } = req.body;

    if (!orderId || !amount || !userId || !toolId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    const merchantTransactionId = `RB_${orderId}_${Date.now()}`;
    const toolName = getToolName(toolId);

    // PhonePe payment payload
    const paymentPayload = {
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // Convert to paise
      redirectUrl: `https://rankblaze99.web.app/tool/${toolId}?txnId=${merchantTransactionId}`,
      redirectMode: 'POST',
      callbackUrl: `https://us-central1-rankblaze-138f7.cloudfunctions.net/phonePeWebhookFirestore`,
      mobileNumber: '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    const endpoint = '/pg/v1/pay';
    const checksum = generateChecksum(base64Payload, endpoint);

    // Call PhonePe API
    const response = await fetch(`${PHONEPE_CONFIG.apiEndpoint}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const result = await response.json() as any;

    if (result.success) {
      // Update order in Firestore
      await firestore.collection('orders').doc(orderId).update({
        merchantTransactionId,
        paymentInitiatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentStatus: 'initiated',
        phonePeResponse: result
      });

      res.json({
        success: true,
        merchantTransactionId,
        paymentUrl: result.data.instrumentResponse.redirectInfo.url,
        message: 'Payment initialized successfully'
      });
    } else {
      console.error('PhonePe API Error:', result);
      res.status(400).json({
        success: false,
        error: 'Failed to initialize payment',
        details: result
      });
    }

  } catch (error: any) {
    console.error('Error initializing PhonePe payment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Step 2: Verify PhonePe Payment Status
export const verifyPhonePePayment = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const { merchantTransactionId } = req.body;

    if (!merchantTransactionId) {
      res.status(400).json({ error: 'Missing merchantTransactionId' });
      return;
    }

    const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantTransactionId}`;
    const checksum = generateChecksum('', endpoint);

    // Call PhonePe status API
    const response = await fetch(`${PHONEPE_CONFIG.apiEndpoint}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId
      }
    });

    const result = await response.json() as any;

    if (result.success && result.data.state === 'COMPLETED') {
      res.json({
        success: true,
        status: 'completed',
        transactionId: result.data.transactionId,
        amount: result.data.amount / 100, // Convert back to rupees
        data: result.data
      });
    } else {
      res.json({
        success: false,
        status: result.data?.state || 'failed',
        message: result.message || 'Payment not completed'
      });
    }

  } catch (error: any) {
    console.error('Error verifying PhonePe payment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Step 3: PhonePe Webhook Handler (Firestore-based)
export const phonePeWebhookFirestore = functions.https.onRequest(async (req, res) => {
  try {
    console.log('📞 PhonePe Webhook received (Firestore):', req.body);

    const { response } = req.body;
    
    if (!response) {
      console.error('❌ No response in webhook');
      res.status(400).send('Invalid webhook data');
      return;
    }

    // Decode the base64 response
    const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
    console.log('📋 Decoded response:', decodedResponse);

    const { merchantTransactionId, transactionId, amount, state } = decodedResponse;

    if (state === 'COMPLETED') {
      console.log('✅ Payment completed for:', merchantTransactionId);

      // Find the order
      const ordersSnapshot = await firestore.collection('orders')
        .where('merchantTransactionId', '==', merchantTransactionId)
        .get();

      if (ordersSnapshot.empty) {
        console.error('❌ Order not found for merchantTransactionId:', merchantTransactionId);
        res.status(404).send('Order not found');
        return;
      }

      const orderDoc = ordersSnapshot.docs[0];
      const orderData = orderDoc.data();
      const { userId, toolId, toolName } = orderData;

      // Step 4: Activate subscription in Firestore
      const subscriptionId = `${userId}_${toolId}`;
      const subscriptionData = {
        userId,
        toolId,
        toolName,
        orderId: orderDoc.id,
        transactionId,
        merchantTransactionId,
        amount: amount / 100, // Convert to rupees
        isActive: true,
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create subscription
      await firestore.collection('subscriptions').doc(subscriptionId).set(subscriptionData);
      console.log('✅ Subscription created in Firestore:', subscriptionId);

      // Update order status
      await firestore.collection('orders').doc(orderDoc.id).update({
        paymentStatus: 'completed',
        transactionId,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        subscriptionId,
        webhookResponse: decodedResponse
      });
      console.log('✅ Order updated as completed');

      // Update user's active subscriptions
      const userRef = firestore.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const activeSubscriptions = userData?.activeSubscriptions || [];
        
        if (!activeSubscriptions.includes(toolId)) {
          activeSubscriptions.push(toolId);
        }

        await userRef.update({
          activeSubscriptions,
          totalSpent: (userData?.totalSpent || 0) + (amount / 100),
          lastPurchase: {
            toolId,
            toolName,
            amount: amount / 100,
            date: admin.firestore.FieldValue.serverTimestamp()
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ User updated with new subscription');
      }

      // Create payment record
      await firestore.collection('payments').add({
        userId,
        toolId,
        toolName,
        orderId: orderDoc.id,
        transactionId,
        merchantTransactionId,
        amount: amount / 100,
        status: 'completed',
        paymentMethod: 'PhonePe',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        webhookData: decodedResponse
      });
      console.log('✅ Payment record created');

      res.status(200).send('SUCCESS');
    } else {
      console.log('❌ Payment failed or pending:', state);
      
      // Update order with failed status
      const ordersSnapshot = await firestore.collection('orders')
        .where('merchantTransactionId', '==', merchantTransactionId)
        .get();

      if (!ordersSnapshot.empty) {
        const orderDoc = ordersSnapshot.docs[0];
        await firestore.collection('orders').doc(orderDoc.id).update({
          paymentStatus: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          webhookResponse: decodedResponse
        });
      }

      res.status(200).send('FAILED');
    }

  } catch (error: any) {
    console.error('❌ Error in PhonePe webhook (Firestore):', error);
    res.status(500).send('Internal server error');
  }
});

// Step 4: Get User Subscriptions
export const getUserSubscriptions = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      res.status(400).json({ error: 'Missing userId parameter' });
      return;
    }

    const subscriptionsSnapshot = await firestore.collection('subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const subscriptions: any[] = [];
    const now = new Date();

    subscriptionsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Check if subscription is still valid
      if (data.expiresAt.toDate() > now) {
        subscriptions.push({
          id: doc.id,
          ...data,
          expiresAt: data.expiresAt.toDate().toISOString()
        });
      }
    });

    res.json({
      success: true,
      subscriptions,
      count: subscriptions.length
    });

  } catch (error: any) {
    console.error('Error getting user subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Step 5: Check Tool Access
export const checkToolAccess = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    const { userId, toolId } = req.query;

    if (!userId || !toolId) {
      res.status(400).json({ error: 'Missing userId or toolId parameter' });
      return;
    }

    const subscriptionId = `${userId}_${toolId}`;
    const subscriptionDoc = await firestore.collection('subscriptions').doc(subscriptionId).get();

    if (!subscriptionDoc.exists) {
      res.json({
        hasAccess: false,
        access: null,
        message: 'No subscription found'
      });
      return;
    }

    const subscription = subscriptionDoc.data();
    const isActive = subscription?.isActive && new Date() < subscription.expiresAt.toDate();

    res.json({
      hasAccess: isActive,
      access: isActive ? {
        ...subscription,
        expiresAt: subscription.expiresAt.toDate().toISOString()
      } : null,
      message: isActive ? 'Access granted' : 'Subscription expired or inactive'
    });

  } catch (error: any) {
    console.error('Error checking tool access:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Migration utility: Move data from Realtime DB to Firestore
export const migrateToFirestore = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  try {
    console.log('🔄 Starting migration from Realtime DB to Firestore...');
    
    const rtdb = admin.database();
    let migratedCount = 0;

    // Migrate users
    const usersSnapshot = await rtdb.ref('users').once('value');
    const usersData = usersSnapshot.val();
    
    if (usersData) {
      for (const [userId, userData] of Object.entries(usersData as any)) {
        await firestore.collection('users').doc(userId).set({
          ...(userData as any),
          migratedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        migratedCount++;
      }
      console.log(`✅ Migrated ${Object.keys(usersData).length} users`);
    }

    // Migrate transactions to orders and payments
    const transactionsSnapshot = await rtdb.ref('transactions').once('value');
    const transactionsData = transactionsSnapshot.val();
    
    if (transactionsData) {
      for (const [txnId, txnData] of Object.entries(transactionsData as any)) {
        const txn = txnData as any;
        
        // Create order
        const orderRef = await firestore.collection('orders').add({
          userId: txn.userId,
          toolId: txn.toolId,
          toolName: getToolName(txn.toolId),
          amount: txn.amount,
          paymentStatus: txn.status === 'completed' ? 'completed' : 'failed',
          createdAt: txn.timestamp ? new Date(txn.timestamp) : admin.firestore.FieldValue.serverTimestamp(),
          migratedFrom: 'realtime-db',
          originalTxnId: txnId
        });

        // Create payment record if completed
        if (txn.status === 'completed') {
          await firestore.collection('payments').add({
            userId: txn.userId,
            toolId: txn.toolId,
            toolName: getToolName(txn.toolId),
            orderId: orderRef.id,
            transactionId: txn.transactionId || txnId,
            amount: txn.amount,
            status: 'completed',
            paymentMethod: 'PhonePe',
            createdAt: txn.timestamp ? new Date(txn.timestamp) : admin.firestore.FieldValue.serverTimestamp(),
            migratedFrom: 'realtime-db'
          });

          // Create subscription
          const subscriptionId = `${txn.userId}_${txn.toolId}`;
          await firestore.collection('subscriptions').doc(subscriptionId).set({
            userId: txn.userId,
            toolId: txn.toolId,
            toolName: getToolName(txn.toolId),
            orderId: orderRef.id,
            transactionId: txn.transactionId || txnId,
            amount: txn.amount,
            isActive: true,
            subscribedAt: txn.timestamp ? new Date(txn.timestamp) : admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            migratedFrom: 'realtime-db'
          });
        }
        
        migratedCount++;
      }
      console.log(`✅ Migrated ${Object.keys(transactionsData).length} transactions`);
    }

    res.json({
      success: true,
      message: 'Migration completed successfully',
      migratedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in migration:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    });
  }
}); 
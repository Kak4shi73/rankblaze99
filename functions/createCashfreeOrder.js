const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const Cashfree = require('cashfree-pg-sdk-nodejs');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Express app for HTTP endpoints
const app = express();

// Remove the previous CORS configuration and add this instead
app.use(
  cors({
    origin: ["https://www.rankblaze.in", "https://rankblaze.in", "http://localhost:3000", "http://localhost:5000"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    maxAge: 86400 // Cache preflight request for 24 hours
  })
);

app.use(express.json());

// Get the Cashfree credentials from Firebase config
// In local development, you can use environment variables as fallback
const getConfig = () => {
  let appId, secretKey;
  
  try {
    appId = functions.config().cashfree?.app_id;
    secretKey = functions.config().cashfree?.secret_key;
  } catch (error) {
    console.log('Error reading Firebase config, using fallback values:', error);
  }
  
  return {
    env: process.env.NODE_ENV === 'production' ? Cashfree.Env.PROD : Cashfree.Env.SANDBOX,
    clientId: appId || process.env.CASHFREE_APP_ID || '9721923531a775ba3e2dcb8259291279',
    clientSecret: secretKey || process.env.CASHFREE_SECRET_KEY || 'cfsk_ma_prod_7b3a016d277614ba6a498a17ccf451c2_f7f4ac4e',
  };
};

// Initialize Cashfree SDK
const initializeCashfree = () => {
  const config = getConfig();
  console.log('Initializing Cashfree with config:', {
    env: config.env,
    clientId: config.clientId,
    clientSecret: '***' // Hiding secret key in logs
  });
  
  try {
    Cashfree.PG.initialize(config);
    return Cashfree;
  } catch (error) {
    console.error('Error initializing Cashfree:', error);
    throw error;
  }
};

// Update the Firestore collection name for saving orders
const ORDERS_COLLECTION = 'Cashfree orders';

/**
 * Creates a new Cashfree order
 * This function can be called as a Firebase callable function
 */
exports.createCashfreeOrder = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated (optional)
  if (!context.auth && process.env.NODE_ENV === 'production') {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to create an order'
    );
  }

  try {
    // Initialize Cashfree
    initializeCashfree();
    
    const { amount, currency = 'INR', customerName, customerPhone, customerEmail, notes = {} } = data;

    // Validate amount (required and positive number)
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Amount must be a positive number'
      );
    }

    // Add user information to notes if authenticated
    const orderNotes = {
      ...notes,
      userId: context.auth?.uid || 'anonymous',
    };

    // Generate a unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Create the order request
    const orderRequest = {
      order_id: data.orderId || orderId,
      order_amount: amount,
      order_currency: currency,
      order_note: JSON.stringify(orderNotes),
      customer_details: {
        customer_id: context.auth?.uid || `cust_${Date.now()}`,
        customer_name: customerName || 'Guest User',
        customer_email: customerEmail || 'guest@example.com',
        customer_phone: customerPhone || '9999999999',
      },
    };

    console.log('Creating Cashfree order with request:', orderRequest);

    // Create the order with Cashfree
    const response = await Cashfree.PG.orders.create(orderRequest);
    console.log('Cashfree order created successfully:', response);

    // Save order to Firestore
    await admin.firestore().collection(ORDERS_COLLECTION).doc(response.order_id).set({
      order_id: response.order_id,
      payment_session_id: response.payment_session_id,
      amount: response.order_amount,
      currency: response.order_currency,
      customer_name: orderRequest.customer_details.customer_name,
      customer_email: orderRequest.customer_details.customer_email,
      customer_phone: orderRequest.customer_details.customer_phone,
      notes: orderNotes,
      status: 'created',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Also save to Realtime Database (for backward compatibility)
    await admin.database().ref(`orders/${response.order_id}`).set({
      userId: context.auth?.uid || 'anonymous',
      amount: response.order_amount,
      status: 'created',
      paymentMethod: 'cashfree',
      orderId: response.order_id,
      paymentSessionId: response.payment_session_id,
      createdAt: new Date().toISOString(),
    });

    // Return the order details to the client
    return {
      orderId: response.order_id,
      payment_session_id: response.payment_session_id,
      amount: response.order_amount,
      currency: response.order_currency
    };
  } catch (error) {
    console.error('Error creating Cashfree order:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to create Cashfree order'
    );
  }
});

/**
 * HTTP endpoint to create a Cashfree order
 */
app.post('/createCashfreeOrder', async (req, res) => {
  try {
    // Initialize Cashfree
    initializeCashfree();
    
    const { orderId, amount, customerName, customerPhone, customerEmail, notes = {} } = req.body;

    // Validate amount (required and positive number)
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).send({ error: 'Amount must be a positive number' });
    }

    // Generate a unique order ID if not provided
    const order_id = orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Create the order request
    const orderRequest = {
      order_id,
      order_amount: amount,
      order_currency: 'INR',
      order_note: JSON.stringify(notes),
      customer_details: {
        customer_id: `cust_${customerPhone || Date.now()}`,
        customer_name: customerName || 'Guest User',
        customer_email: customerEmail || 'guest@example.com',
        customer_phone: customerPhone || '9999999999',
      },
    };

    console.log('Creating Cashfree order via HTTP with request:', orderRequest);

    // Create the order with Cashfree
    const response = await Cashfree.PG.orders.create(orderRequest);
    console.log('Cashfree order created successfully via HTTP:', response);

    // Save order to Firestore
    await admin.firestore().collection(ORDERS_COLLECTION).doc(response.order_id).set({
      order_id: response.order_id,
      payment_session_id: response.payment_session_id,
      amount: response.order_amount,
      currency: response.order_currency,
      customer_name: orderRequest.customer_details.customer_name,
      customer_email: orderRequest.customer_details.customer_email,
      customer_phone: orderRequest.customer_details.customer_phone,
      notes: notes,
      status: 'created',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Also save to Realtime Database (for backward compatibility)
    await admin.database().ref(`orders/${response.order_id}`).set({
      userId: notes.userId || 'anonymous',
      amount: response.order_amount,
      status: 'created',
      paymentMethod: 'cashfree',
      orderId: response.order_id,
      paymentSessionId: response.payment_session_id,
      createdAt: new Date().toISOString(),
    });

    // Set proper CORS headers explicitly
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.set('Access-Control-Allow-Credentials', 'true');
    
    res.status(200).send(response);
  } catch (error) {
    console.error('Error creating Cashfree order:', error);
    res.status(500).send({ 
      error: error.message || 'Failed to create Cashfree order'
    });
  }
});

/**
 * Verifies Cashfree payment
 */
exports.verifyCashfreePayment = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated (optional)
  if (!context.auth && process.env.NODE_ENV === 'production') {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to verify payment'
    );
  }

  try {
    // Initialize Cashfree
    initializeCashfree();
    
    const { orderId, orderAmount } = data;

    // Validate required parameters
    if (!orderId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing order ID'
      );
    }

    // Verify payment
    const response = await Cashfree.PG.orders.fetchPayments(orderId);
    console.log('Payment verification response:', response);

    // Check if payment is successful
    const isSuccessful = response.some(payment => 
      payment.payment_status === 'SUCCESS' && 
      parseFloat(payment.payment_amount) === parseFloat(orderAmount)
    );

    // Update order status in Firestore if payment is successful
    if (isSuccessful) {
      await admin.firestore().collection(ORDERS_COLLECTION).doc(orderId).update({
        status: 'completed',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        payment_verified: true,
        payment_details: response
      });
      
      // Also update Realtime Database (for backward compatibility)
      await admin.database().ref(`orders/${orderId}`).update({
        status: 'completed',
        paymentVerified: true,
        updatedAt: new Date().toISOString()
      });
    }

    return { isValid: isSuccessful };
  } catch (error) {
    console.error('Error verifying Cashfree payment:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to verify Cashfree payment'
    );
  }
});

/**
 * HTTP endpoint for verifying payment
 */
app.post('/verifyCashfreePayment', async (req, res) => {
  try {
    // Initialize Cashfree
    initializeCashfree();
    
    const { orderId, orderAmount } = req.body;

    // Validate required parameters
    if (!orderId) {
      return res.status(400).send({ error: 'Missing order ID' });
    }

    // Verify payment
    const response = await Cashfree.PG.orders.fetchPayments(orderId);
    console.log('Payment verification response via HTTP:', response);

    // Check if payment is successful
    const isSuccessful = response.some(payment => 
      payment.payment_status === 'SUCCESS' && 
      (orderAmount ? parseFloat(payment.payment_amount) === parseFloat(orderAmount) : true)
    );

    // Update order status in Firestore if payment is successful
    if (isSuccessful) {
      await admin.firestore().collection(ORDERS_COLLECTION).doc(orderId).update({
        status: 'completed',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        payment_verified: true,
        payment_details: response
      });
      
      // Also update Realtime Database (for backward compatibility)
      await admin.database().ref(`orders/${orderId}`).update({
        status: 'completed',
        paymentVerified: true,
        updatedAt: new Date().toISOString()
      });
    }

    // Set proper CORS headers explicitly
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.set('Access-Control-Allow-Credentials', 'true');
    
    res.status(200).send({ isValid: isSuccessful });
  } catch (error) {
    console.error('Error verifying Cashfree payment:', error);
    res.status(500).send({ 
      error: error.message || 'Failed to verify Cashfree payment'
    });
  }
});

// Handle preflight OPTIONS requests for all routes
app.options('*', (req, res) => {
  // Set explicit CORS headers for OPTIONS requests
  res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).send('');
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

// Export additional Cashfree webhooks if needed
exports.cashfreeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    // Verify webhook signature to ensure it's from Cashfree
    // Implementation depends on Cashfree webhook documentation
    
    const event = req.body;
    console.log('Received Cashfree webhook:', event);
    
    // Process different event types
    if (event.data && event.data.payment && event.data.payment.payment_status === 'SUCCESS') {
      // Handle successful payment
      const orderId = event.data.order.order_id;
      
      // Update Firestore
      await admin.firestore().collection(ORDERS_COLLECTION).doc(orderId).update({
        status: 'completed',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        payment_verified: true,
        payment_details: event.data.payment
      });
      
      // Update Realtime Database (for backward compatibility)
      await admin.database().ref(`orders/${orderId}`).update({
        status: 'completed',
        paymentVerified: true,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Payment successful for order:', orderId);
    }
    
    res.status(200).send({ received: true });
  } catch (error) {
    console.error('Error processing Cashfree webhook:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
}); 
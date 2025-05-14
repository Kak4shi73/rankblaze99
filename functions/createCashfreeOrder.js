const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const Cashfree = require('cashfree-pg-sdk-nodejs');

// Express app for HTTP endpoints
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Get the Cashfree credentials from Firebase config
// In local development, you can use environment variables as fallback
const getConfig = () => {
  return {
    env: process.env.NODE_ENV === 'production' ? Cashfree.Env.PROD : Cashfree.Env.SANDBOX,
    clientId: functions.config().cashfree?.app_id || process.env.CASHFREE_APP_ID || '9721923531a775ba3e2dcb8259291279',
    clientSecret: functions.config().cashfree?.secret_key || process.env.CASHFREE_SECRET_KEY || 'cfsk_ma_prod_7b3a016d277614ba6a498a17ccf451c2_f7f4ac4e',
  };
};

// Initialize Cashfree SDK
const initializeCashfree = () => {
  const config = getConfig();
  Cashfree.PG.initialize(config);
  return Cashfree;
};

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

    // Create the order with Cashfree
    const response = await Cashfree.PG.orders.create(orderRequest);
    console.log('Cashfree order created successfully:', response);

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

    // Create the order with Cashfree
    const response = await Cashfree.PG.orders.create(orderRequest);
    console.log('Cashfree order created successfully via HTTP:', response);

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

    res.status(200).send({ isValid: isSuccessful });
  } catch (error) {
    console.error('Error verifying Cashfree payment:', error);
    res.status(500).send({ 
      error: error.message || 'Failed to verify Cashfree payment'
    });
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

// Export additional Cashfree webhooks if needed
exports.cashfreeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Verify webhook signature to ensure it's from Cashfree
    // Implementation depends on Cashfree webhook documentation
    
    const event = req.body;
    console.log('Received Cashfree webhook:', event);
    
    // Process different event types
    if (event.data && event.data.payment && event.data.payment.payment_status === 'SUCCESS') {
      // Handle successful payment
      // Update your database, etc.
      console.log('Payment successful for order:', event.data.order.order_id);
    }
    
    res.status(200).send({ received: true });
  } catch (error) {
    console.error('Error processing Cashfree webhook:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
}); 
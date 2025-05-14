const functions = require('firebase-functions');
const Razorpay = require('razorpay');

// Initialize Razorpay with the provided API keys
// In production, use: functions.config().razorpay.key_id and functions.config().razorpay.key_secret
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_OChtDbosOz00ju',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '0A8EfMcUW90DE57mNtffGeqy',
});

/**
 * Creates a new Razorpay order
 * This function can be called as an HTTP endpoint or a callable function
 */
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated (optional, remove if you want to allow unauthenticated calls)
  if (!context.auth && process.env.NODE_ENV === 'production') {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to create an order'
    );
  }

  try {
    const { amount, currency = 'INR', receipt, notes = {} } = data;

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

    // Create the order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount), // Make sure amount is an integer
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: orderNotes,
    });

    console.log('Razorpay order created successfully:', order.id);

    // Return the order details to the client
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to create Razorpay order'
    );
  }
});

/**
 * HTTP endpoint version of the same function (can be used directly from fetch)
 */
exports.createRazorpayOrderHttp = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Get data from request body
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    // Validate amount (required and positive number)
    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400).send({ error: 'Amount must be a positive number' });
      return;
    }

    // Create the order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount), // Make sure amount is an integer
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes,
    });

    console.log('Razorpay order created via HTTP:', order.id);

    // Return the order details to the client
    res.status(200).send({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).send({ 
      error: error.message || 'Failed to create Razorpay order'
    });
  }
});

/**
 * Verifies Razorpay payment signature
 */
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated (optional, remove if you want to allow unauthenticated calls)
  if (!context.auth && process.env.NODE_ENV === 'production') {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to verify payment'
    );
  }

  try {
    const { orderId, paymentId, signature } = data;

    // Validate required parameters
    if (!orderId || !paymentId || !signature) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters'
      );
    }

    // Verify signature
    const crypto = require('crypto');
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayInstance.key_secret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;

    console.log('Payment signature verification:', isValid ? 'Success' : 'Failed');

    return { isValid };
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to verify Razorpay payment'
    );
  }
});

/**
 * HTTP endpoint for verifying payment (can be used directly from fetch)
 */
exports.verifyRazorpayPaymentHttp = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { orderId, paymentId, signature } = req.body;

    // Validate required parameters
    if (!orderId || !paymentId || !signature) {
      res.status(400).send({ error: 'Missing required parameters' });
      return;
    }

    // Verify signature
    const crypto = require('crypto');
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayInstance.key_secret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;

    console.log('Payment signature verification via HTTP:', isValid ? 'Success' : 'Failed');

    res.status(200).send({ isValid });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).send({ 
      error: error.message || 'Failed to verify Razorpay payment'
    });
  }
}); 
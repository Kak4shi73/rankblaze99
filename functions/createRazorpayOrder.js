const functions = require('firebase-functions');
const Razorpay = require('razorpay');

// Initialize Razorpay with the provided API keys
const razorpayInstance = new Razorpay({
  key_id: 'rzp_test_OChtDbosOz00ju',
  key_secret: '0A8EfMcUW90DE57mNtffGeqy',
});

/**
 * Creates a new Razorpay order
 * This function is meant to be deployed as a Firebase Cloud Function
 */
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
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

    // Add user information to notes
    const orderNotes = {
      ...notes,
      userId: context.auth.uid,
    };

    // Create the order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount), // Make sure amount is an integer
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: orderNotes,
    });

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
 * Verifies Razorpay payment signature
 * This function is meant to be deployed as a Firebase Cloud Function
 */
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
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

    // This is a simple check, for actual verification, use razorpayInstance.webhooks.verifyWebhookSignature
    // with your webhook secret, but that requires a webhook setup
    const crypto = require('crypto');
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayInstance.key_secret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === signature;

    return { isValid };
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to verify Razorpay payment'
    );
  }
}); 
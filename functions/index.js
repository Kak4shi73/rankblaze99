const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();

// Updated CORS middleware with expanded methods and headers
app.use(cors({
  origin: ["https://www.rankblaze.in", "https://rankblaze.in", "http://localhost:3000", "http://localhost:5000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
}));

app.use(express.json());

// Placeholder for a new payment system
app.post("/processPayment", async (req, res) => {
  try {
    // validate payload
    const { amount, customerEmail, customerPhone, customerName, notes } = req.body;
    
    console.log("Order payload:", {
      amount,
      customerEmail,
      customerPhone,
      customerName,
      notes
    });
    
    if (!amount || !customerEmail || !customerName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Generate an order ID
    const orderId = "order_" + Date.now();

    // Placeholder for actual payment processing logic
    // This would be replaced with your new payment provider's API calls

    // Mock successful response
    const mockResponse = {
      success: true,
      orderId: orderId,
      paymentId: "pay_" + Date.now(),
      amount: amount
    };

    res.status(200).send(mockResponse);
  } catch (err) {
    console.error("Payment error:", err.message);
    res.status(500).send({ error: "Server error processing payment" });
  }
});

// Placeholder for payment verification
app.post("/verifyPayment", async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    
    if (!orderId || !paymentId) {
      return res.status(400).json({ error: "Missing order ID or payment ID" });
    }
    
    // Placeholder for verification logic
    // This would be replaced with actual verification calls to your payment provider
    
    // Mock successful verification
    res.status(200).json({
      success: true,
      verified: true,
      orderId: orderId,
      paymentId: paymentId,
      status: "PAID"
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment"
    });
  }
});

// Webhook handler for payment notifications
app.post("/paymentWebhook", async (req, res) => {
  try {
    const event = req.body;
    console.log('Received payment webhook:', event);
    
    // Placeholder for webhook handling logic
    // This would process notifications from your payment provider
    
    res.status(200).send({ received: true });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).send({ error: 'Failed to process webhook' });
  }
});

// Export the express app as a Cloud Function
exports.api = functions.https.onRequest(app);

// Create a callable function for processing payments from the client
exports.processPayment = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to make a payment'
      );
    }
    
    const userId = context.auth.uid;
    const { amount, items } = data;
    
    if (!amount || !items) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment requires an amount and items'
      );
    }
    
    // Generate an order ID
    const orderId = `order_${userId.slice(-4)}_${Date.now()}`;
    
    // Store the order in the database
    await admin.database().ref(`orders/${orderId}`).set({
      userId,
      amount,
      items,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    // Return order details to the client
    return {
      success: true,
      orderId,
      amount
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Payment processing failed'
    );
  }
});

// Verify a payment
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to verify a payment'
      );
    }
    
    const { orderId } = data;
    
    if (!orderId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Order ID is required'
      );
    }
    
    // Placeholder for payment verification
    // In a real implementation, you would call your payment provider's API
    
    // Update the order status
    await admin.database().ref(`orders/${orderId}`).update({
      status: 'completed',
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      verified: true,
      status: 'completed'
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Payment verification failed'
    );
  }
}); 
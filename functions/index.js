const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const crypto = require('crypto');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();

// Updated CORS middleware with expanded methods and headers
app.use(cors({
  origin: [
    'https://rankblaze.in',
    'https://www.rankblaze.in',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-VERIFY'],
  credentials: true
}));

app.use(express.json());

// PhonePe payment integration
const MERCHANT_ID = "MERCHANTUAT";
const SALT_KEY = "c6c71ce3-b5cb-499e-a8fd-dc55208daa13";
const SALT_INDEX = 1;
const ENV = "UAT"; // or "PROD" for production

// Helper function to generate PhonePe checksum
const generateChecksum = (payload, saltKey) => {
  const data = payload + "/pg/v1/pay" + saltKey;
  return crypto.createHash('sha256').update(data).digest('hex') + "###" + SALT_INDEX;
};

// Initialize payment with PhonePe
app.post("/initializePayment", async (req, res) => {
  try {
    const { amount, userId, toolId } = req.body;
    
    if (!amount || !userId || !toolId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const merchantTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // Convert to paise
      redirectUrl: `https://rankblaze.in/payment-status?merchantTransactionId=${merchantTransactionId}`,
      redirectMode: "POST",
      callbackUrl: `https://us-central1-rankblaze-138f7.cloudfunctions.net/api/paymentCallback`,
      mobileNumber: "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = generateChecksum(base64Payload, SALT_KEY);

    // Store transaction details in Firebase
    await admin.database().ref(`transactions/${merchantTransactionId}`).set({
      userId,
      toolId,
      amount,
      status: 'initiated',
      createdAt: admin.database.ServerValue.TIMESTAMP
    });

    res.status(200).json({
      success: true,
      payload: base64Payload,
      checksum,
      merchantTransactionId
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(500).json({ error: "Failed to initialize payment" });
  }
});

// PhonePe payment callback
app.post("/paymentCallback", async (req, res) => {
  try {
    const { merchantTransactionId, transactionId, amount, status } = req.body;

    // Verify the payment status with PhonePe
    const response = await fetch(`https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantTransactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': generateChecksum(merchantTransactionId, SALT_KEY)
      }
    });

    const paymentStatus = await response.json();

    if (paymentStatus.success) {
      // Get transaction details from Firebase
      const transactionRef = admin.database().ref(`transactions/${merchantTransactionId}`);
      const transactionSnapshot = await transactionRef.once('value');
      const transaction = transactionSnapshot.val();

      if (transaction) {
        // Update transaction status
        await transactionRef.update({
          status: paymentStatus.code === 'PAYMENT_SUCCESS' ? 'completed' : 'failed',
          phonepeTransactionId: transactionId,
          updatedAt: admin.database.ServerValue.TIMESTAMP
        });

        // If payment successful, grant tool access
        if (paymentStatus.code === 'PAYMENT_SUCCESS') {
          const userRef = admin.database().ref(`users/${transaction.userId}`);
          const toolsRef = userRef.child('tools');
          
          // Add tool to user's tools array
          await toolsRef.transaction(currentTools => {
            if (currentTools === null) return [transaction.toolId];
            if (!currentTools.includes(transaction.toolId)) {
              currentTools.push(transaction.toolId);
            }
            return currentTools;
          });

          // Create subscription record
          const subscriptionRef = admin.database().ref('subscriptions').push();
          await subscriptionRef.set({
            userId: transaction.userId,
            toolId: transaction.toolId,
            status: 'active',
            startDate: Date.now(),
            endDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: admin.database.ServerValue.TIMESTAMP
          });
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).json({ error: "Failed to process payment callback" });
  }
});

// Export the express app as a Cloud Function
exports.api = functions.https.onRequest(app);
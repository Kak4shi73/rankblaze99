// Export all the functions from the lib folder
const mainFunctions = require('./lib/index.js');

// Example payment function with direct CORS headers
const functions = require("firebase-functions");
const cors = require('cors')({ 
  origin: ['https://www.rankblaze.in', 'https://rankblaze.in', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
});

// Express for API routes
const express = require('express');
const app = express();

// Use cors middleware
app.use(cors);
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  console.log('[DEBUG] Headers:', JSON.stringify(req.headers));
  console.log('[DEBUG] Body:', JSON.stringify(req.body));
  next();
});

// PhonePe payment initialization route with improved error handling
app.post('/initializePhonePePayment', async (req, res) => {
  console.log("💰 Payment route hit with data:", JSON.stringify(req.body));
  
  try {
    const { amount, userId, toolId } = req.body;

    // Enhanced validation
    if (!amount) {
      console.error("Missing amount:", req.body);
      return res.status(400).json({
        success: false,
        error: "Missing amount parameter"
      });
    }
    
    if (!userId) {
      console.error("Missing userId:", req.body);
      return res.status(400).json({
        success: false,
        error: "Missing userId parameter"
      });
    }
    
    if (!toolId) {
      console.error("Missing toolId:", req.body);
      return res.status(400).json({
        success: false,
        error: "Missing toolId parameter"
      });
    }

    // PhonePe SDK
    console.log("📦 Loading PhonePe SDK...");
    let sdkModule;
    try {
      sdkModule = require('pg-sdk-node');
      console.log("✅ SDK loaded successfully");
    } catch (sdkLoadError) {
      console.error("❌ Error loading SDK:", sdkLoadError);
      return res.status(500).json({
        success: false,
        error: "Failed to load payment SDK"
      });
    }
    
    const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = sdkModule;
    
    // PhonePe config
    const clientId = "SU2505221605010380976302";
    const clientSecret = "c6c71ce3-b5cb-499e-a8fd-dc55208daa13";
    const clientVersion = 1;
    const env = process.env.NODE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX;
    
    console.log("🔧 PhonePe config:", { 
      clientId, 
      clientSecret: clientSecret.substring(0, 4) + '****', 
      clientVersion, 
      env: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX'
    });
    
    const merchantOrderId = `ord_${userId}_${toolId}_${Date.now()}`;
    const redirectUrl = "https://www.rankblaze.in/payment-callback";
    
    console.log("🔄 Creating PhonePe client...");
    let client;
    try {
      client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
      console.log("✅ PhonePe client created successfully");
    } catch (clientError) {
      console.error("❌ Error creating PhonePe client:", clientError);
      return res.status(500).json({
        success: false,
        error: "Failed to initialize payment client"
      });
    }
    
    console.log("📝 Building payment request...");
    let request;
    try {
      request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(Number(amount) * 100) // Convert to paise
        .redirectUrl(redirectUrl)
        .build();
      console.log("✅ Request built successfully:", { 
        merchantOrderId, 
        amount: Number(amount) * 100, 
        redirectUrl
      });
    } catch (requestError) {
      console.error("❌ Error building request:", requestError);
      return res.status(500).json({
        success: false,
        error: "Failed to build payment request"
      });
    }
    
    console.log("🚀 Sending request to PhonePe...");
    let response;
    try {
      response = await client.pay(request);
      console.log("✅ PhonePe response received:", response);
    } catch (payError) {
      console.error("❌ Error from PhonePe pay API:", payError);
      return res.status(500).json({
        success: false,
        error: payError.message || "Payment gateway error"
      });
    }
    
    if (!response || !response.redirectUrl) {
      console.error("❌ Invalid response from PhonePe:", response);
      return res.status(500).json({
        success: false,
        error: "Invalid response from payment gateway"
      });
    }
    
    console.log("🎉 Payment initialization successful, sending response to client");
    return res.status(200).json({
      success: true,
      checkoutUrl: response.redirectUrl,
      merchantTransactionId: merchantOrderId,
      // Include additional debugging info that might help
      debug: {
        responseType: typeof response,
        responseKeys: Object.keys(response)
      }
    });
  } catch (error) {
    console.error("💥 Unexpected error in payment initialization:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
      stack: error.stack // Include stack trace for debugging
    });
  }
});

// Verify payment status route - enhanced to handle both GET and POST requests
app.all('/verifyPhonePePayment', async (req, res) => {
  try {
    console.log(`📋 PhonePe verification request: ${req.method}`, req.method === 'POST' ? req.body : req.query);
    
    // Extract transaction ID from either query params (GET) or request body (POST)
    const merchantOrderId = req.method === 'POST' 
      ? req.body.txnId || req.body.merchantTransactionId || req.body.merchantOrderId
      : req.query.merchantOrderId || req.query.txnId || req.query.merchantTransactionId;

    if (!merchantOrderId) {
      console.error("❌ Missing transaction ID in request");
      return res.status(400).json({
        success: false,
        error: "Missing transaction ID"
      });
    }

    console.log(`🔍 Verifying payment for transaction: ${merchantOrderId}`);

    // PhonePe SDK
    const sdkModule = require('pg-sdk-node');
    const { StandardCheckoutClient, Env } = sdkModule;
    
    // PhonePe config
    const clientId = "SU2505221605010380976302";
    const clientSecret = "c6c71ce3-b5cb-499e-a8fd-dc55208daa13";
    const clientVersion = 1;
    const env = process.env.NODE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX;
    
    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
    
    // Get payment status from PhonePe
    console.log("📞 Calling PhonePe API to verify payment status");
    const response = await client.getOrderStatus(merchantOrderId);
    console.log("📊 PhonePe status response:", response);
    
    // Check if payment was successful
    const isSuccess = response.code === "PAYMENT_SUCCESS" || response.state === "COMPLETED";
    
    // If this is a POST request, also update Firestore and grant tool access
    if (req.method === 'POST' && isSuccess) {
      console.log("💰 Payment successful, updating database records");
      
      try {
        // Check if transaction ID follows our format (ord_userId_toolId_timestamp)
        if (merchantOrderId.startsWith('ord_')) {
          const parts = merchantOrderId.split('_');
          if (parts.length >= 3) {
            const userId = parts[1];
            const toolId = parts[2];
            
            console.log(`🔑 Extracted userId=${userId} and toolId=${toolId} from transaction ID`);
            
            // Get Firestore reference
            const admin = require('firebase-admin');
            if (admin.apps.length === 0) {
              admin.initializeApp();
            }
            const db = admin.firestore();
            
            // Create or update transaction record
            const txnRef = db.collection('transactions').doc(merchantOrderId);
            await txnRef.set({
              userId,
              toolId,
              status: 'completed',
              merchantTransactionId: merchantOrderId,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            // Grant tool access to user
            const userToolRef = db.collection('users').doc(userId).collection('tools').doc(toolId);
            await userToolRef.set({
              activatedAt: admin.firestore.FieldValue.serverTimestamp(),
              toolId,
              source: 'api_verification'
            }, { merge: true });
            
            // Update user's tools array for backward compatibility
            const userRef = db.collection('users').doc(userId);
            await userRef.update({
              tools: admin.firestore.FieldValue.arrayUnion(toolId),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ Successfully granted access to tool ${toolId} for user ${userId}`);
            
            return res.status(200).json({
              success: true,
              state: response.state,
              code: response.code,
              message: "Tool access granted successfully",
              userId,
              toolId
            });
          }
        }
      } catch (dbError) {
        console.error("💥 Database error while granting access:", dbError);
        // Continue to return payment status even if DB update fails
      }
    }
    
    // Return payment status for both GET and POST requests
    return res.status(200).json({
      success: true,
      state: response.state,
      code: response.code,
      message: response.message,
      isPaymentSuccess: isSuccess
    });
  } catch (error) {
    console.error("💥 Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to verify payment"
    });
  }
});

// Create SDK order for frontend integration
app.post('/createPhonePeSdkOrder', async (req, res) => {
  try {
    const { amount, userId, toolId } = req.body;

    if (!amount || !userId || !toolId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters"
      });
    }

    // PhonePe SDK
    const sdkModule = require('pg-sdk-node');
    const { StandardCheckoutClient, Env, CreateSdkOrderRequest } = sdkModule;
    
    // PhonePe config
    const clientId = "SU2505221605010380976302";
    const clientSecret = "c6c71ce3-b5cb-499e-a8fd-dc55208daa13";
    const clientVersion = 1;
    const env = process.env.NODE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX;
    
    const merchantOrderId = `ord_${userId}_${toolId}_${Date.now()}`;
    const redirectUrl = "https://www.rankblaze.in/payment-callback";
    
    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
    
    const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(Number(amount) * 100) // Convert to paise
      .redirectUrl(redirectUrl)
      .build();
    
    const response = await client.createSdkOrder(request);
    
    return res.status(200).json({
      success: true,
      token: response.token,
      merchantOrderId
    });
  } catch (error) {
    console.error("Error creating SDK order:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create SDK order"
    });
  }
});

// PhonePe callback webhook
app.post('/webhook/phonepe', async (req, res) => {
  try {
    console.log("Received PhonePe Webhook:", req.body);
    
    // Handle PhonePe callback here
    // This is a simplified implementation
    
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error in webhook:", error);
    return res.status(500).send("Error");
  }
});

// Test route
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!'
  });
});

// Catch-all route for unmatched paths
app.all('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`
  });
});

// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);

exports.paymentExample = functions.https.onRequest(async (req, res) => {
  // Use the corsHandler middleware
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { amount, userId, toolId } = req.body;

      // Dummy payment init logic
      const merchantTransactionId = `txn_${Date.now()}`;
      const payload = "some_payload_string";
      const checksum = "generated_checksum";

      return res.status(200).json({
        success: true,
        payload,
        checksum,
        merchantTransactionId,
      });
    } catch (error) {
      console.error("Error in initializePayment:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  });
});

// CORS Test function with direct headers
exports.corsTest = functions.https.onRequest(async (req, res) => {
  // Use the corsHandler middleware 
  return cors(req, res, async () => {
    // For GET and POST requests, return a test response
    res.status(200).json({
      success: true,
      message: 'CORS is working correctly!',
      origin: req.headers.origin || 'unknown',
      method: req.method,
      headers: req.headers
    });
  });
});

// Export all functions
module.exports = {
  ...mainFunctions,
  api: exports.api,
  paymentExample: exports.paymentExample,
  corsTest: exports.corsTest
};
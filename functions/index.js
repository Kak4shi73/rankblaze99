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
app.all('*', (req, res, next) => {
  console.log(`[DEBUG] Request received: ${req.method} ${req.path}`);
  console.log('[DEBUG] Request headers:', req.headers);
  console.log('[DEBUG] Request body:', req.body);
  next();
});

// PhonePe webhook endpoint
app.post('/webhook/phonepe', (req, res) => {
  try {
    return mainFunctions.phonePeCallback(req, res);
  } catch (error) {
    console.error('Error in phonePeCallback:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Add PhonePe payment routes with direct implementation
app.post('/initializePhonePePayment', async (req, res) => {
  console.log("PhonePe payment route hit with body:", req.body);
  
  try {
    const { amount, userId, toolId } = req.body;

    // Validate required parameters
    if (!amount || !userId || !toolId) {
      console.error("Missing required parameters:", { amount, userId, toolId });
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
    }

    // PhonePe configuration - using the credentials directly
    const clientId = "SU2505221605010380976302"; 
    const clientSecret = "c6c71ce3-b5cb-499e-a8fd-dc55208daa13";
    const clientVersion = 1;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Generate a unique merchant order ID
    const merchantOrderId = `ord_${userId}_${toolId}_${Date.now()}`;
    const redirectUrl = "https://www.rankblaze.in/payment-callback";
    
    try {
      // Load the SDK dynamically to avoid import errors
      const sdkModule = require('pg-sdk-node');
      const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = sdkModule;
      
      console.log("Creating PhonePe client with credentials:", { 
        clientId, 
        clientSecret: clientSecret.substring(0, 4) + '****', 
        clientVersion, 
        env: isProduction ? 'PRODUCTION' : 'SANDBOX' 
      });
      
      // Initialize client
      const client = StandardCheckoutClient.getInstance(
        clientId, 
        clientSecret, 
        clientVersion, 
        isProduction ? Env.PRODUCTION : Env.SANDBOX
      );
      
      console.log("Building request with:", { merchantOrderId, amount: Number(amount) * 100, redirectUrl });
      
      // Create the payment request
      const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(Number(amount) * 100) // Convert to paise
        .redirectUrl(redirectUrl)
        .build();
      
      console.log("Sending request to PhonePe...");
      
      // Make the request to PhonePe
      const response = await client.pay(request);
      
      console.log("Response from PhonePe:", response);
      
      // Return the checkout URL to the client
      return res.status(200).json({
        success: true,
        checkoutUrl: response.redirectUrl,
        merchantTransactionId: merchantOrderId,
      });
    } catch (sdkError) {
      console.error("PhonePe SDK Error:", sdkError);
      return res.status(500).json({
        success: false,
        error: sdkError instanceof Error ? sdkError.message : "PhonePe SDK Error",
      });
    }
  } catch (error) {
    console.error("General Error in initializePhonePePayment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
});

// Add a catch-all route at the end to handle 404s
app.all('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.path}`);
  res.status(404).send(`Route not found: ${req.method} ${req.path}`);
});

// API endpoint for all routes
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
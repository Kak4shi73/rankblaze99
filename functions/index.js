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

// PhonePe webhook endpoint
app.post('/webhook/phonepe', (req, res) => {
  // Forward the request to the phonePeCallback function
  return mainFunctions.phonePeCallback(req, res);
});

// Add PhonePe payment routes
app.post('/initializePhonePePayment', (req, res) => {
  // Forward the request to the standalone function
  return mainFunctions.initializePhonePePayment(req, res);
});

app.get('/verifyPhonePePayment', (req, res) => {
  // Forward the request to the standalone function
  return mainFunctions.verifyPhonePePayment(req, res);
});

app.post('/createPhonePeSdkOrder', (req, res) => {
  // Forward the request to the standalone function
  return mainFunctions.createPhonePeSdkOrder(req, res);
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
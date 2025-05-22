// Export all the functions from the lib folder
const mainFunctions = require('./lib/index.js');

// Example payment function with direct CORS headers
const functions = require("firebase-functions");

exports.paymentExample = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for preflight request
  res.set("Access-Control-Allow-Origin", "https://www.rankblaze.in");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(204).send(""); // No content
  }

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

// CORS Test function with direct headers
exports.corsTest = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for preflight request
  res.set("Access-Control-Allow-Origin", "https://www.rankblaze.in");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(204).send(""); // No content
  }

  // For GET and POST requests, return a test response
  res.status(200).json({
    success: true,
    message: 'CORS is working correctly!',
    origin: req.headers.origin || 'unknown',
    method: req.method,
    headers: req.headers
  });
});

// Export all functions
module.exports = {
  ...mainFunctions,
  paymentExample: exports.paymentExample,
  corsTest: exports.corsTest
};
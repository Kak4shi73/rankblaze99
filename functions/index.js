const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cashfreeFunctions = require('./createCashfreeOrder');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export the Cashfree callable functions
exports.createCashfreeOrder = cashfreeFunctions.createCashfreeOrder;
exports.verifyCashfreePayment = cashfreeFunctions.verifyCashfreePayment;

// Export the Cashfree HTTP endpoints
exports.api = cashfreeFunctions.api;
exports.cashfreeWebhook = cashfreeFunctions.cashfreeWebhook;

// Comment out the attempt to re-export existing functions to avoid TypeScript errors
/*
try {
  const existingFunctions = require('./lib/index');
  for (const key in existingFunctions) {
    if (Object.prototype.hasOwnProperty.call(existingFunctions, key)) {
      exports[key] = existingFunctions[key];
    }
  }
} catch (error) {
  console.warn('Could not re-export existing functions:', error.message);
}
*/ 
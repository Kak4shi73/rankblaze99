const functions = require('firebase-functions');
const admin = require('firebase-admin');
const razorpayFunctions = require('./createRazorpayOrder');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export the Razorpay callable functions
exports.createRazorpayOrder = razorpayFunctions.createRazorpayOrder;
exports.verifyRazorpayPayment = razorpayFunctions.verifyRazorpayPayment;

// Export the Razorpay HTTP endpoints
exports.createOrder = razorpayFunctions.createRazorpayOrderHttp;
exports.verifyPayment = razorpayFunctions.verifyRazorpayPaymentHttp;

// Re-export existing functions (if they exist)
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
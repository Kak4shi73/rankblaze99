import * as functions from 'firebase-functions';
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest, CreateSdkOrderRequest } from 'pg-sdk-node';
import { randomUUID } from 'crypto';

// PhonePe configuration
const clientId = process.env.PHONEPE_CLIENT_ID || functions.config().phonepe?.client_id || "";
const clientSecret = process.env.PHONEPE_CLIENT_SECRET || functions.config().phonepe?.client_secret || "";
const clientVersion = 1;
const env = process.env.NODE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX;

// Initialize PhonePe client
const getPhonePeClient = () => {
  return StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
};

// API to initialize payment
export const initializePhonePePayment = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "https://www.rankblaze.in");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const { amount, userId, toolId } = req.body;

    if (!amount || !userId || !toolId) {
      res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
      return;
    }

    const client = getPhonePeClient();
    const merchantOrderId = `ord_${userId}_${toolId}_${Date.now()}`;
    const redirectUrl = "https://www.rankblaze.in/payment-callback";
    
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Number(amount) * 100) // PhonePe expects amount in paise
      .redirectUrl(redirectUrl)
      .build();
    
    const response = await client.pay(request);
    
    res.status(200).json({
      success: true,
      checkoutUrl: response.redirectUrl,
      merchantTransactionId: merchantOrderId,
    });
    return;
  } catch (error) {
    console.error("Error in initializePhonePePayment:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
    return;
  }
});

// API to check payment status
export const verifyPhonePePayment = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "https://www.rankblaze.in");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const { merchantOrderId } = req.query;

    if (!merchantOrderId) {
      res.status(400).json({
        success: false,
        error: "Missing merchantOrderId",
      });
      return;
    }

    const client = getPhonePeClient();
    const response = await client.getOrderStatus(merchantOrderId as string);
    
    // Access properties using type assertion
    const responseAny = response as any;
    
    res.status(200).json({
      success: true,
      state: response.state,
      code: responseAny.code || undefined,
      message: responseAny.message || undefined,
    });
    return;
  } catch (error) {
    console.error("Error in verifyPhonePePayment:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
    return;
  }
});

// Webhook to handle PhonePe callbacks
export const phonePeCallback = functions.https.onRequest(async (req, res) => {
  // Set CORS headers to allow PhonePe servers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  
  console.log("Received PhonePe Webhook:", req.body);
  
  try {
    const client = getPhonePeClient();
    const authorizationHeader = req.headers.authorization as string;
    const callbackBody = JSON.stringify(req.body);
    
    // PhonePe callback authentication configuration using the new credentials
    const username = "aryan8009"; // Username from dashboard
    const password = "Aryan7071"; // Password from dashboard
    
    try {
      const callbackResponse = client.validateCallback(
        username,
        password,
        authorizationHeader,
        callbackBody
      );
      
      const orderId = callbackResponse.payload.orderId;
      const state = callbackResponse.payload.state;
      // Use optional chaining for potentially missing properties
      const code = (callbackResponse.payload as any).code || 'unknown';
      // Use type assertion for the event property
      const eventType = (callbackResponse as any).event || req.body.event || 'unknown';
      
      console.log(`PhonePe Webhook: Event=${eventType}, OrderID=${orderId}, State=${state}, Code=${code}`);
      
      // Handle different event types
      if (eventType === 'pg.order.completed') {
        // Transaction was completed successfully
        // Parse the orderId to get userId and toolId
        // Format: ord_userId_toolId_timestamp
        const orderParts = orderId.split('_');
        if (orderParts.length >= 4 && orderParts[0] === 'ord') {
          const userId = orderParts[1];
          const toolId = orderParts[2];
          
          // Import Firebase admin if needed
          const admin = require('firebase-admin');
          
          // Update user's profile with purchased tool
          await admin.firestore().collection('users').doc(userId).update({
            tools: admin.firestore.FieldValue.arrayUnion(toolId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Create payment record
          await admin.firestore().collection('user_payments').doc(`${userId}_${orderId}`).set({
            userId,
            toolId,
            orderId,
            status: 'completed',
            event: eventType,
            state,
            code,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } else if (eventType === 'pg.refund.failed') {
        // Handle refund failure
        // Log and store the event
        const admin = require('firebase-admin');
        await admin.firestore().collection('payment_events').add({
          type: eventType,
          orderId,
          state,
          code,
          payload: callbackResponse.payload,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (eventType === 'subscription.notification.failed' ||
                eventType === 'subscription.paused' ||
                eventType === 'subscription.redemption.transaction.completed' ||
                eventType === 'payment.dispute.under_review' ||
                eventType === 'payment.dispute.lost' ||
                eventType === 'subscription.redemption.order.completed' ||
                eventType === 'paylink.order.completed' ||
                eventType === 'settlement.attempt.failed') {
        // Handle other events
        const admin = require('firebase-admin');
        await admin.firestore().collection('payment_events').add({
          type: eventType,
          orderId,
          state,
          code,
          payload: callbackResponse.payload,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Always respond with 200 OK quickly to PhonePe
      res.status(200).send("OK");
      return;
    } catch (error) {
      console.error("Invalid callback:", error);
      res.status(401).send("Unauthorized");
      return;
    }
  } catch (error) {
    console.error("Error processing callback:", error);
    res.status(500).send("Internal Server Error");
    return;
  }
});

// API to create SDK order for frontend integration
export const createPhonePeSdkOrder = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "https://www.rankblaze.in");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const { amount, userId, toolId } = req.body;

    if (!amount || !userId || !toolId) {
      res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
      return;
    }

    const client = getPhonePeClient();
    const merchantOrderId = `ord_${userId}_${toolId}_${Date.now()}`;
    const redirectUrl = "https://www.rankblaze.in/payment-callback";
    
    const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(Number(amount) * 100) // PhonePe expects amount in paise
      .redirectUrl(redirectUrl)
      .build();
    
    const response = await client.createSdkOrder(request);
    
    res.status(200).json({
      success: true,
      token: response.token,
      merchantOrderId,
    });
    return;
  } catch (error) {
    console.error("Error in createPhonePeSdkOrder:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
    return;
  }
}); 
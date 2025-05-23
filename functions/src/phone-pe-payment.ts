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
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { amount, userId, toolId } = req.body;

    if (!amount || !userId || !toolId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
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
    
    return res.status(200).json({
      success: true,
      checkoutUrl: response.redirectUrl,
      merchantTransactionId: merchantOrderId,
    });
  } catch (error) {
    console.error("Error in initializePhonePePayment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
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
    return res.status(204).send("");
  }

  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { merchantOrderId } = req.query;

    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        error: "Missing merchantOrderId",
      });
    }

    const client = getPhonePeClient();
    const response = await client.getOrderStatus(merchantOrderId as string);
    
    return res.status(200).json({
      success: true,
      state: response.state,
      code: response.code,
      message: response.message,
    });
  } catch (error) {
    console.error("Error in verifyPhonePePayment:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
});

// Webhook to handle PhonePe callbacks
export const phonePeCallback = functions.https.onRequest(async (req, res) => {
  try {
    const client = getPhonePeClient();
    const authorizationHeader = req.headers.authorization as string;
    const callbackBody = JSON.stringify(req.body);
    
    // PhonePe callback authentication configuration
    const username = process.env.PHONEPE_CALLBACK_USERNAME || functions.config().phonepe?.callback_username || "";
    const password = process.env.PHONEPE_CALLBACK_PASSWORD || functions.config().phonepe?.callback_password || "";
    
    try {
      const callbackResponse = client.validateCallback(
        username,
        password,
        authorizationHeader,
        callbackBody
      );
      
      const orderId = callbackResponse.payload.orderId;
      const state = callbackResponse.payload.state;
      
      // Process the payment status update in your database
      // This depends on your database structure
      
      return res.status(200).send("OK");
    } catch (error) {
      console.error("Invalid callback:", error);
      return res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error("Error processing callback:", error);
    return res.status(500).send("Internal Server Error");
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
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { amount, userId, toolId } = req.body;

    if (!amount || !userId || !toolId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
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
    
    return res.status(200).json({
      success: true,
      token: response.token,
      merchantOrderId,
    });
  } catch (error) {
    console.error("Error in createPhonePeSdkOrder:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
}); 
import * as functions from 'firebase-functions';
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest, CreateSdkOrderRequest } from 'pg-sdk-node';
import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

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
    
    // Build the redirect URL to include the transaction ID as a query parameter
    const redirectUrl = `https://www.rankblaze.in/payment-callback?merchantTransactionId=${merchantOrderId}`;
    
    console.log(`Initializing payment for user ${userId}, toolId ${toolId}, amount ${amount}`);
    console.log(`Using redirectUrl: ${redirectUrl}`);
    
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Number(amount) * 100) // PhonePe expects amount in paise
      .redirectUrl(redirectUrl)
      .build();
    
    const response = await client.pay(request);
    console.log(`PhonePe payment initialized with response:`, JSON.stringify(response, null, 2));
    
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

// API to check payment status (GET method)
export const verifyPhonePePayment = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "https://www.rankblaze.in");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Process POST request (new verification with Firestore update)
  if (req.method === "POST") {
    try {
      functions.logger.info("POST verifyPhonePePayment called with body:", req.body);
      
      const { txnId } = req.body;
      
      if (!txnId) {
        res.status(400).json({
          success: false, 
          error: "Missing transaction ID"
        });
        return;
      }

      // Get PhonePe client
      const client = getPhonePeClient();
      
      // Call PhonePe API to verify payment status
      functions.logger.info("Checking payment status with PhonePe for:", txnId);
      const response = await client.getOrderStatus(txnId);
      
      functions.logger.info("PhonePe status response:", response);

      // Type assertion for PhonePe response which may have additional properties
      const phonepeResponse = response as any;
      const isSuccess = phonepeResponse.code === "PAYMENT_SUCCESS" || response.state === "COMPLETED";
      
      if (isSuccess) {
        functions.logger.info("Payment successful! Updating Firestore");
        
        try {
          // Get the transaction document from Firestore
          const db = admin.firestore();
          const txnRef = db.collection("transactions").doc(txnId);
          const txnSnap = await txnRef.get();

          if (!txnSnap.exists) {
            functions.logger.error("Transaction not found in Firestore:", txnId);
            
            // Try finding transaction using format or parts of the transaction ID
            // This is helpful if there's a format mismatch between PhonePe and our system
            const txnQuerySnap = await db.collection("transactions")
              .where("merchantTransactionId", "==", txnId)
              .limit(1)
              .get();
            
            if (txnQuerySnap.empty) {
              // Check if the transaction ID contains user ID and tool ID
              // Format is typically: ord_userId_toolId_timestamp
              const parts = txnId.split('_');
              if (parts.length >= 3 && parts[0] === 'ord') {
                const userId = parts[1];
                const toolId = parts[2];
                
                functions.logger.info(`Extracted userId=${userId} and toolId=${toolId} from transaction ID`);
                
                // Create transaction record if it doesn't exist
                await txnRef.set({
                  userId,
                  toolId,
                  status: "completed",
                  merchantTransactionId: txnId,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // Grant tool access directly
                await grantToolAccess(userId, toolId);
                
                res.status(200).json({
                  success: true, 
                  message: "Tool access granted", 
                  status: "completed"
                });
                return;
              } else {
                res.status(404).json({ 
                  success: false, 
                  message: "Transaction not found in database" 
                });
                return;
              }
            } else {
              // Use the found transaction document
              const doc = txnQuerySnap.docs[0];
              const txnData = doc.data();
              await grantToolAccess(txnData.userId, txnData.toolId);
              
              // Update transaction status
              await doc.ref.update({
                status: "completed",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              
              res.status(200).json({
                success: true, 
                message: "Tool access granted", 
                status: "completed"
              });
              return;
            }
          }

          const txnData = txnSnap.data();
          if (!txnData) {
            functions.logger.error("Transaction data is empty");
            res.status(404).json({ 
              success: false, 
              message: "Transaction data not found" 
            });
            return;
          }
          
          const { userId, toolId } = txnData;
          
          if (!userId || !toolId) {
            functions.logger.error("Missing userId or toolId in transaction data:", txnData);
            res.status(400).json({ 
              success: false, 
              message: "Missing userId or toolId in transaction data" 
            });
            return;
          }

          functions.logger.info(`Granting tool ${toolId} access to user ${userId}`);

          // 1. Update transaction status to completed
          await txnRef.update({
            status: "completed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // 2. Grant tool access
          await grantToolAccess(userId, toolId);

          res.status(200).json({
            success: true, 
            message: "Tool access granted", 
            status: "completed"
          });
          return;
        } catch (dbError) {
          functions.logger.error("Database error while updating tool access:", dbError);
          res.status(500).json({
            success: false, 
            message: "Database error while granting tool access",
            error: dbError instanceof Error ? dbError.message : "Unknown database error" 
          });
          return;
        }
      } else {
        // Payment verification failed
        functions.logger.info("Payment verification failed:", phonepeResponse);
        res.status(400).json({
          success: false,
          message: "Payment not successful",
          state: response.state,
          code: phonepeResponse.code
        });
        return;
      }
    } catch (error) {
      functions.logger.error("Error in POST verifyPhonePePayment:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
      return;
    }
  }

  // Process GET request (legacy support)
  if (req.method === "GET") {
    try {
      const { merchantOrderId } = req.query;
      
      if (!merchantOrderId) {
        res.status(400).json({
          success: false,
          error: "Missing merchantOrderId"
        });
        return;
      }

      const client = getPhonePeClient();
      
      // Call PhonePe API to check status
      const response = await client.getOrderStatus(merchantOrderId as string);
      
      functions.logger.info("GET: Status response from PhonePe:", response);
      
      // If payment is successful, also trigger tool access
      if ((response as any).code === "PAYMENT_SUCCESS" || response.state === "COMPLETED") {
        try {
          // Try to grant tool access
          await processTransaction(merchantOrderId as string);
        } catch (processError) {
          functions.logger.error("Error processing successful transaction:", processError);
          // Continue to return successful response even if processing fails
        }
      }
      
      res.status(200).json({
        success: true,
        state: response.state,
        code: (response as any).code,
        message: (response as any).message
      });
      return;
    } catch (error) {
      functions.logger.error("Error in GET verifyPhonePePayment:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error"
      });
      return;
    }
  }

  // Invalid method
  res.status(405).json({
    success: false,
    error: "Method Not Allowed"
  });
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
          
          // Update user's profile with purchased tool
          await admin.firestore().collection('users').doc(userId).update({
            tools: admin.firestore.FieldValue.arrayUnion(toolId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Add tool to user's tools subcollection (new approach)
          await admin.firestore().collection('users').doc(userId).collection('tools').doc(toolId).set({
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
            toolId,
            source: "PhonePe"
          });
          
          // Update transaction status
          await admin.firestore().collection('transactions').doc(orderId).update({
            status: "completed",
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
    
    // Build the redirect URL to include the transaction ID as a query parameter
    const redirectUrl = `https://www.rankblaze.in/payment-callback?merchantTransactionId=${merchantOrderId}`;
    
    console.log(`Initializing SDK payment for user ${userId}, toolId ${toolId}, amount ${amount}`);
    console.log(`Using redirectUrl: ${redirectUrl}`);
    
    const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(Number(amount) * 100) // PhonePe expects amount in paise
      .redirectUrl(redirectUrl)
      .build();
    
    const response = await client.createSdkOrder(request);
    console.log(`PhonePe SDK order created with response:`, JSON.stringify(response, null, 2));
    
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

// Helper function to grant tool access to a user
async function grantToolAccess(userId: string, toolId: string): Promise<void> {
  const db = admin.firestore();
  
  // Add tool to user's tools collection
  const userToolRef = db.collection("users").doc(userId).collection("tools").doc(toolId);
  await userToolRef.set({
    activatedAt: admin.firestore.FieldValue.serverTimestamp(),
    toolId,
    source: "PhonePe"
  });

  // Also update the user's tools array for backward compatibility
  await db.collection("users").doc(userId).update({
    tools: admin.firestore.FieldValue.arrayUnion(toolId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Helper function to process a transaction and grant tool access
async function processTransaction(transactionId: string): Promise<boolean> {
  const db = admin.firestore();
  
  // Try direct transaction lookup
  let txnRef = db.collection("transactions").doc(transactionId);
  let txnSnap = await txnRef.get();
  
  // If not found, try using a query
  if (!txnSnap.exists) {
    const txnQuerySnap = await db.collection("transactions")
      .where("merchantTransactionId", "==", transactionId)
      .limit(1)
      .get();
    
    if (!txnQuerySnap.empty) {
      txnRef = txnQuerySnap.docs[0].ref;
      txnSnap = txnQuerySnap.docs[0];
    } else {
      // Check if the transaction ID contains user ID and tool ID
      // Format is typically: ord_userId_toolId_timestamp
      const parts = transactionId.split('_');
      if (parts.length >= 3 && parts[0] === 'ord') {
        const userId = parts[1];
        const toolId = parts[2];
        
        // Create transaction record if it doesn't exist
        await txnRef.set({
          userId,
          toolId,
          status: "completed",
          merchantTransactionId: transactionId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Grant tool access
        await grantToolAccess(userId, toolId);
        return true;
      }
      
      return false;
    }
  }
  
  const txnData = txnSnap.data();
  if (!txnData || !txnData.userId || !txnData.toolId) {
    return false;
  }
  
  // Update transaction status
  await txnRef.update({
    status: "completed",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Grant tool access
  await grantToolAccess(txnData.userId, txnData.toolId);
  return true;
} 
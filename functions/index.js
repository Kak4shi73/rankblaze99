const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const Cashfree = require("cashfree-pg-sdk-nodejs");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Cashfree SDK at the top level with correct structure
// The proper initialization will depend on the specific Cashfree SDK version
let cashfreeVersion = 'unknown';
try {
  // Try different initialization methods based on SDK structure
  if (Cashfree.PG) {
    Cashfree.PG.initialize({
      env: process.env.NODE_ENV === 'production' ? Cashfree.Env.PROD : Cashfree.Env.SANDBOX,
      clientId: '9721923531a775ba3e2dcb8259291279',
      clientSecret: 'cfsk_ma_prod_7b3a016d277614ba6a498a17ccf451c2_f7f4ac4e'
    });
    cashfreeVersion = 'PG';
    console.log("Cashfree initialized using PG.initialize");
  } else if (typeof Cashfree.initialize === 'function') {
    Cashfree.initialize({
      env: process.env.NODE_ENV === 'production' ? 'PROD' : 'SANDBOX',
      clientId: '9721923531a775ba3e2dcb8259291279',
      clientSecret: 'cfsk_ma_prod_7b3a016d277614ba6a498a17ccf451c2_f7f4ac4e'
    });
    cashfreeVersion = 'direct';
    console.log("Cashfree initialized using direct initialize");
  } else {
    console.error("Unable to initialize Cashfree - SDK structure not recognized");
  }
} catch (error) {
  console.error("Error initializing Cashfree:", error);
}

// Helper function to create orders with Cashfree that works with different SDK versions
const createCashfreeOrder = async (orderData) => {
  if (cashfreeVersion === 'PG' && Cashfree.PG && Cashfree.PG.orders) {
    return Cashfree.PG.orders.create(orderData);
  } else if (cashfreeVersion === 'direct' && Cashfree.orders) {
    return Cashfree.orders.create(orderData);
  } else {
    throw new Error(`Unable to create order - Cashfree SDK version ${cashfreeVersion} not properly initialized`);
  }
};

// Helper function to fetch payments that works with different SDK versions
const fetchCashfreePayments = async (orderId) => {
  if (cashfreeVersion === 'PG' && Cashfree.PG && Cashfree.PG.orders) {
    return Cashfree.PG.orders.fetchPayments(orderId);
  } else if (cashfreeVersion === 'direct' && Cashfree.orders) {
    return Cashfree.orders.fetchPayments(orderId);
  } else {
    throw new Error(`Unable to fetch payments - Cashfree SDK version ${cashfreeVersion} not properly initialized`);
  }
};

// Create the helper functions object
const cashfreeHelpers = {
  createOrder: createCashfreeOrder,
  fetchPayments: fetchCashfreePayments
};

// Import functions from createCashfreeOrder.js
const cashfreeModule = require('./createCashfreeOrder');

// Initialize the helper functions in the createCashfreeOrder module
if (typeof cashfreeModule.initHelpers === 'function') {
  cashfreeModule.initHelpers(cashfreeHelpers);
  console.log("Initialized Cashfree helper functions in createCashfreeOrder module");
}

const app = express();

// Updated CORS middleware with expanded methods and headers
app.use(cors({
  origin: ["https://www.rankblaze.in", "https://rankblaze.in", "http://localhost:3000", "http://localhost:5000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
}));

app.use(express.json());

// ✅ Step 2: Define the route under this CORS-applied app
app.post("/createCashfreeOrder", async (req, res) => {
  try {
    // validate payload
    const { amount, customerEmail, customerPhone, customerName, orderId, notes } = req.body;
    
    console.log("Order payload:", {
      amount,
      customerEmail,
      customerPhone,
      customerName,
      orderId,
      notes
    });
    
    if (!amount || !customerEmail || !customerPhone || !customerName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const finalOrderId = orderId || "ordr_" + Date.now();

    const orderData = {
      order_id: finalOrderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_" + customerPhone,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
      },
      order_note: notes ? JSON.stringify(notes) : "",
    };

    // Use the helper function instead of directly calling Cashfree.PG.orders.create
    const response = await createCashfreeOrder(orderData);

    res.status(200).send({
      payment_session_id: response.payment_session_id,
      order_id: finalOrderId,
    });
  } catch (err) {
    console.error("Cashfree error:", err.response?.data || err.message);
    res.status(500).send({ error: "Server error creating order" });
  }
});

// Custom Cashfree order creation with specific order ID format
app.post("/createCashfreeOrderCustom", async (req, res) => {
  try {
    // Validate payload
    const { userId, cartItems, totalAmount, customerName, customerEmail, customerPhone } = req.body;
    
    console.log("Custom order payload:", {
      userId,
      cartItems,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone
    });
    
    if (!userId || !cartItems || cartItems.length === 0 || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Fetch user data from Firebase if email not provided
    let finalEmail = customerEmail;
    let finalPhone = customerPhone || '';
    let finalName = customerName || '';
    
    if (!finalEmail || !finalName) {
      try {
        // Fetch user details from Realtime Database
        const userSnapshot = await admin.database().ref(`users/${userId}`).once('value');
        const userData = userSnapshot.val();
        
        if (userData) {
          finalEmail = finalEmail || userData.email || '';
          finalPhone = finalPhone || userData.phone || '';
          finalName = finalName || userData.name || userData.displayName || 'User';
          
          console.log('Fetched user data from Firebase:', {
            finalEmail,
            finalPhone,
            finalName
          });
        }
      } catch (error) {
        console.error('Error fetching user data from Firebase:', error);
      }
    }
    
    // Build orderId from userId and tool data
    const last4User = userId.slice(-4);
    const last2Tool = cartItems.length === 1
      ? cartItems[0].id.toString().slice(-2)
      : cartItems[cartItems.length - 1].id.toString().slice(-2);
    const suffix = cartItems.length > 1 ? `-${cartItems.length}` : '';
    const orderId = `${last4User}-${last2Tool}${suffix}`;
    
    // Create the order request
    const orderRequest = {
      order_id: orderId,
      order_amount: totalAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_name: finalName,
        customer_email: finalEmail || `user-${userId.slice(0, 6)}@example.com`, // Fallback email if none found
        customer_phone: finalPhone || '9999999999', // Default phone if none available
      },
      order_note: JSON.stringify({ cart: cartItems }),
    };

    // Create the order with Cashfree
    const response = await createCashfreeOrder(orderRequest);
    console.log('Custom Cashfree order created successfully:', response);

    // Save order to Firestore
    await admin.firestore().collection('payments').doc(orderId).set({
      userId,
      orderId,
      payment_session_id: response.payment_session_id,
      amount: totalAmount,
      cartItems,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Save to Realtime Database
    await admin.database().ref(`orders/${orderId}`).set({
      userId,
      amount: totalAmount,
      status: 'created',
      paymentMethod: 'cashfree',
      paymentSessionId: response.payment_session_id,
      createdAt: new Date().toISOString(),
      cartItems
    });

    // Return the payment session ID to the client
    res.status(200).send({
      session_id: response.payment_session_id,
      order_id: orderId,
    });
  } catch (err) {
    console.error("Custom Cashfree error:", err.response?.data || err.message);
    res.status(500).send({ error: "Server error creating order" });
  }
});

// Verify payment and update user access
app.post("/verifyCashfreePaymentCustom", async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: "Missing order ID" });
    }

    // Verify payment
    const response = await fetchCashfreePayments(orderId);
    console.log('Payment verification response for custom order:', response);

    // Check if payment is successful
    const isSuccessful = response.some(payment => payment.payment_status === 'SUCCESS');

    if (isSuccessful) {
      // Get order details from Firestore
      const orderDoc = await admin.firestore().collection('payments').doc(orderId).get();
      const orderData = orderDoc.data();
      
      if (!orderData) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order status in Firestore
      await admin.firestore().collection('payments').doc(orderId).update({
        status: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        payment_details: response
      });
      
      // Update order status in Realtime Database
      await admin.database().ref(`orders/${orderId}`).update({
        status: 'paid',
        updatedAt: new Date().toISOString(),
        paymentDetails: response
      });
      
      // Update user's tools access
      if (orderData.userId && orderData.cartItems && orderData.cartItems.length > 0) {
        // Get array of tool IDs
        const toolIds = orderData.cartItems.map(item => item.id);
        
        // Update user document to add access to tools
        await admin.firestore().collection('users').doc(orderData.userId).update({
          tools: admin.firestore.FieldValue.arrayUnion(...toolIds),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Also add the detailed tool info to user's purchased_tools array for display in dashboard
        await admin.firestore().collection('users').doc(orderData.userId).update({
          purchased_tools: admin.firestore.FieldValue.arrayUnion(...orderData.cartItems),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Added tools ${toolIds.join(', ')} to user ${orderData.userId}`);
      }
      
      return res.status(200).json({ success: true });
    } else {
      return res.status(200).json({ success: false, message: "Payment not successful" });
    }
  } catch (err) {
    console.error("Error verifying custom Cashfree payment:", err);
    res.status(500).send({ error: "Server error verifying payment" });
  }
});

// Add test CORS route for debugging
app.get("/testCors", (req, res) => {
  res.json({ success: true, message: "CORS is working!" });
});

app.get("/test-cors", (req, res) => {
  res.status(200).json({ message: "CORS is working properly ✅" });
});

// Export as API
exports.api = functions.https.onRequest(app);

// Webhook handler for Cashfree payment notifications
app.post("/cashfreeWebhookCustom", async (req, res) => {
  try {
    // Cashfree webhook payload
    const event = req.body;
    console.log('Received Cashfree webhook:', event);
    
    // Validate webhook signature
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    const secretKey = functions.config().cashfree?.secret_key || process.env.CASHFREE_SECRET_KEY;
    
    if (signature && timestamp && secretKey) {
      // Create the data string to verify (timestamp + data)
      const data = timestamp + JSON.stringify(event);
      
      // Create HMAC using crypto module
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secretKey);
      hmac.update(data);
      const generatedSignature = hmac.digest('base64');
      
      // Compare signatures
      if (generatedSignature !== signature) {
        console.error('Webhook signature verification failed');
        return res.status(401).send({ error: 'Invalid signature' });
      }
      
      console.log('Webhook signature verified successfully');
    } else {
      console.warn('Missing webhook signature headers or secret key, skipping verification');
    }
    
    // Check if this is a payment success event
    if (event.data && event.data.payment && event.data.payment.payment_status === 'SUCCESS') {
      const orderId = event.data.order.order_id;
      
      // Get order details from Firestore
      const orderDoc = await admin.firestore().collection('payments').doc(orderId).get();
      
      if (!orderDoc.exists) {
        console.error(`Order ${orderId} not found in Firestore`);
        return res.status(404).send({ error: 'Order not found' });
      }
      
      const orderData = orderDoc.data();
      
      // Update order status in Firestore
      await admin.firestore().collection('payments').doc(orderId).update({
        status: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        payment_details: event.data.payment
      });
      
      // Update order status in Realtime Database
      await admin.database().ref(`orders/${orderId}`).update({
        status: 'paid',
        updatedAt: new Date().toISOString(),
        paymentDetails: event.data.payment
      });
      
      // Update user's tools access
      if (orderData.userId && orderData.cartItems && orderData.cartItems.length > 0) {
        // Get array of tool IDs
        const toolIds = orderData.cartItems.map(item => item.id);
        
        // Update user document to add access to tools
        await admin.firestore().collection('users').doc(orderData.userId).update({
          tools: admin.firestore.FieldValue.arrayUnion(...toolIds),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Also add the detailed tool info to user's purchased_tools array for display in dashboard
        await admin.firestore().collection('users').doc(orderData.userId).update({
          purchased_tools: admin.firestore.FieldValue.arrayUnion(...orderData.cartItems),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Added tools ${toolIds.join(', ')} to user ${orderData.userId}`);
      }
      
      return res.status(200).send({ success: true });
    }
    
    // Not a payment success event
    return res.status(200).send({ received: true });
  } catch (error) {
    console.error('Error processing Cashfree webhook:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Endpoint to get user's tools
app.get("/getUserTools", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }
    
    // Get user document from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = userDoc.data();
    const tools = userData.tools || [];
    
    return res.status(200).json({ tools });
  } catch (error) {
    console.error('Error fetching user tools:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Endpoint to get user's purchased tools with details
app.get("/getUserPurchasedTools", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }
    
    // Get user document from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = userDoc.data();
    const purchasedTools = userData.purchased_tools || [];
    
    // If there are no purchased_tools array but there are tool IDs,
    // fetch the tool details from the tools collection
    if (purchasedTools.length === 0 && userData.tools && userData.tools.length > 0) {
      const toolsDetails = [];
      
      // Get each tool's details from the tools collection
      for (const toolId of userData.tools) {
        try {
          const toolDoc = await admin.firestore().collection('tools').doc(toolId).get();
          if (toolDoc.exists) {
            const toolData = toolDoc.data();
            toolsDetails.push({
              id: toolId,
              name: toolData.name,
              description: toolData.description,
              image: toolData.image || '',
              ...toolData
            });
          }
        } catch (err) {
          console.error(`Error fetching tool ${toolId}:`, err);
        }
      }
      
      return res.status(200).json({ purchased_tools: toolsDetails });
    }
    
    return res.status(200).json({ purchased_tools: purchasedTools });
  } catch (error) {
    console.error('Error fetching user purchased tools:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Endpoint to get user data for dashboard
app.get("/getUserData", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }
    
    // Get user data from Realtime Database
    const userSnapshot = await admin.database().ref(`users/${userId}`).once('value');
    const userData = userSnapshot.val() || {};
    
    // Get user data from Firestore (might have additional data)
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const firestoreData = userDoc.exists ? userDoc.data() : {};
    
    // Combine data from both sources
    const combinedData = {
      ...userData,
      ...firestoreData,
      // Remove sensitive information
      password: undefined,
      // Format data for the frontend
      tools: firestoreData.tools || [],
      purchased_tools: firestoreData.purchased_tools || [],
      // Add recent activity (you can customize this based on your data model)
      recentActivity: [
        // Example activity items
        {
          icon: "🛒",
          text: "You purchased new tools",
          time: new Date().toLocaleDateString()
        },
        {
          icon: "🔍",
          text: "You used keyword research tool",
          time: new Date().toLocaleDateString()
        }
      ]
    };
    
    return res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Export functions from createCashfreeOrder.js
exports.createCashfreeOrder = cashfreeModule.createCashfreeOrder;
exports.verifyCashfreePayment = cashfreeModule.verifyCashfreePayment;
exports.createCashfreeOrderHttp = cashfreeModule.createCashfreeOrderHttp;

// Export these helper functions to be used in createCashfreeOrder.js
exports.cashfreeHelpers = cashfreeHelpers; 
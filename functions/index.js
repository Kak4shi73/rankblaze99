const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const Cashfree = require("cashfree-pg-sdk-nodejs");

// Import functions from createCashfreeOrder.js
const cashfreeModule = require('./createCashfreeOrder');

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

    const response = await Cashfree.PG.orders.create({
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
    });

    res.status(200).send({
      payment_session_id: response.payment_session_id,
      order_id: finalOrderId,
    });
  } catch (err) {
    console.error("Cashfree error:", err.response?.data || err.message);
    res.status(500).send({ error: "Server error creating order" });
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

// Export functions from createCashfreeOrder.js
exports.createCashfreeOrder = cashfreeModule.createCashfreeOrder;
exports.verifyCashfreePayment = cashfreeModule.verifyCashfreePayment;
exports.createCashfreeOrderHttp = cashfreeModule.createCashfreeOrderHttp; 
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const Cashfree = require("cashfree-pg-sdk-nodejs");

const app = express();

// ✅ Step 1: Apply CORS middleware correctly
app.use(
  cors({
    origin: ["https://www.rankblaze.in", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Step 2: Define the route under this CORS-applied app
app.post("/createCashfreeOrder", async (req, res) => {
  try {
    // validate payload
    const { amount, email, phone, name } = req.body;
    
    console.log("Order payload:", {
      amount,
      email,
      phone,
      name,
    });
    
    if (!amount || !email || !phone || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const orderId = "ordr_" + Date.now();

    const response = await Cashfree.PG.orders.create({
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_" + phone,
        customer_email: email,
        customer_name: name,
        customer_phone: phone,
      },
    });

    res.status(200).send({
      session_id: response.payment_session_id,
      order_id: orderId,
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

// ✅ Step 3: Export it correctly
exports.api = functions.https.onRequest(app); 
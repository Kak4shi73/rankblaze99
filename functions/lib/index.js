"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.getToolSession = exports.sendOTPEmail = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors");
const crypto = require("crypto-js");
const express = require("express");
// Initialize Firebase admin SDK
admin.initializeApp();
// Create a nodemailer transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: ((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.user) || process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: ((_b = functions.config().email) === null || _b === void 0 ? void 0 : _b.password) || process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});
// Email templates
const emailTemplates = {
    otp: (otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #5c4ad1; font-weight: bold; margin-bottom: 5px;">Verification Code</h1>
        <p style="color: #777; font-size: 16px;">Use the code below to complete your sign-in</p>
      </div>
      
      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e0e0e0; margin-bottom: 30px;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</div>
        <p style="color: #777; margin-top: 15px; font-size: 14px;">This code will expire in 10 minutes</p>
      </div>
      
      <div style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
        <p>If you didn't request this code, you can safely ignore this email.</p>
        <p>© ${new Date().getFullYear()} RANKBLAZE. All rights reserved.</p>
      </div>
    </div>
  `,
    payment: (orderId, amount) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #5c4ad1; font-weight: bold; margin-bottom: 5px;">Payment Successful</h1>
        <p style="color: #777; font-size: 16px;">Your payment has been successfully processed</p>
      </div>
      
      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; text-align: left; border: 1px solid #e0e0e0; margin-bottom: 30px;">
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${amount}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p style="margin: 15px 0 5px;">Your tool access has been activated. You can now start using the tools you purchased.</p>
      </div>
      
      <div style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
        <p>Thank you for your purchase!</p>
        <p>© ${new Date().getFullYear()} RANKBLAZE. All rights reserved.</p>
      </div>
    </div>
  `
};
// Cloud function to send OTP verification email
exports.sendOTPEmail = functions.https.onCall(async (data, context) => {
    var _a;
    // Validate the request
    if (!data.email || !data.otp) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with email and OTP arguments.');
    }
    const { email, otp, subject, template } = data;
    try {
        // Prepare email
        const mailOptions = {
            from: ((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.user) || process.env.EMAIL_USER || 'your-email@gmail.com',
            to: email,
            subject: subject || 'Your Verification Code',
            html: template === 'otp' ? emailTemplates.otp(otp) : emailTemplates.payment(otp, 0)
        };
        // Send email
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Email sent successfully' };
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw new functions.https.HttpsError('internal', 'There was an error sending the email.');
    }
});
// Cloud function to get tool session cookies
exports.getToolSession = functions.https.onCall(async (data, context) => {
    var _a;
    try {
        // Validate the request
        if (!data.userId || !data.toolId || !data.accessCode) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
        }
        // Verify user has access to the tool
        const db = admin.database();
        const subscriptionsRef = db.ref('subscriptions');
        const subscriptionsSnapshot = await subscriptionsRef.once('value');
        if (!subscriptionsSnapshot.exists()) {
            throw new functions.https.HttpsError('not-found', 'No subscriptions found');
        }
        const subscriptions = subscriptionsSnapshot.val();
        // Check if user has access to the requested tool
        let hasAccess = false;
        for (const subId in subscriptions) {
            const sub = subscriptions[subId];
            if (sub.userId === data.userId && sub.status === 'active') {
                // Check if tool is included in subscription
                if (sub.tools && Array.isArray(sub.tools)) {
                    for (const tool of sub.tools) {
                        if ((typeof tool === 'string' && tool === data.toolId) ||
                            (typeof tool === 'object' &&
                                tool.id === data.toolId &&
                                tool.status === 'active')) {
                            hasAccess = true;
                            break;
                        }
                    }
                }
            }
            if (hasAccess)
                break;
        }
        if (!hasAccess) {
            throw new functions.https.HttpsError('permission-denied', 'User does not have access to this tool');
        }
        // Log the access attempt
        const accessLogRef = db.ref(`toolAccessLogs/${data.toolId}_${data.userId}_${Date.now()}`);
        await accessLogRef.set({
            userId: data.userId,
            toolId: data.toolId,
            accessCode: data.accessCode,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            source: 'extension',
            ip: ((_a = context.rawRequest) === null || _a === void 0 ? void 0 : _a.ip) || 'unknown'
        });
        // Get tool session data based on the tool ID
        // In a real implementation, this would fetch actual session cookies from a secure storage
        // or generate them on-demand based on stored credentials
        const toolSessions = {
            'chatgpt_plus': {
                cookies: [
                    { name: '_auth_token', value: 'sample_auth_token_1', domain: '.openai.com' },
                    { name: 'session_id', value: 'sample_session_id_1', domain: '.openai.com' }
                ],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
            },
            'envato_elements': {
                cookies: [
                    { name: 'elements_session', value: 'sample_session_token_2', domain: '.envato.com' },
                    { name: 'elements_auth', value: 'sample_auth_token_2', domain: '.envato.com' }
                ],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
            },
            'canva_pro': {
                cookies: [
                    { name: 'canva_auth', value: 'sample_auth_token_3', domain: '.canva.com' },
                    { name: 'canva_session', value: 'sample_session_id_3', domain: '.canva.com' }
                ],
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
            },
            'storyblocks': {
                cookies: [
                    { name: 'sb_session', value: 'sample_session_token_4', domain: '.storyblocks.com' },
                    { name: 'sb_auth', value: 'sample_auth_token_4', domain: '.storyblocks.com' }
                ],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
            },
            'semrush': {
                cookies: [
                    { name: 'semrush_auth', value: 'sample_auth_token_5', domain: '.semrush.com' },
                    { name: 'semrush_session', value: 'sample_session_id_5', domain: '.semrush.com' }
                ],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
            }
        };
        const sessionData = toolSessions[data.toolId];
        if (!sessionData) {
            throw new functions.https.HttpsError('not-found', 'Session data not available for this tool');
        }
        // Return session data to the extension
        return {
            success: true,
            sessionData: sessionData
        };
    }
    catch (error) {
        console.error('Error getting tool session:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get tool session');
    }
});
// Set up express app for API endpoints
const app = express();
// Configure CORS with the cors package
const corsHandler = cors({
    origin: ['https://www.rankblaze.in', 'https://rankblaze.in', 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-VERIFY'],
    credentials: true
});
// Apply CORS to all routes
app.use(corsHandler);
app.use(express.json());
// Debug route to log all requests
app.all('*', (req, res, next) => {
    console.log(`[DEBUG] Request received: ${req.method} ${req.path}`);
    console.log('[DEBUG] Request body:', req.body);
    console.log('[DEBUG] Request query:', req.query);
    next(); // Continue to the next middleware
});
// PhonePe SDK route - Direct implementation 
app.post('/initializePhonePePayment', async (req, res) => {
    console.log("PhonePe payment route hit with body:", req.body);
    try {
        const { amount, userId, toolId } = req.body;
        // Validate required parameters
        if (!amount || !userId || !toolId) {
            console.error("Missing required parameters:", { amount, userId, toolId });
            return res.status(400).json({
                success: false,
                error: "Missing required parameters",
            });
        }
        // PhonePe configuration - using the credentials directly
        const clientId = "SU2505221605010380976302";
        const clientSecret = "c6c71ce3-b5cb-499e-a8fd-dc55208daa13";
        const clientVersion = 1;
        const isProduction = process.env.NODE_ENV === 'production';
        // Generate a unique merchant order ID
        const merchantOrderId = `ord_${userId}_${toolId}_${Date.now()}`;
        const redirectUrl = "https://www.rankblaze.in/payment-callback";
        console.log("🔄 Creating order in database before payment initialization...");
        try {
            // Create order in Realtime Database
            const rtdb = admin.database();
            const orderData = {
                orderId: merchantOrderId,
                userId,
                toolId,
                amount,
                status: 'initiated',
                paymentMethod: 'PhonePe',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                redirectUrl
            };
            await rtdb.ref(`orders/${merchantOrderId}`).set(orderData);
            console.log("✅ Order created in Realtime Database:", merchantOrderId);
            // Also create in Firestore for backup
            const db = admin.firestore();
            await db.collection('orders').doc(merchantOrderId).set(Object.assign(Object.assign({}, orderData), { createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
            console.log("✅ Order created in Firestore:", merchantOrderId);
        }
        catch (dbError) {
            console.error("❌ Database error during order creation:", dbError);
            return res.status(500).json({
                success: false,
                error: "Failed to create order in database"
            });
        }
        console.log("🔄 Creating PhonePe client...");
        let client;
        try {
            // Load the SDK dynamically to avoid import errors
            const sdkModule = require('pg-sdk-node');
            const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = sdkModule;
            client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, isProduction ? Env.PRODUCTION : Env.SANDBOX);
            console.log("✅ PhonePe client created successfully");
        }
        catch (clientError) {
            console.error("❌ Error creating PhonePe client:", clientError);
            return res.status(500).json({
                success: false,
                error: "Failed to initialize payment client"
            });
        }
        console.log("📝 Building payment request...");
        let request;
        try {
            const sdkModule = require('pg-sdk-node');
            const { StandardCheckoutPayRequest } = sdkModule;
            request = StandardCheckoutPayRequest.builder()
                .merchantOrderId(merchantOrderId)
                .amount(Number(amount) * 100) // Convert to paise
                .redirectUrl(redirectUrl)
                .build();
            console.log("✅ Request built successfully:", {
                merchantOrderId,
                amount: Number(amount) * 100,
                redirectUrl
            });
        }
        catch (requestError) {
            console.error("❌ Error building request:", requestError);
            return res.status(500).json({
                success: false,
                error: "Failed to build payment request"
            });
        }
        console.log("🚀 Sending request to PhonePe...");
        let response;
        try {
            response = await client.pay(request);
            console.log("✅ PhonePe response received:", response);
            // Update order with PhonePe response
            const rtdb = admin.database();
            await rtdb.ref(`orders/${merchantOrderId}`).update({
                paymentUrl: response.redirectUrl,
                updatedAt: Date.now()
            });
        }
        catch (payError) {
            console.error("❌ Error from PhonePe pay API:", payError);
            // Update order status to failed
            const rtdb = admin.database();
            await rtdb.ref(`orders/${merchantOrderId}`).update({
                status: 'failed',
                error: payError instanceof Error ? payError.message : "Payment gateway error",
                updatedAt: Date.now()
            });
            return res.status(500).json({
                success: false,
                error: payError instanceof Error ? payError.message : "Payment gateway error"
            });
        }
        if (!response || !response.redirectUrl) {
            console.error("❌ Invalid response from PhonePe:", response);
            // Update order status to failed
            const rtdb = admin.database();
            await rtdb.ref(`orders/${merchantOrderId}`).update({
                status: 'failed',
                error: "Invalid response from payment gateway",
                updatedAt: Date.now()
            });
            return res.status(500).json({
                success: false,
                error: "Invalid response from payment gateway"
            });
        }
        console.log("✅ Payment URL generated successfully:", response.redirectUrl);
        return res.status(200).json({
            success: true,
            checkoutUrl: response.redirectUrl,
            merchantTransactionId: merchantOrderId,
            orderId: merchantOrderId
        });
    }
    catch (error) {
        console.error("❌ Unexpected error in initializePhonePePayment:", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal Server Error",
        });
    }
});
// Verify PhonePe payment status
app.get('/verifyPhonePePayment', async (req, res) => {
    console.log("Verify PhonePe payment route hit with query:", req.query);
    try {
        const { merchantOrderId } = req.query;
        if (!merchantOrderId) {
            return res.status(400).json({
                success: false,
                error: "Missing merchantOrderId",
            });
        }
        // PhonePe configuration
        const clientId = "SU2505221605010380976302";
        const clientSecret = "c6c71ce3-b5cb-499e-a8fd-dc55208daa13";
        const clientVersion = 1;
        const isProduction = process.env.NODE_ENV === 'production';
        try {
            // Load the SDK dynamically
            const sdkModule = require('pg-sdk-node');
            const { StandardCheckoutClient, Env } = sdkModule;
            // Initialize client
            const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, isProduction ? Env.PRODUCTION : Env.SANDBOX);
            // Get payment status from PhonePe
            const response = await client.getOrderStatus(merchantOrderId);
            console.log("Status response from PhonePe:", response);
            const isSuccess = response.state === 'COMPLETED' && (response.code === 'PAYMENT_SUCCESS' || response.code === 'SUCCESS');
            // If payment is successful, update database and grant tool access
            if (isSuccess) {
                console.log("🎉 Payment verified as successful! Processing...");
                try {
                    const rtdb = admin.database();
                    const db = admin.firestore();
                    // Get order details from database
                    const orderRef = rtdb.ref(`orders/${merchantOrderId}`);
                    const orderSnapshot = await orderRef.get();
                    if (orderSnapshot.exists()) {
                        const orderData = orderSnapshot.val();
                        const { userId, toolId, amount } = orderData;
                        console.log(`👤 Processing successful payment for user: ${userId}, tool: ${toolId}`);
                        // Update order status to completed
                        await orderRef.update({
                            status: 'completed',
                            transactionId: response.transactionId || 'phonepe_verified',
                            responseCode: response.code,
                            updatedAt: Date.now(),
                            completedAt: Date.now()
                        });
                        // Also update in Firestore
                        await db.collection('orders').doc(merchantOrderId).update({
                            status: 'completed',
                            transactionId: response.transactionId || 'phonepe_verified',
                            responseCode: response.code,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            completedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log("✅ Order status updated to completed");
                        // Create transaction record
                        const transactionData = {
                            userId,
                            toolId,
                            amount,
                            status: 'completed',
                            merchantTransactionId: merchantOrderId,
                            transactionId: response.transactionId || 'phonepe_verified',
                            paymentMethod: 'PhonePe',
                            verificationMethod: 'api_check',
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        };
                        await db.collection('transactions').doc(merchantOrderId).set(transactionData, { merge: true });
                        console.log("✅ Transaction record created/updated");
                        // Grant tool access to user
                        await db.collection('users').doc(userId).collection('tools').doc(toolId).set({
                            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            toolId,
                            source: 'PhonePe_verification',
                            transactionId: merchantOrderId
                        }, { merge: true });
                        // Update user's tools array for backward compatibility
                        await db.collection('users').doc(userId).update({
                            tools: admin.firestore.FieldValue.arrayUnion(toolId),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log("✅ Tool access granted to user");
                        // Create payment record
                        await db.collection('user_payments').add({
                            userId,
                            toolId,
                            amount,
                            paymentMethod: 'PhonePe',
                            status: 'completed',
                            merchantTransactionId: merchantOrderId,
                            transactionId: response.transactionId || 'phonepe_verified',
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log("✅ Payment record created");
                    }
                    else {
                        console.error("❌ Order not found in database:", merchantOrderId);
                    }
                }
                catch (dbError) {
                    console.error("❌ Database error during payment processing:", dbError);
                    // Still return success since payment was verified with PhonePe
                }
            }
            return res.status(200).json({
                success: true,
                state: response.state,
                code: response.code,
                message: response.message,
                isPaymentSuccessful: isSuccess
            });
        }
        catch (sdkError) {
            console.error("PhonePe SDK Error in status check:", sdkError);
            return res.status(500).json({
                success: false,
                error: sdkError instanceof Error ? sdkError.message : "PhonePe SDK Error",
            });
        }
    }
    catch (error) {
        console.error("General Error in verifyPhonePePayment:", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal Server Error",
        });
    }
});
// Create PhonePe SDK order for frontend integration
app.post('/createPhonePeSdkOrder', async (req, res) => {
    console.log("Create PhonePe SDK order route hit with body:", req.body);
    try {
        const { amount, userId, toolId } = req.body;
        if (!amount || !userId || !toolId) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameters",
            });
        }
        // PhonePe configuration
        const clientId = "SU2505221605010380976302";
        const clientSecret = "c6c71ce3-b5cb-499e-a8fd-dc55208daa13";
        const clientVersion = 1;
        const isProduction = process.env.NODE_ENV === 'production';
        const merchantOrderId = `ord_${userId}_${toolId}_${Date.now()}`;
        const redirectUrl = "https://www.rankblaze.in/payment-callback";
        try {
            // Load the SDK dynamically
            const sdkModule = require('pg-sdk-node');
            const { StandardCheckoutClient, Env, CreateSdkOrderRequest } = sdkModule;
            // Initialize client
            const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, isProduction ? Env.PRODUCTION : Env.SANDBOX);
            // Create SDK order
            const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
                .merchantOrderId(merchantOrderId)
                .amount(Number(amount) * 100) // Convert to paise
                .redirectUrl(redirectUrl)
                .build();
            const response = await client.createSdkOrder(request);
            console.log("SDK order response from PhonePe:", response);
            return res.status(200).json({
                success: true,
                token: response.token,
                merchantOrderId,
            });
        }
        catch (sdkError) {
            console.error("PhonePe SDK Error in SDK order creation:", sdkError);
            return res.status(500).json({
                success: false,
                error: sdkError instanceof Error ? sdkError.message : "PhonePe SDK Error",
            });
        }
    }
    catch (error) {
        console.error("General Error in createPhonePeSdkOrder:", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal Server Error",
        });
    }
});
// PhonePe configuration
const PHONEPE_CONFIG = {
    merchantId: ((_c = functions.config().phonepe) === null || _c === void 0 ? void 0 : _c.merchant_id) || process.env.PHONEPE_MERCHANT_ID || 'M22QF2VXZLOE8',
    saltKey: ((_d = functions.config().phonepe) === null || _d === void 0 ? void 0 : _d.salt_key) || process.env.PHONEPE_SALT_KEY || 'c6c71ce3-b5cb-499e-a8fd-dc55208daa13',
    saltIndex: ((_e = functions.config().phonepe) === null || _e === void 0 ? void 0 : _e.salt_index) || process.env.PHONEPE_SALT_INDEX || '1',
    environment: ((_f = functions.config().phonepe) === null || _f === void 0 ? void 0 : _f.env) || process.env.PHONEPE_ENV || 'PROD',
    callbackUrl: ((_g = functions.config().phonepe) === null || _g === void 0 ? void 0 : _g.callback_url) || process.env.PHONEPE_CALLBACK_URL || 'https://rankblaze.in/payment-status',
    apiUrl: ((_h = functions.config().phonepe) === null || _h === void 0 ? void 0 : _h.api_url) || process.env.PHONEPE_API_URL || 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
};
// Helper function to generate SHA256 checksum
const generateChecksum = (payload, saltKey) => {
    const string = payload + '/pg/v1/pay' + saltKey;
    return crypto.SHA256(string).toString(crypto.enc.Base64);
};
// Initialize payment with explicit CORS headers
app.post('/initializePayment', async (req, res) => {
    console.log('==== PAYMENT INITIALIZATION STARTED ====');
    // Set CORS headers for preflight request
    const allowedOrigins = ['https://www.rankblaze.in', 'https://rankblaze.in', 'http://localhost:3000', 'http://localhost:5173'];
    const origin = req.headers.origin;
    console.log('Request origin:', origin);
    if (origin && allowedOrigins.includes(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
        console.log('Set CORS origin header to:', origin);
    }
    else {
        console.log('Origin not in allowed list, skipping CORS origin header');
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Credentials", "true");
    console.log('Set standard CORS headers');
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        console.log('Handling OPTIONS preflight request');
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.set("Access-Control-Allow-Credentials", "true");
        return res.status(204).send(""); // No content
    }
    if (req.method !== "POST") {
        console.log('Rejecting non-POST method:', req.method);
        return res.status(405).send("Method Not Allowed");
    }
    try {
        // Log the request body to debug what's being received
        console.log('Received payment init body:', req.body);
        console.log('Request headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        // Check if body is empty
        if (!req.body || Object.keys(req.body).length === 0) {
            console.error('Request body is empty or undefined');
            return res.status(400).json({
                success: false,
                error: 'Request body is empty or missing'
            });
        }
        const { amount, userId, toolId } = req.body;
        // Create detailed error message for missing parameters
        const missingParams = [];
        if (amount === undefined || amount === null)
            missingParams.push('amount');
        if (!userId)
            missingParams.push('userId');
        if (!toolId)
            missingParams.push('toolId');
        if (missingParams.length > 0) {
            const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`;
            console.error(errorMessage, { received: req.body });
            return res.status(400).json({ success: false, error: errorMessage });
        }
        // Check if amount is valid (greater than 0)
        if (amount <= 0) {
            console.error('Invalid amount value', { amount });
            return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
        }
        console.log('All validation passed, proceeding with payment initialization');
        // Create a unique merchant transaction ID
        const merchantTransactionId = `RANKBLAZE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        console.log('Generated merchantTransactionId:', merchantTransactionId);
        try {
            // Save transaction details in Firebase
            console.log('Saving transaction to Firestore...');
            const db = admin.firestore();
            await db.collection('transactions').doc(merchantTransactionId).set({
                userId,
                toolId,
                amount,
                status: 'initiated',
                merchantTransactionId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('Transaction saved to Firestore');
            // Create PhonePe payload
            console.log('Creating PhonePe payload...');
            const payloadData = {
                merchantId: PHONEPE_CONFIG.merchantId,
                merchantTransactionId,
                merchantUserId: userId,
                amount: amount * 100, // Convert to paise
                redirectUrl: `${PHONEPE_CONFIG.callbackUrl}?merchantTransactionId=${merchantTransactionId}`,
                redirectMode: 'REDIRECT',
                callbackUrl: `${PHONEPE_CONFIG.callbackUrl}?merchantTransactionId=${merchantTransactionId}`,
                mobileNumber: '9999999999', // Optional, can be removed or made dynamic
                paymentInstrument: {
                    type: 'PAY_PAGE'
                }
            };
            console.log('PhonePe payload created:', payloadData);
            console.log('Converting payload to base64...');
            const base64Payload = Buffer.from(JSON.stringify(payloadData)).toString('base64');
            console.log('Generating checksum...');
            const checksum = generateChecksum(base64Payload, PHONEPE_CONFIG.saltKey);
            // Save data needed for verification in Realtime Database for faster access
            console.log('Saving transaction to Realtime Database...');
            const rtdb = admin.database();
            await rtdb.ref(`transactions/${merchantTransactionId}`).set({
                status: 'initiated',
                amount,
                userId,
                toolId,
                createdAt: Date.now(),
                checksum,
                payload: base64Payload
            });
            console.log('Transaction saved to Realtime Database');
            console.log('Sending successful response with payment details');
            return res.status(200).json({
                success: true,
                payload: base64Payload,
                checksum: `${checksum}###${PHONEPE_CONFIG.saltIndex}`,
                merchantTransactionId
            });
        }
        catch (dbError) {
            console.error('Database error during payment initialization:', dbError);
            return res.status(500).json({
                success: false,
                error: 'Database error during payment initialization'
            });
        }
    }
    catch (error) {
        console.error('Unexpected error initializing payment:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown payment initialization error'
        });
    }
});
// Verify payment status with explicit CORS headers
app.get('/verifyPayment', async (req, res) => {
    // Set CORS headers for preflight request
    res.set("Access-Control-Allow-Origin", "https://www.rankblaze.in");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Credentials", "true");
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        return res.status(204).send(""); // No content
    }
    if (req.method !== "GET") {
        return res.status(405).send("Method Not Allowed");
    }
    try {
        const { merchantTransactionId } = req.query;
        if (!merchantTransactionId) {
            return res.status(400).json({ success: false, error: 'Missing merchantTransactionId' });
        }
        // Fetch transaction from Firestore
        const db = admin.firestore();
        const transactionDoc = await db.collection('transactions').doc(merchantTransactionId).get();
        if (!transactionDoc.exists) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }
        const transactionData = transactionDoc.data();
        return res.status(200).json({
            success: true,
            status: (transactionData === null || transactionData === void 0 ? void 0 : transactionData.status) || 'unknown',
            transactionId: merchantTransactionId
        });
    }
    catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ success: false, error: 'Payment verification failed' });
    }
});
// Payment callback handler - Using the correct CORS implementation
app.post('/paymentCallback', (req, res) => {
    corsHandler(req, res, async () => {
        var _a, _b, _c;
        try {
            const { merchantTransactionId, transactionId, amount, responseCode } = req.body;
            if (!merchantTransactionId || !transactionId || !responseCode) {
                console.error('Missing required parameters in callback:', req.body);
                return res.status(400).json({ success: false, error: 'Missing required parameters' });
            }
            // Get transaction from Firestore
            const db = admin.firestore();
            const transactionRef = db.collection('transactions').doc(merchantTransactionId);
            const transactionDoc = await transactionRef.get();
            if (!transactionDoc.exists) {
                console.error('Transaction not found:', merchantTransactionId);
                return res.status(404).json({ success: false, error: 'Transaction not found' });
            }
            const transactionData = transactionDoc.data();
            if (!transactionData) {
                return res.status(404).json({ success: false, error: 'Transaction data not found' });
            }
            const isSuccess = responseCode === 'SUCCESS' || responseCode === 'PAYMENT_SUCCESS';
            // Update transaction in Firestore
            await transactionRef.update({
                status: isSuccess ? 'completed' : 'failed',
                responseCode,
                transactionId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update Realtime DB for faster access
            const rtdb = admin.database();
            await rtdb.ref(`transactions/${merchantTransactionId}`).update({
                status: isSuccess ? 'completed' : 'failed',
                responseCode,
                transactionId,
                updatedAt: Date.now()
            });
            // Process the successful payment
            if (isSuccess) {
                try {
                    // Add tool to user's collection
                    const userId = transactionData.userId;
                    const toolId = transactionData.toolId;
                    const paymentAmount = transactionData.amount;
                    // Add to user's purchased tools in Firestore
                    await db.collection('users').doc(userId).update({
                        tools: admin.firestore.FieldValue.arrayUnion(toolId),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    // Create a payment record
                    await db.collection('user_payments').add({
                        userId,
                        toolId,
                        amount: paymentAmount,
                        paymentMethod: 'PhonePe',
                        status: 'completed',
                        merchantTransactionId,
                        transactionId,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    // Add to admin payments collection for analytics
                    await db.collection('admin_payments').add({
                        userId,
                        toolId,
                        amount: paymentAmount,
                        paymentMethod: 'PhonePe',
                        status: 'completed',
                        merchantTransactionId,
                        transactionId,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    // Find user email to send confirmation
                    const userDoc = await db.collection('users').doc(userId).get();
                    if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.email)) {
                        // Send payment confirmation email
                        const mailOptions = {
                            from: ((_b = functions.config().email) === null || _b === void 0 ? void 0 : _b.user) || process.env.EMAIL_USER || 'your-email@gmail.com',
                            to: (_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.email,
                            subject: 'Payment Confirmation - RANKBLAZE',
                            html: emailTemplates.payment(merchantTransactionId, paymentAmount)
                        };
                        await transporter.sendMail(mailOptions);
                    }
                }
                catch (error) {
                    console.error('Error processing successful payment:', error);
                    // We'll still return success since the payment itself was successful
                }
            }
            return res.status(200).json({
                success: true,
                status: isSuccess ? 'completed' : 'failed'
            });
        }
        catch (error) {
            console.error('Error in payment callback:', error);
            return res.status(500).json({ success: false, error: 'Payment callback processing failed' });
        }
    });
});
// Get user tools API with CORS handler
app.get('/getUserTools', (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'Missing userId' });
            }
            // Get user from Firestore
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            // Return user's tools
            const userData = userDoc.data();
            return res.status(200).json({
                success: true,
                tools: (userData === null || userData === void 0 ? void 0 : userData.tools) || []
            });
        }
        catch (error) {
            console.error('Error getting user tools:', error);
            return res.status(500).json({ success: false, error: 'Failed to get user tools' });
        }
    });
});
// Add a CORS test endpoint
app.get('/cors-test', (req, res) => {
    corsHandler(req, res, () => {
        res.status(200).json({
            success: true,
            message: 'CORS is working!',
            origin: req.headers.origin || 'unknown'
        });
    });
});
// PhonePe payment routes
app.post('/initializePhonePePayment', (req, res) => {
    // Forward the request to the standalone function
    return (0, phone_pe_payment_1.initializePhonePePayment)(req, res);
});
app.get('/verifyPhonePePayment', (req, res) => {
    // Forward the request to the standalone function
    return (0, phone_pe_payment_1.verifyPhonePePayment)(req, res);
});
app.post('/createPhonePeSdkOrder', (req, res) => {
    // Forward the request to the standalone function
    return (0, phone_pe_payment_1.createPhonePeSdkOrder)(req, res);
});
// PhonePe Webhook for payment callbacks
app.post('/webhook/phonepe', async (req, res) => {
    console.log("🔔 PhonePe webhook received:", req.body);
    try {
        // PhonePe webhook authentication - using the credentials
        const username = "aryan8009"; // Your PhonePe username
        const password = "Aryan7071"; // Your PhonePe password
        // Extract the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.error("❌ Missing authorization header");
            return res.status(401).send("Unauthorized");
        }
        // Parse webhook data
        const { event, data } = req.body;
        if (!event || !data) {
            console.error("❌ Missing event or data in webhook");
            return res.status(400).send("Bad Request");
        }
        console.log(`📋 Processing webhook event: ${event}`);
        // Extract transaction details
        const { merchantTransactionId, transactionId, amount, responseCode } = data;
        if (!merchantTransactionId) {
            console.error("❌ Missing merchantTransactionId in webhook data");
            return res.status(400).send("Bad Request");
        }
        console.log(`💳 Processing transaction: ${merchantTransactionId}`);
        // Determine if payment was successful
        const isSuccess = responseCode === 'PAYMENT_SUCCESS' || responseCode === 'SUCCESS';
        const status = isSuccess ? 'completed' : 'failed';
        console.log(`📊 Payment status: ${status} (responseCode: ${responseCode})`);
        try {
            const rtdb = admin.database();
            const db = admin.firestore();
            // Update order in Realtime Database
            const orderRef = rtdb.ref(`orders/${merchantTransactionId}`);
            const orderSnapshot = await orderRef.get();
            if (!orderSnapshot.exists()) {
                console.error(`❌ Order not found in database: ${merchantTransactionId}`);
                return res.status(404).send("Order not found");
            }
            const orderData = orderSnapshot.val();
            const { userId, toolId, amount: orderAmount } = orderData;
            console.log(`👤 User: ${userId}, 🔧 Tool: ${toolId}, 💰 Amount: ${orderAmount}`);
            // Update order status
            await orderRef.update({
                status,
                transactionId,
                responseCode,
                updatedAt: Date.now(),
                completedAt: isSuccess ? Date.now() : null
            });
            console.log("✅ Order updated in Realtime Database");
            // Also update in Firestore
            await db.collection('orders').doc(merchantTransactionId).update({
                status,
                transactionId,
                responseCode,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                completedAt: isSuccess ? admin.firestore.FieldValue.serverTimestamp() : null
            });
            console.log("✅ Order updated in Firestore");
            // If payment successful, grant tool access to user
            if (isSuccess) {
                console.log("🎉 Payment successful! Granting tool access...");
                try {
                    // Create transaction record
                    const transactionData = {
                        userId,
                        toolId,
                        amount: orderAmount,
                        status: 'completed',
                        merchantTransactionId,
                        transactionId,
                        paymentMethod: 'PhonePe',
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    };
                    // Store transaction in Firestore
                    await db.collection('transactions').doc(merchantTransactionId).set(transactionData);
                    console.log("✅ Transaction record created");
                    // Grant tool access to user
                    await db.collection('users').doc(userId).collection('tools').doc(toolId).set({
                        activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        toolId,
                        source: 'PhonePe_webhook',
                        transactionId: merchantTransactionId
                    });
                    // Update user's tools array for backward compatibility
                    await db.collection('users').doc(userId).update({
                        tools: admin.firestore.FieldValue.arrayUnion(toolId),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log("✅ Tool access granted to user");
                    // Create payment record
                    await db.collection('user_payments').add({
                        userId,
                        toolId,
                        amount: orderAmount,
                        paymentMethod: 'PhonePe',
                        status: 'completed',
                        merchantTransactionId,
                        transactionId,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log("✅ Payment record created");
                }
                catch (accessError) {
                    console.error("❌ Error granting tool access:", accessError);
                    // Don't fail the webhook response, just log the error
                }
            }
            // Always respond with 200 OK to PhonePe
            console.log("✅ Webhook processed successfully");
            return res.status(200).send("OK");
        }
        catch (dbError) {
            console.error("❌ Database error in webhook:", dbError);
            return res.status(500).send("Database error");
        }
    }
    catch (error) {
        console.error("❌ Error processing PhonePe webhook:", error);
        return res.status(500).send("Internal server error");
    }
});
// Add a catch-all route at the end to handle 404s
app.all('*', (req, res) => {
    console.log(`Route not found: ${req.method} ${req.path}`);
    res.status(404).send(`Route not found: ${req.method} ${req.path}`);
});
// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);
// Import PhonePe payment functions
const phone_pe_payment_1 = require("./phone-pe-payment");
// No need to re-export these functions as they're already integrated in the Express app above 
//# sourceMappingURL=index.js.map
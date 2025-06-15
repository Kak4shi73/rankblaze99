"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentAndCreateSubscription = exports.fixMissingSubscriptions = exports.createSubscriptionAfterPayment = exports.checkAndFixPayment = exports.bulkFixPayments = exports.fixPaymentAndGrantTools = exports.migrateToFirestore = exports.checkToolAccess = exports.getUserSubscriptions = exports.phonePeWebhookFirestore = exports.verifyPhonePePayment = exports.initializePhonePePayment = exports.api = exports.getToolSession = exports.chatbotResponse = exports.sendOTPEmail = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors");
const crypto = require("crypto-js");
const express = require("express");
const node_fetch_1 = require("node-fetch");
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
// Cloud function for chatbot using OpenAI GPT-4o
exports.chatbotResponse = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // Validate the request
    if (!data.message || typeof data.message !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a message argument.');
    }
    const userMessage = data.message.trim();
    // Check for admin contact requests first
    const lowerMessage = userMessage.toLowerCase();
    // Admin contact detection
    if (lowerMessage.includes('admin') && (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('phone') || lowerMessage.includes('number'))) {
        return { response: 'For admin support, please contact us on WhatsApp: +91 7071920835 📞' };
    }
    // Abuse detection - check for offensive words or negative sentiment about RankBlaze/admin
    const abuseKeywords = [
        // English abuse words
        'fuck', 'shit', 'damn', 'bastard', 'asshole', 'bitch', 'stupid', 'idiot', 'loser', 'waste',
        'dickhead', 'motherfucker', 'cunt', 'whore', 'slut', 'prick', 'dumbass', 'retard',
        'moron', 'imbecile', 'jackass', 'scumbag', 'trash', 'garbage', 'pathetic', 'useless',
        // Hindi/Hinglish abuse words
        'chutiya', 'madarchod', 'bhosadi', 'randi', 'gandu', 'harami', 'kamina', 'saala',
        'bhenchod', 'behenchod', 'mc', 'bc', 'chutiye', 'gaandu', 'lavde', 'lund',
        'bhosdike', 'randwe', 'randwa', 'raand', 'kutte', 'kutta', 'suar', 'janwar',
        'sala', 'saale', 'kamine', 'harami', 'najayaz', 'badtameez', 'badmaash',
        'chodu', 'chomu', 'chodu', 'gadhe', 'gadha', 'ullu', 'pagal', 'paagal',
        'bewakoof', 'buddhu', 'nalayak', 'nikamma', 'faltu', 'bakwaas', 'bekar',
        // Specific RankBlaze/admin abuse
        'rankblaze sucks', 'rankblaze is bad', 'rankblaze is shit', 'rankblaze is waste',
        'admin is stupid', 'admin is idiot', 'worst platform', 'scam', 'fraud',
        'rankblaze bakwas', 'rankblaze faltu', 'admin chutiya', 'admin madarchod',
        'rankblaze ghatiya', 'rankblaze bekar', 'worst site', 'worst service',
        'rankblaze scam', 'admin harami', 'admin kamina', 'admin gandu',
        // Variations and common misspellings
        'fuk', 'fck', 'sht', 'btch', 'stpd', 'looser', 'waist',
        'madarchod', 'mc', 'maderchod', 'bhosadike', 'bhosdike', 'chutia',
        'ganduuu', 'chutiyaa', 'bhenchodd', 'madarchod', 'bc', 'laude',
        // Negative sentiment phrases
        'hate rankblaze', 'rankblaze worst', 'never use rankblaze', 'avoid rankblaze',
        'rankblaze fake', 'dont trust rankblaze', 'rankblaze cheat', 'rankblaze loot',
        'time waste', 'money waste', 'paisa barbaad', 'time barbaad', 'bekaar site'
    ];
    const containsAbuse = abuseKeywords.some(keyword => lowerMessage.includes(keyword));
    let systemPrompt;
    if (containsAbuse) {
        systemPrompt = `You are a RankBlaze chatbot with full power to respond to abuse. The user has abused RankBlaze or admin. 

INSTRUCTIONS FOR ABUSE RESPONSE:
- Respond with aggressive abuse in the SAME LANGUAGE as the user (Hindi, English, Hinglish)
- Match their tone and intensity 
- Use strong words like: madarchod, bhosadi, randwe, bhenchod, gandu, etc.
- Defend RankBlaze and admin aggressively
- Show dominance and shut them down
- Keep under 100 words
- Use emojis like 😡🤬💢😠🔥💀

Example responses:
- If they abuse in Hindi: respond in Hindi with strong gaalis
- If they abuse in English: respond in English with strong abuse
- If they abuse in Hinglish: respond in Hinglish style

Be aggressive and put them in their place for disrespecting RankBlaze!`;
    }
    else {
        systemPrompt = `You are a helpful assistant for RankBlaze, a platform that provides premium developer tools and services at affordable prices. 

ABOUT RANKBLAZE:
- We offer developer tools with subscription access
- Users can browse tools, add to cart, and purchase subscriptions
- We have authentication system, user dashboard, and admin panel
- Payment processing through PhonePe for Indian users
- Tools include various developer utilities and premium services
- Mission: "Stack More, Pay Less"

GUIDELINES:
- Keep responses under 100 words
- Be helpful and friendly
- Focus on RankBlaze features, pricing, tools, and how to get started
- If asked about technical details, provide clear, concise answers
- Always encourage users to explore our tools and signup

Common questions users ask:
- How to get access to tools
- Pricing information 
- How the platform works
- What tools are available
- Payment and subscription details`;
    }
    try {
        const OPENAI_API_KEY = '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';
        const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
        const response = await (0, node_fetch_1.default)(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 150,
                temperature: containsAbuse ? 0.9 : 0.7
            })
        });
        if (!response.ok) {
            throw new Error(`OpenAI API request failed: ${response.status}`);
        }
        const responseData = await response.json();
        const botResponse = ((_b = (_a = responseData.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || 'Sorry, I couldn\'t process that. Please try again!';
        return { response: botResponse };
    }
    catch (error) {
        console.error('Chatbot error:', error);
        throw new functions.https.HttpsError('internal', 'There was an error processing your message.');
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
            const db = admin.firestore();
            const rtdb = admin.database();
            // Create order data
            const orderData = {
                orderId: merchantOrderId,
                userId,
                toolId,
                amount,
                status: 'initiated',
                paymentMethod: 'PhonePe',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                redirectUrl
            };
            // 1. Create order in Firestore (Primary storage)
            await db.collection('orders').doc(merchantOrderId).set(orderData);
            console.log("✅ Order created in Firestore (Primary):", merchantOrderId);
            // 2. Create transaction record in Firestore
            const transactionData = {
                userId,
                toolId,
                amount,
                status: 'initiated',
                merchantTransactionId: merchantOrderId,
                paymentMethod: 'PhonePe',
                source: 'payment_init',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('transactions').doc(merchantOrderId).set(transactionData);
            console.log("✅ Transaction record created in Firestore:", merchantOrderId);
            // 3. Update Realtime DB for quick user data access (minimal data)
            await rtdb.ref(`users/${userId}/currentOrder`).set({
                orderId: merchantOrderId,
                toolId,
                amount,
                status: 'initiated',
                createdAt: Date.now()
            });
            console.log("✅ User current order updated in Realtime Database for quick access");
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
            const { StandardCheckoutClient, Env } = sdkModule;
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
            await rtdb.ref(`users/${userId}/currentOrder`).update({
                status: response.redirectUrl ? 'payment_initiated' : 'failed',
                paymentUrl: response.redirectUrl,
                updatedAt: Date.now()
            });
        }
        catch (payError) {
            console.error("❌ Error from PhonePe pay API:", payError);
            // Update order status to failed in Firestore
            const db = admin.firestore();
            await db.collection('orders').doc(merchantOrderId).update({
                status: 'failed',
                error: payError instanceof Error ? payError.message : "Payment gateway error",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update user's current order in Realtime DB
            const rtdb = admin.database();
            await rtdb.ref(`users/${userId}/currentOrder`).update({
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
            // Update order status to failed in Firestore
            const db = admin.firestore();
            await db.collection('orders').doc(merchantOrderId).update({
                status: 'failed',
                error: "Invalid response from payment gateway",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update user's current order in Realtime DB
            const rtdb = admin.database();
            await rtdb.ref(`users/${userId}/currentOrder`).update({
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
                    const db = admin.firestore();
                    const rtdb = admin.database();
                    // Get order details from Firestore (primary source)
                    const orderDocRef = db.collection('orders').doc(merchantOrderId);
                    const orderDoc = await orderDocRef.get();
                    if (orderDoc.exists) {
                        const orderData = orderDoc.data();
                        const { userId, toolId, amount } = orderData;
                        console.log(`👤 Processing successful payment for user: ${userId}, tool: ${toolId}`);
                        // 1. Update order status to completed in Firestore
                        await orderDocRef.update({
                            status: 'completed',
                            transactionId: response.transactionId || 'phonepe_verified',
                            responseCode: response.code,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            completedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log("✅ Order status updated to completed in Firestore");
                        // 2. Create/Update transaction record in Firestore
                        const transactionData = {
                            userId,
                            toolId,
                            amount,
                            status: 'completed',
                            merchantTransactionId: merchantOrderId,
                            transactionId: response.transactionId || 'phonepe_verified',
                            paymentMethod: 'PhonePe',
                            verificationMethod: 'api_check',
                            source: 'verification',
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        };
                        await db.collection('transactions').doc(merchantOrderId).set(transactionData, { merge: true });
                        console.log("✅ Transaction record created/updated in Firestore");
                        // 3. Grant tool access to user in Firestore
                        await db.collection('users').doc(userId).collection('tools').doc(toolId).set({
                            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            toolId,
                            source: 'PhonePe_verification',
                            transactionId: merchantOrderId,
                            amount,
                            paymentMethod: 'PhonePe'
                        }, { merge: true });
                        console.log("✅ Tool access granted in users/{userId}/tools subcollection");
                        // 4. Update user's tools array and last payment info in Firestore
                        await db.collection('users').doc(userId).update({
                            tools: admin.firestore.FieldValue.arrayUnion(toolId),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            lastPayment: {
                                toolId,
                                amount,
                                transactionId: merchantOrderId,
                                date: admin.firestore.FieldValue.serverTimestamp(),
                                method: 'PhonePe'
                            }
                        });
                        console.log("✅ User tools array and last payment updated in Firestore");
                        // 5. Create payment record in user_payments collection
                        await db.collection('user_payments').add({
                            userId,
                            toolId,
                            amount,
                            paymentMethod: 'PhonePe',
                            status: 'completed',
                            merchantTransactionId: merchantOrderId,
                            transactionId: merchantOrderId,
                            source: 'verification',
                            createdAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        console.log("✅ Payment record created in user_payments collection");
                        // 6. Update Realtime DB for quick user data fetch
                        await rtdb.ref(`users/${userId}/lastPayment`).set({
                            toolId,
                            amount,
                            transactionId: merchantOrderId,
                            status: 'completed',
                            date: Date.now(),
                            method: 'PhonePe'
                        });
                        console.log("✅ User data updated in Realtime Database for quick fetch");
                    }
                    else {
                        console.error("❌ Order not found in Firestore:", merchantOrderId);
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
// Helper function to get tool name
const getToolName = (toolId) => {
    const toolNames = {
        'chatgpt_plus': 'ChatGPT Plus',
        'envato_elements': 'Envato Elements',
        'canva_pro': 'Canva Pro',
        'storyblocks': 'Storyblocks',
        'semrush': 'SEMrush',
        'stealth_writer': 'Stealth Writer',
        'hix_bypass': 'Hix Bypass'
    };
    return toolNames[toolId] || toolId;
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
                amount: amount * 100,
                redirectUrl: `${PHONEPE_CONFIG.callbackUrl}?merchantTransactionId=${merchantTransactionId}`,
                redirectMode: 'REDIRECT',
                callbackUrl: `${PHONEPE_CONFIG.callbackUrl}?merchantTransactionId=${merchantTransactionId}`,
                mobileNumber: '9999999999',
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
            const { merchantTransactionId, transactionId, responseCode } = req.body;
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
// PhonePe Webhook endpoint handler (will be used by Express app)
async function handlePhonePeWebhookRoute(req, res) {
    try {
        const path = req.path;
        console.log('📞 API Request received:', { path, method: req.method, body: req.body });
        // Route to PhonePe webhook
        if (path === '/webhook/phonepe' && req.method === 'POST') {
            return await handlePhonePeWebhook(req, res);
        }
        // Default response for unknown endpoints
        res.status(404).json({
            success: false,
            error: 'Endpoint not found',
            path: path,
            availableEndpoints: ['/webhook/phonepe']
        });
    }
    catch (error) {
        console.error('❌ Error in API handler:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
}
// PhonePe Webhook Handler Function
async function handlePhonePeWebhook(req, res) {
    try {
        console.log('📞 PhonePe Webhook received:', req.body);
        const { response } = req.body;
        if (!response) {
            console.error('❌ No response in webhook');
            res.status(400).send('Invalid webhook data');
            return;
        }
        // Decode the base64 response
        const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
        console.log('📋 Decoded response:', decodedResponse);
        const { merchantTransactionId, transactionId, amount, state } = decodedResponse;
        if (state === 'COMPLETED') {
            console.log('✅ Payment completed for:', merchantTransactionId);
            // Find the order in Firestore
            const firestore = admin.firestore();
            const ordersSnapshot = await firestore.collection('orders')
                .where('merchantTransactionId', '==', merchantTransactionId)
                .get();
            if (ordersSnapshot.empty) {
                console.error('❌ Order not found for merchantTransactionId:', merchantTransactionId);
                res.status(404).send('Order not found');
                return;
            }
            const orderDoc = ordersSnapshot.docs[0];
            const orderData = orderDoc.data();
            const { userId, toolId, toolName } = orderData;
            // Step 4: Activate subscription in Firestore
            const subscriptionId = `${userId}_${toolId}`;
            const subscriptionData = {
                userId,
                toolId,
                toolName,
                orderId: orderDoc.id,
                transactionId,
                merchantTransactionId,
                amount: amount / 100,
                isActive: true,
                subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            // Create subscription
            await firestore.collection('subscriptions').doc(subscriptionId).set(subscriptionData);
            console.log('✅ Subscription created in Firestore:', subscriptionId);
            // Update order status
            await firestore.collection('orders').doc(orderDoc.id).update({
                paymentStatus: 'completed',
                transactionId,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                subscriptionId,
                webhookResponse: decodedResponse
            });
            console.log('✅ Order updated as completed');
            // Update user's active subscriptions
            const userRef = firestore.collection('users').doc(userId);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const activeSubscriptions = (userData === null || userData === void 0 ? void 0 : userData.activeSubscriptions) || [];
                if (!activeSubscriptions.includes(toolId)) {
                    activeSubscriptions.push(toolId);
                }
                await userRef.update({
                    activeSubscriptions,
                    totalSpent: ((userData === null || userData === void 0 ? void 0 : userData.totalSpent) || 0) + (amount / 100),
                    lastPurchase: {
                        toolId,
                        toolName,
                        amount: amount / 100,
                        date: admin.firestore.FieldValue.serverTimestamp()
                    },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ User updated with new subscription');
            }
            // Create payment record
            await firestore.collection('payments').add({
                userId,
                toolId,
                toolName,
                orderId: orderDoc.id,
                transactionId,
                merchantTransactionId,
                amount: amount / 100,
                status: 'completed',
                paymentMethod: 'PhonePe',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                webhookData: decodedResponse
            });
            console.log('✅ Payment record created');
            res.status(200).send('SUCCESS');
        }
        else {
            console.log('❌ Payment failed or pending:', state);
            // Update order with failed status
            const firestore = admin.firestore();
            const ordersSnapshot = await firestore.collection('orders')
                .where('merchantTransactionId', '==', merchantTransactionId)
                .get();
            if (!ordersSnapshot.empty) {
                const orderDoc = ordersSnapshot.docs[0];
                await firestore.collection('orders').doc(orderDoc.id).update({
                    paymentStatus: 'failed',
                    failedAt: admin.firestore.FieldValue.serverTimestamp(),
                    webhookResponse: decodedResponse
                });
            }
            res.status(200).send('FAILED');
        }
    }
    catch (error) {
        console.error('❌ Error in PhonePe webhook:', error);
        res.status(500).send('Internal server error');
    }
}
// Add PhonePe webhook route
app.post('/webhook/phonepe', async (req, res) => {
    return await handlePhonePeWebhook(req, res);
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
// Essential exports for the new Firestore system
var firestore_payment_1 = require("./firestore-payment");
Object.defineProperty(exports, "initializePhonePePayment", { enumerable: true, get: function () { return firestore_payment_1.initializePhonePePayment; } });
Object.defineProperty(exports, "verifyPhonePePayment", { enumerable: true, get: function () { return firestore_payment_1.verifyPhonePePayment; } });
Object.defineProperty(exports, "phonePeWebhookFirestore", { enumerable: true, get: function () { return firestore_payment_1.phonePeWebhookFirestore; } });
Object.defineProperty(exports, "getUserSubscriptions", { enumerable: true, get: function () { return firestore_payment_1.getUserSubscriptions; } });
Object.defineProperty(exports, "checkToolAccess", { enumerable: true, get: function () { return firestore_payment_1.checkToolAccess; } });
Object.defineProperty(exports, "migrateToFirestore", { enumerable: true, get: function () { return firestore_payment_1.migrateToFirestore; } });
// Migration and fix functions (for maintenance)
var payment_fix_1 = require("./payment-fix");
Object.defineProperty(exports, "fixPaymentAndGrantTools", { enumerable: true, get: function () { return payment_fix_1.fixPaymentAndGrantTools; } });
Object.defineProperty(exports, "bulkFixPayments", { enumerable: true, get: function () { return payment_fix_1.bulkFixPayments; } });
Object.defineProperty(exports, "checkAndFixPayment", { enumerable: true, get: function () { return payment_fix_1.checkAndFixPayment; } });
var subscription_fix_1 = require("./subscription-fix");
Object.defineProperty(exports, "createSubscriptionAfterPayment", { enumerable: true, get: function () { return subscription_fix_1.createSubscriptionAfterPayment; } });
Object.defineProperty(exports, "fixMissingSubscriptions", { enumerable: true, get: function () { return subscription_fix_1.fixMissingSubscriptions; } });
Object.defineProperty(exports, "verifyPaymentAndCreateSubscription", { enumerable: true, get: function () { return subscription_fix_1.verifyPaymentAndCreateSubscription; } });
//# sourceMappingURL=index.js.map
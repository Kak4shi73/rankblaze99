import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import * as cors from 'cors';
import * as crypto from 'crypto-js';
import * as express from 'express';
import { Request, Response } from 'express';

// Initialize Firebase admin SDK
admin.initializeApp();

// Create a nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Email templates
const emailTemplates = {
  otp: (otp: string) => `
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
  payment: (orderId: string, amount: number) => `
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

interface OtpEmailData {
  email: string;
  otp: string;
  subject?: string;
  template: string;
}

// Cloud function to send OTP verification email
export const sendOTPEmail = functions.https.onCall(
  async (data: OtpEmailData, context: functions.https.CallableContext) => {
    // Validate the request
    if (!data.email || !data.otp) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with email and OTP arguments.'
      );
    }

    const { email, otp, subject, template } = data;

    try {
      // Prepare email
      const mailOptions = {
        from: functions.config().email?.user || process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: subject || 'Your Verification Code',
        html: template === 'otp' ? emailTemplates.otp(otp) : emailTemplates.payment(otp, 0)
      };

      // Send email
      await transporter.sendMail(mailOptions);

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new functions.https.HttpsError(
        'internal',
        'There was an error sending the email.'
      );
    }
  }
);

// Interface for tool session data
interface ToolSessionRequest {
  userId: string;
  toolId: string;
  accessCode: string;
}

// Cloud function to get tool session cookies
export const getToolSession = functions.https.onCall(
  async (data: ToolSessionRequest, context: functions.https.CallableContext) => {
    try {
      // Validate the request
      if (!data.userId || !data.toolId || !data.accessCode) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required parameters'
        );
      }

      // Verify user has access to the tool
      const db = admin.database();
      const subscriptionsRef = db.ref('subscriptions');
      const subscriptionsSnapshot = await subscriptionsRef.once('value');
      
      if (!subscriptionsSnapshot.exists()) {
        throw new functions.https.HttpsError(
          'not-found',
          'No subscriptions found'
        );
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
              if (
                (typeof tool === 'string' && tool === data.toolId) ||
                (typeof tool === 'object' && 
                 tool.id === data.toolId && 
                 tool.status === 'active')
              ) {
                hasAccess = true;
                break;
              }
            }
          }
        }
        
        if (hasAccess) break;
      }
      
      if (!hasAccess) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'User does not have access to this tool'
        );
      }
      
      // Log the access attempt
      const accessLogRef = db.ref(`toolAccessLogs/${data.toolId}_${data.userId}_${Date.now()}`);
      await accessLogRef.set({
        userId: data.userId,
        toolId: data.toolId,
        accessCode: data.accessCode,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        source: 'extension',
        ip: context.rawRequest?.ip || 'unknown'
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
      
      const sessionData = toolSessions[data.toolId as keyof typeof toolSessions];
      
      if (!sessionData) {
        throw new functions.https.HttpsError(
          'not-found',
          'Session data not available for this tool'
        );
      }
      
      // Return session data to the extension
      return {
        success: true,
        sessionData: sessionData
      };
      
    } catch (error) {
      console.error('Error getting tool session:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get tool session'
      );
    }
  }
);

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

// PhonePe configuration
const PHONEPE_CONFIG = {
  merchantId: functions.config().phonepe?.merchant_id || process.env.PHONEPE_MERCHANT_ID || 'SU2505221605010380976302',
  saltKey: functions.config().phonepe?.salt_key || process.env.PHONEPE_SALT_KEY || 'c6c71ce3-b5cb-499e-a8fd-dc55208daa13',
  saltIndex: functions.config().phonepe?.salt_index || process.env.PHONEPE_SALT_INDEX || '1',
  environment: functions.config().phonepe?.env || process.env.PHONEPE_ENV || 'PROD',
  callbackUrl: functions.config().phonepe?.callback_url || process.env.PHONEPE_CALLBACK_URL || 'https://rankblaze.in/payment-status'
};

// Helper function to generate SHA256 checksum
const generateChecksum = (payload: string, saltKey: string): string => {
  const string = payload + '/pg/v1/pay' + saltKey;
  return crypto.SHA256(string).toString(crypto.enc.Base64);
};

// Initialize payment with explicit CORS headers
app.post('/initializePayment', async (req: Request, res: Response) => {
  // Set CORS headers for preflight request
  const allowedOrigins = ['https://www.rankblaze.in', 'https://rankblaze.in', 'http://localhost:3000', 'http://localhost:5173'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Credentials", "true");
    return res.status(204).send(""); // No content
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { amount, userId, toolId } = req.body;

    if (!amount || !userId || !toolId) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    // Create a unique merchant transaction ID
    const merchantTransactionId = `RANKBLAZE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Save transaction details in Firebase
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

    // Create PhonePe payload
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

    const base64Payload = Buffer.from(JSON.stringify(payloadData)).toString('base64');
    const checksum = generateChecksum(base64Payload, PHONEPE_CONFIG.saltKey);

    // Save data needed for verification in Realtime Database for faster access
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

    return res.status(200).json({
      success: true,
      payload: base64Payload,
      checksum: `${checksum}###${PHONEPE_CONFIG.saltIndex}`,
      merchantTransactionId
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    return res.status(500).json({ success: false, error: 'Payment initialization failed' });
  }
});

// Verify payment status with explicit CORS headers
app.get('/verifyPayment', async (req: Request, res: Response) => {
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
    const transactionDoc = await db.collection('transactions').doc(merchantTransactionId as string).get();

    if (!transactionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const transactionData = transactionDoc.data();

    return res.status(200).json({
      success: true,
      status: transactionData?.status || 'unknown',
      transactionId: merchantTransactionId
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// Payment callback handler - Using the correct CORS implementation
app.post('/paymentCallback', (req: Request, res: Response) => {
  corsHandler(req, res, async () => {
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
          if (userDoc.exists && userDoc.data()?.email) {
            // Send payment confirmation email
            const mailOptions = {
              from: functions.config().email?.user || process.env.EMAIL_USER || 'your-email@gmail.com',
              to: userDoc.data()?.email,
              subject: 'Payment Confirmation - RANKBLAZE',
              html: emailTemplates.payment(merchantTransactionId as string, paymentAmount)
            };

            await transporter.sendMail(mailOptions);
          }
        } catch (error) {
          console.error('Error processing successful payment:', error);
          // We'll still return success since the payment itself was successful
        }
      }

      return res.status(200).json({
        success: true,
        status: isSuccess ? 'completed' : 'failed'
      });
    } catch (error) {
      console.error('Error in payment callback:', error);
      return res.status(500).json({ success: false, error: 'Payment callback processing failed' });
    }
  });
});

// Get user tools API with CORS handler
app.get('/getUserTools', (req: Request, res: Response) => {
  corsHandler(req, res, async () => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Missing userId' });
      }
      
      // Get user from Firestore
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(userId as string).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      // Return user's tools
      const userData = userDoc.data();
      return res.status(200).json({
        success: true,
        tools: userData?.tools || []
      });
    } catch (error) {
      console.error('Error getting user tools:', error);
      return res.status(500).json({ success: false, error: 'Failed to get user tools' });
    }
  });
});

// Add a CORS test endpoint
app.get('/cors-test', (req: Request, res: Response) => {
  corsHandler(req, res, () => {
    res.status(200).json({ 
      success: true, 
      message: 'CORS is working!',
      origin: req.headers.origin || 'unknown'
    });
  });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app); 
"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToolSession = exports.sendOTPEmail = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
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
            html: emailTemplates[template](otp)
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
//# sourceMappingURL=index.js.map
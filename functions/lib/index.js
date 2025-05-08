"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
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
//# sourceMappingURL=index.js.map
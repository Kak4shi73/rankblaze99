# Firebase Functions for OTP Email Authentication

This directory contains Firebase Cloud Functions used for sending OTP verification emails.

## Setup

1. Install Firebase CLI if you haven't already:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Install dependencies:
   ```
   cd functions
   npm install
   ```

4. Set up environment variables for email sending:
   ```
   firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
   ```

   Note: For Gmail, you'll need to create an app password. Go to your Google Account > Security > 2-Step Verification > App passwords.

## Local Development

1. Build functions:
   ```
   npm run build
   ```

2. Start emulators:
   ```
   firebase emulators:start
   ```

## Deployment

Deploy functions to Firebase:
```
firebase deploy --only functions
```

## Updating Functions

After making changes to functions:
1. Build functions: `npm run build`
2. Deploy: `firebase deploy --only functions`

## Function Documentation

### sendOTPEmail

Callable function that sends an OTP verification email.

**Parameters:**
- `email`: Recipient email address
- `otp`: One-time password (6-digit code)
- `subject`: Email subject (optional)
- `template`: Email template name (currently only 'otp' is supported)

**Example usage:**
```javascript
const functions = getFunctions();
const sendOTPEmailFunction = httpsCallable(functions, 'sendOTPEmail');

await sendOTPEmailFunction({
  email: 'user@example.com',
  otp: '123456',
  subject: 'Your verification code',
  template: 'otp'
});
``` 
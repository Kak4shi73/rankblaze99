# PhonePe Payment Gateway Integration

This document outlines how to set up PhonePe Payment Gateway integration with RankBlaze.

## Prerequisites

- Node.js v14 or higher
- Firebase project with Cloud Functions enabled
- PhonePe business account and credentials

## Installation

1. Install the PhonePe SDK in the functions directory:

```bash
cd functions
npm install
```

This will automatically install the PhonePe SDK via the postinstall script.

## Configuration

### Environment Variables

Set up the following environment variables in your Firebase project:

```bash
firebase functions:config:set phonepe.client_id="YOUR_CLIENT_ID"
firebase functions:config:set phonepe.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set phonepe.callback_username="YOUR_CALLBACK_USERNAME"
firebase functions:config:set phonepe.callback_password="YOUR_CALLBACK_PASSWORD"
```

You can also set these locally for development in a `.runtimeconfig.json` file in the functions directory:

```json
{
  "phonepe": {
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "callback_username": "YOUR_CALLBACK_USERNAME",
    "callback_password": "YOUR_CALLBACK_PASSWORD"
  }
}
```

### Update the Functions Code

Update the `phone-pe-payment.ts` file to access these environment variables:

```typescript
const clientId = process.env.PHONEPE_CLIENT_ID || functions.config().phonepe.client_id || "";
const clientSecret = process.env.PHONEPE_CLIENT_SECRET || functions.config().phonepe.client_secret || "";
const username = process.env.PHONEPE_CALLBACK_USERNAME || functions.config().phonepe.callback_username || "";
const password = process.env.PHONEPE_CALLBACK_PASSWORD || functions.config().phonepe.callback_password || "";
```

## API Endpoints

The following API endpoints are available:

1. **Initialize Payment**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/initializePhonePePayment`
   
   Request:
   ```json
   {
     "amount": 100, // INR
     "userId": "user123",
     "toolId": "tool456"
   }
   ```
   
   Response:
   ```json
   {
     "success": true,
     "checkoutUrl": "https://phonepe.com/checkout-page-url",
     "merchantTransactionId": "ord_user123_tool456_1234567890"
   }
   ```

2. **Verify Payment**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyPhonePePayment?merchantOrderId=ord_user123_tool456_1234567890`
   
   Response:
   ```json
   {
     "success": true,
     "state": "COMPLETED",
     "code": "PAYMENT_SUCCESS",
     "message": "Payment completed successfully"
   }
   ```

3. **PhonePe Callback Webhook**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/phonePeCallback`
   
   This endpoint is called by PhonePe to notify about payment status updates.

4. **Create SDK Order**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/createPhonePeSdkOrder`
   
   Request:
   ```json
   {
     "amount": 100, // INR
     "userId": "user123",
     "toolId": "tool456"
   }
   ```
   
   Response:
   ```json
   {
     "success": true,
     "token": "sdk_token_from_phonepe",
     "merchantOrderId": "ord_user123_tool456_1234567890"
   }
   ```

## Frontend Integration

### Standard Checkout

```typescript
import { initializePhonePePayment } from '../utils/payment';

// In your component or function
const handlePayment = async () => {
  const response = await initializePhonePePayment(100, 'user123', 'tool456');
  
  if (response.success && response.checkoutUrl) {
    // Redirect to PhonePe checkout page
    window.location.href = response.checkoutUrl;
  } else {
    // Handle error
    console.error('Payment initialization failed:', response.error);
  }
};
```

### SDK Checkout (for Web)

```typescript
import { initializePhonePeSdkPayment } from '../utils/payment';

// In your component or function
const handleSdkPayment = async () => {
  const response = await initializePhonePeSdkPayment(100, 'user123', 'tool456');
  
  if (response.success && response.token) {
    // Use the token with PhonePe SDK
    // Example (depends on PhonePe's frontend SDK)
    PhonePe.startPayment({
      token: response.token,
      onSuccess: (response) => {
        // Handle success
      },
      onError: (error) => {
        // Handle error
      }
    });
  } else {
    // Handle error
    console.error('SDK payment initialization failed:', response.error);
  }
};
```

## Payment Verification

After receiving a callback or redirect from PhonePe, verify the payment status:

```typescript
import { verifyPaymentStatus, processSuccessfulPayment } from '../utils/payment';

// In your component or function
const verifyPayment = async (merchantTransactionId: string) => {
  const result = await verifyPaymentStatus(merchantTransactionId);
  
  if (result.success && result.state === 'COMPLETED') {
    // Process the successful payment
    await processSuccessfulPayment(merchantTransactionId, 'user123', ['tool456']);
    
    // Update UI, show success message, etc.
  } else {
    // Handle failed payment
    console.error('Payment verification failed:', result.error);
  }
};
```

## Deployment

Deploy the functions to Firebase:

```bash
firebase deploy --only functions
```

## Testing

For testing, use the sandbox environment by setting:

```typescript
const env = process.env.NODE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX;
```

## PhonePe Documentation

For more details, refer to the official PhonePe documentation:

- [PhonePe PG APIs](https://developer.phonepe.com/v1/docs/pg-server-apis)
- [PhonePe SDK Documentation](https://developer.phonepe.com/v1/docs/pg-sdk-integration) 
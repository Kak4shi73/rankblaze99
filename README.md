# Rank Blaze Payment Integration

## Cashfree Integration Guide

This project has been set up with Cashfree payment gateway integration to securely handle payment processing. The setup includes:

1. Cashfree hosted checkout integration
2. Backend Firebase Functions 
3. Firestore integration for order storage
4. Payment verification and confirmation

## Setup Instructions

### Prerequisites

- Make sure you have Firebase CLI installed
  ```
  npm install -g firebase-tools
  ```

- Login to Firebase
  ```
  firebase login
  ```

### Deploy the Project

1. Set Cashfree API credentials
   ```
   firebase functions:config:set cashfree.app_id="9721923531a775ba3e2dcb8259291279" cashfree.secret_key="cfsk_ma_prod_7b3a016d277614ba6a498a17ccf451c2_f7f4ac4e"
   ```

2. Deploy Firebase Functions
   ```
   firebase deploy --only functions
   ```

3. Deploy the frontend
   ```
   npm run build
   firebase deploy --only hosting
   ```

## Testing the Payment Flow

1. Add items to your cart
2. Proceed to checkout
3. Complete the payment using Cashfree test cards:
   - Test Card Number: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3-digit number

## Troubleshooting

If you encounter the "Failed to fetch" error:

1. Check your internet connection
2. Make sure Firebase Functions are deployed correctly
3. Verify Cashfree API credentials
4. Check Firebase console for function logs

## Order Management

All orders are saved in Firestore under the "orders" collection. You can view them in the Firebase console.

## Additional Information

- The payment flow includes automatic retries for payment verification
- Orders are stored in both Firestore and Realtime Database for compatibility
- Error handling has been improved to provide clear feedback to users

## Support

If you need assistance, please contact the development team.

## Project Structure

The project consists of several key components:

### Backend (Firebase Functions)

1. **functions/createCashfreeOrder.js**: Core server-side functionality for Cashfree
   - Creates payment orders securely
   - Verifies payment status
   - Handles webhooks for payment updates

2. **functions/index.js**: Exports Firebase Functions for Cashfree integration

### Frontend

1. **src/utils/cashfree.ts**: Core utility functions for Cashfree integration including:
   - Secure order creation via Firebase Functions
   - Payment verification 
   - Error handling with fallback to HTTP endpoints

2. **src/pages/PaymentPage.tsx**: UI for payment flow
   - Creates Cashfree orders
   - Initializes Cashfree checkout
   - Handles successful payments

3. **index.html**: Contains the required Cashfree checkout script

## Payment Flow

1. User selects product and proceeds to checkout
2. User clicks "Pay Now" 
3. Cashfree order is created
4. User completes payment in Cashfree modal
5. On success, payment is verified
6. Subscription is created in database

## Configuration

The Cashfree integration uses the following credentials:

- App ID: Stored securely in Firebase config
- Secret Key: Stored securely in Firebase config (never exposed to frontend)

## Troubleshooting

If you encounter issues with the Cashfree integration:

1. Check browser console for any JavaScript errors
2. Verify Firebase Functions logs for backend errors
3. Make sure Cashfree script is loaded
4. Verify that the correct credentials are set in Firebase config 
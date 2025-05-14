# Cashfree Integration

This project implements a Cashfree payment gateway integration for processing payments securely.

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
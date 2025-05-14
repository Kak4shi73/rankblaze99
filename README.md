# Razorpay Integration

This project implements a Razorpay payment gateway integration for processing payments securely.

## Integration Details

- **API Key ID**: `rzp_test_OChtDbosOz00ju`
- **API Key Secret**: `0A8EfMcUW90DE57mNtffGeqy`

## Implementation Files

1. **src/utils/razorpay.ts**: Core utility functions for Razorpay integration including:
   - Creating orders
   - Verifying payment signatures
   - Fetching payment details

2. **src/pages/PaymentPage.tsx**: The payment page component that:
   - Creates Razorpay orders
   - Handles payment processing
   - Updates database with payment information
   - Records subscription information

3. **index.html**: Contains the required Razorpay checkout script

## Usage Flow

1. User adds items to cart
2. User proceeds to checkout
3. Razorpay order is created
4. User completes payment in Razorpay modal
5. Payment verification occurs
6. Database records are updated
7. User is redirected to dashboard

## Testing

Use the following test card details for testing:
- Card Number: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: 1234

## Troubleshooting

If you encounter issues with the Razorpay integration:
1. Check browser console for errors
2. Verify API keys are correct
3. Make sure Razorpay script is loaded
4. Confirm order creation before opening payment modal 
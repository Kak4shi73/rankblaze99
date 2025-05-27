// Test script to verify PhonePe payment verification
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
try {
  admin.initializeApp();
} catch (error) {
  console.log('Firebase Admin SDK already initialized');
}

// The merchantTransactionId to test with
const txnId = process.argv[2] || 'ord_test_12345_timestamp';

// Firestore reference
const db = admin.firestore();

async function testPaymentVerification() {
  console.log(`Testing payment verification for transaction ID: ${txnId}`);
  
  try {
    // First, ensure there's a test transaction in Firestore
    const txnRef = db.collection('transactions').doc(txnId);
    const txnDoc = await txnRef.get();
    
    if (!txnDoc.exists) {
      console.log('Creating test transaction document...');
      await txnRef.set({
        userId: 'test_user_123',
        toolId: 'test_tool_456',
        amount: 100,
        status: 'initiated',
        merchantTransactionId: txnId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Test transaction document created');
    } else {
      console.log('Test transaction document already exists:', txnDoc.data());
    }
    
    // Now call the payment verification endpoint
    console.log('Calling payment verification endpoint...');
    
    // Using fetch to simulate a request to the function
    // In a real scenario, you would deploy and test against the deployed endpoint
    const functionUrl = 'http://localhost:5001/rankblaze-138f7/us-central1/api/verifyPhonePePayment';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txnId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error verifying payment: ${response.status} - ${errorText}`);
      return;
    }
    
    const result = await response.json();
    console.log('Payment verification result:', JSON.stringify(result, null, 2));
    
    // Now check if the transaction was updated properly
    const updatedDoc = await txnRef.get();
    console.log('Updated transaction document:', updatedDoc.data());
    
    // Check if tool access was granted
    const userId = updatedDoc.data().userId;
    const toolId = updatedDoc.data().toolId;
    
    const userToolRef = db.collection('users').doc(userId).collection('tools').doc(toolId);
    const userToolDoc = await userToolRef.get();
    
    if (userToolDoc.exists) {
      console.log('Tool access granted successfully:', userToolDoc.data());
    } else {
      console.log('Tool access was NOT granted');
    }
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testPaymentVerification()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Test failed:', error)); 
// Script to check and repair transactions stuck in "initiated" status since May 23rd
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
  admin.initializeApp();
} catch (error) {
  console.log('Firebase Admin SDK already initialized');
}

const db = admin.firestore();

async function findAndRepairStuckTransactions() {
  console.log('Checking for stuck transactions...');
  
  // Date string for May 23rd, 2023 (ISO format)
  const startDate = new Date('2023-05-23T00:00:00Z');
  
  try {
    // Query transactions that are still in "initiated" status since May 23rd
    const snapshot = await db
      .collection('transactions')
      .where('status', '==', 'initiated')
      .where('createdAt', '>=', startDate)
      .get();
    
    console.log(`Found ${snapshot.size} potentially stuck transactions`);
    
    if (snapshot.empty) {
      console.log('No stuck transactions found.');
      return;
    }
    
    // Process each transaction
    const promises = [];
    snapshot.forEach(doc => {
      const transaction = doc.data();
      console.log(`Checking transaction: ${doc.id}`, transaction);
      
      // Add to array for batch processing
      promises.push(checkAndVerifyTransaction(doc.id, transaction));
    });
    
    // Wait for all verifications to complete
    const results = await Promise.all(promises);
    
    // Summarize results
    console.log('\n=== Results Summary ===');
    console.log(`Total transactions checked: ${results.length}`);
    console.log(`Successfully verified: ${results.filter(r => r.verified).length}`);
    console.log(`Failed verification: ${results.filter(r => !r.verified).length}`);
  } catch (error) {
    console.error('Error finding stuck transactions:', error);
  }
}

async function checkAndVerifyTransaction(transactionId, transactionData) {
  console.log(`\nVerifying transaction ${transactionId}...`);
  
  try {
    // Call PhonePe to check actual payment status
    // This would be replaced with actual PhonePe SDK integration
    console.log('Transaction data:', transactionData);
    
    // Check if user has the tool despite transaction showing "initiated"
    const { userId, toolId } = transactionData;
    
    if (!userId || !toolId) {
      console.log('Missing userId or toolId, skipping...');
      return { 
        transactionId, 
        verified: false, 
        reason: 'Missing userId or toolId' 
      };
    }
    
    // Check if user already has the tool (might have been granted manually)
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found, skipping...`);
      return { 
        transactionId, 
        verified: false, 
        reason: 'User not found' 
      };
    }
    
    const userData = userDoc.data();
    const hasToolInArray = userData.tools && Array.isArray(userData.tools) && userData.tools.includes(toolId);
    
    // Check if tool exists in user's tools subcollection
    const userToolDoc = await db.collection('users').doc(userId).collection('tools').doc(toolId).get();
    const hasToolInCollection = userToolDoc.exists;
    
    if (hasToolInArray || hasToolInCollection) {
      console.log(`User already has access to tool ${toolId}`);
      console.log('Updating transaction status to completed...');
      
      // Update transaction to completed since user has the tool
      await db.collection('transactions').doc(transactionId).update({
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        repaired: true,
        repairNote: 'Marked as completed as user already has tool access'
      });
      
      console.log('Transaction updated to completed');
      
      return { 
        transactionId, 
        verified: true,
        action: 'marked_completed'
      };
    }
    
    // For transactions that need verification with PhonePe
    // In production, you would call PhonePe API here
    console.log('Would verify with PhonePe API and grant access if successful');
    
    // Simulate action needed
    return { 
      transactionId, 
      verified: false, 
      reason: 'Needs manual verification with PhonePe', 
      userId,
      toolId
    };
  } catch (error) {
    console.error(`Error processing transaction ${transactionId}:`, error);
    return { 
      transactionId, 
      verified: false, 
      error: error.message 
    };
  }
}

// Run the repair operation
findAndRepairStuckTransactions()
  .then(() => console.log('\nCheck and repair completed'))
  .catch(error => console.error('Script failed:', error)); 
// Run this script in the browser console on your Firebase project admin panel
// Make sure you're on the Firebase console page for your project

console.log('🚀 RankBlaze Migration Script Started');

// Migration script for moving user subscriptions from Realtime Database to Firestore
async function migrateUserSubscriptions() {
  try {
    console.log('📋 Starting migration process...');
    
    // This should be run from the admin panel where you have access to migration functions
    // First, let's check if we can access the migration functions
    
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase not available. Make sure you are on Firebase console.');
      return;
    }
    
    console.log('✅ Firebase available, starting migration...');
    
    // For manual execution, you can run this in your app's console:
    console.log(`
🔧 MANUAL MIGRATION INSTRUCTIONS:

1. Open your RankBlaze app in another tab
2. Login as admin
3. Open browser console (F12)
4. Run this code:

// Import migration functions
import { migrateAllUserSubscriptions, checkMigrationStatus } from './src/utils/migrationHelper.js';

// Check a specific user's migration status
const userId = 'USER_ID_HERE'; // Replace with actual user ID
checkMigrationStatus(userId).then(status => {
  console.log('Migration Status:', status);
});

// Migrate all users (run with caution)
migrateAllUserSubscriptions().then(result => {
  console.log('Migration Result:', result);
});

// OR migrate a specific user
import { migrateUserSubscriptions } from './src/utils/migrationHelper.js';
migrateUserSubscriptions('USER_ID_HERE').then(result => {
  console.log('User Migration Result:', result);
});

5. OR use the admin panel migration interface if available
    `);
    
    // Alternatively, if you have Firebase Admin SDK access, you can use this approach:
    console.log(`
🛠️ FIREBASE FUNCTIONS APPROACH:

If you have deployed the Firebase functions, you can call them directly:

// Call migration cloud function
fetch('https://us-central1-rankblaze-138f7.cloudfunctions.net/migrateUserData', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'migrateAll' // or 'migrateUser' with userId parameter
  })
})
.then(response => response.json())
.then(result => {
  console.log('Migration Result:', result);
});
    `);
    
    console.log('📖 Migration script information provided above.');
    
  } catch (error) {
    console.error('❌ Migration script error:', error);
  }
}

// Simple validation script to check current data state
async function validateCurrentData() {
  console.log('🔍 Validating current data state...');
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase not available');
    return;
  }
  
  try {
    // This is a basic check - you'll need to adapt based on your Firebase setup
    console.log('✅ Firebase is available');
    console.log('📋 To properly validate data, use the migration helper functions in your app');
    
    console.log(`
📊 VALIDATION STEPS:

1. Check Realtime Database users count
2. Check Firestore subscriptions count  
3. Compare data between both databases
4. Identify users needing migration

Use these functions in your app console:
- checkMigrationStatus(userId) - Check specific user
- migrateUserSubscriptions(userId) - Migrate specific user
- migrateAllUserSubscriptions() - Migrate all users
    `);
    
  } catch (error) {
    console.error('❌ Validation error:', error);
  }
}

// Quick fix script for immediate access issues
function quickFixInstructions() {
  console.log(`
🚨 QUICK FIX FOR ACCESS ISSUES:

If users are getting "₹199 required" error after admin grants them tools:

1. IMMEDIATE FIX - Update ToolAccess.tsx:
   - The file has been updated to check both Firestore and Realtime DB
   - It will automatically migrate data when found
   - Refresh the user's tool access page

2. ADMIN PANEL FIX:
   - The admin panel now creates both Realtime DB and Firestore entries
   - When granting tools, it creates subscriptions in both databases

3. PAYMENT WEBHOOK FIX:
   - PhonePe webhook now creates Firestore subscriptions automatically
   - New payments will work correctly

4. MIGRATION FIX:
   - Use migration helper functions to move existing data
   - Run migration for affected users only

TESTING:
1. Grant a tool to a test user via admin panel
2. Check if both Realtime DB and Firestore have the subscription
3. Test user access to the tool
4. If still issues, run migration for that specific user
  `);
}

// Run the appropriate function based on what you need
console.log(`
🎯 AVAILABLE FUNCTIONS:

1. migrateUserSubscriptions() - Show migration instructions
2. validateCurrentData() - Check current data state  
3. quickFixInstructions() - Quick fix instructions

Example: Run 'quickFixInstructions()' for immediate help
`);

// Auto-run quick fix instructions
quickFixInstructions(); 
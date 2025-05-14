/**
 * This is a one-time script to clean up the token data from Firebase.
 * Run this script to remove the toolTokens collection from the database.
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, remove } = require('firebase/database');

// Your web app's Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function cleanupTokenData() {
  try {
    console.log('Starting to clean up token data...');
    
    // Remove the entire toolTokens collection
    const toolTokensRef = ref(db, 'toolTokens');
    await remove(toolTokensRef);
    
    console.log('✅ Successfully removed all token data from the database');
  } catch (error) {
    console.error('❌ Error removing token data:', error);
  }
}

// Run the cleanup function
cleanupTokenData(); 
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBx-OgBVYWuf6v4Hm-3ifmCkoVxmD8YNXE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rankblaze-138f7.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://rankblaze-138f7-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rankblaze-138f7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rankblaze-138f7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "680403545243",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:680403545243:web:30cf242c831c444c272a3e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9WDFHPN17P"
};

// Initialize Firebase app first
const app = initializeApp(firebaseConfig);

// Initialize services after app initialization
const auth = getAuth(app);
const firestore = getFirestore(app);
// Only initialize analytics in browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getDatabase(app);

// Initialize collections
const collections = {
  users: 'users',
  adminUsers: 'admin_users',
  userSubscriptions: 'user_subscriptions',
  adminSubscriptions: 'admin_subscriptions',
  userPayments: 'user_payments',
  adminPayments: 'admin_payments'
};

// Initialize admin user with improved error handling
const initializeAdmin = async () => {
  try {
    // Skip admin initialization in development environment
    if (import.meta.env.DEV) {
      console.log('Skipping admin initialization in development environment');
      return;
    }

    const adminEmail = 'aryansingh2611@outlook.com';
    
    // Check if admin document exists first
    const adminSnapshot = await getDoc(doc(firestore, collections.adminUsers, 'admin'));
    
    if (!adminSnapshot.exists()) {
      await setDoc(doc(firestore, collections.adminUsers, 'admin'), {
        email: adminEmail,
        name: 'Admin',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        role: 'super_admin',
        permissions: ['all']
      });
      console.log('Admin user data created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error with admin initialization:', error);
  }
};

// Initialize admin only after auth state is ready and only in browser environment
if (typeof window !== 'undefined') {
  auth.onAuthStateChanged((user) => {
    if (user) {
      initializeAdmin();
    }
  });
}

export { collections, auth, firestore, analytics, db };
export default app;
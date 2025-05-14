import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { siteConfig } from './site';
import { getFunctions } from 'firebase/functions';

// Firebase configuration with hardcoded values to ensure deployment works
const firebaseConfig = {
  apiKey: "AIzaSyBx-OgBVYWuf6v4Hm-3ifmCkoVxmD8YNXE",
  authDomain: "rankblaze-138f7.firebaseapp.com",
  databaseURL: "https://rankblaze-138f7-default-rtdb.firebaseio.com",
  projectId: "rankblaze-138f7",
  storageBucket: "rankblaze-138f7.firebasestorage.app",
  messagingSenderId: "680403545243",
  appId: "1:680403545243:web:30cf242c831c444c272a3e",
  measurementId: "G-9WDFHPN17P"
};

// Initialize Firebase app first
const app = initializeApp(firebaseConfig);

// Initialize services after app initialization
const auth = getAuth(app);
const firestore = getFirestore(app);
const db = getDatabase(app);
const functions = getFunctions(app);
// Only initialize analytics in browser environment
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize collections
const collections = {
  users: 'users',
  adminUsers: 'admin_users',
  userSubscriptions: 'user_subscriptions',
  adminSubscriptions: 'admin_subscriptions',
  userPayments: 'user_payments',
  adminPayments: 'admin_payments',
  siteSettings: 'site_settings'
};

// Initialize admin user with improved error handling
const initializeAdmin = async () => {
  try {
    // Skip admin initialization in development environment
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log('Skipping admin initialization in development environment');
      return;
    }

    const adminEmail = siteConfig.contact.email;
    
    // Check if admin document exists first
    const adminSnapshot = await getDoc(doc(firestore, collections.adminUsers, 'admin'));
    
    if (!adminSnapshot.exists()) {
      await setDoc(doc(firestore, collections.adminUsers, 'admin'), {
        email: adminEmail,
        name: 'Admin',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        role: 'super_admin',
        permissions: ['all'],
        domain: siteConfig.url
      });
      console.log('Admin user data created');
    } else {
      console.log('Admin user already exists');
    }

    // Initialize site settings if they don't exist
    const siteSettingsSnapshot = await getDoc(doc(firestore, collections.siteSettings, 'general'));
    
    if (!siteSettingsSnapshot.exists()) {
      await setDoc(doc(firestore, collections.siteSettings, 'general'), {
        siteName: siteConfig.name,
        siteDescription: siteConfig.description,
        siteUrl: siteConfig.url,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      });
      console.log('Site settings created');
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

export { collections, auth, firestore, analytics, db, functions };
export default app;
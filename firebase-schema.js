/**
 * Firebase Schema and Security Rules for Secure Tool Access System
 * 
 * This file outlines the schema structure and security rules for the Firebase backend
 * that powers both the User and Admin extensions for Secure Tool Access.
 */

// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please create a .env file with the required variables');
  process.exit(1);
}

// Firebase Configuration from environment variables
export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check for required values before Firestore access
export function checkFirestoreAccess() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Missing required Firebase configuration for Firestore access');
    return false;
  }
  return true;
}

/**
 * Firestore Data Validation Functions
 * These functions validate data before storing in Firestore
 */

// Validate user data before storing in Firestore
export function validateUser(userData) {
  const errors = [];
  
  if (!userData.email || typeof userData.email !== 'string' || !userData.email.includes('@')) {
    errors.push('Invalid email address');
  }
  
  if (!userData.displayName || typeof userData.displayName !== 'string') {
    errors.push('Invalid display name');
  }
  
  if (!userData.role || typeof userData.role !== 'string') {
    errors.push('Invalid role');
  }
  
  if (typeof userData.enabled !== 'boolean') {
    errors.push('Enabled status must be a boolean');
  }
  
  if (!userData.createdAt || !(userData.createdAt instanceof Date)) {
    errors.push('Invalid creation date');
  }
  
  if (userData.tools && !Array.isArray(userData.tools)) {
    errors.push('Tools must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate admin data before storing in Firestore
export function validateAdmin(adminData) {
  const errors = [];
  
  if (!adminData.email || typeof adminData.email !== 'string' || !adminData.email.includes('@')) {
    errors.push('Invalid email address');
  }
  
  if (!adminData.displayName || typeof adminData.displayName !== 'string') {
    errors.push('Invalid display name');
  }
  
  if (!adminData.role || typeof adminData.role !== 'string' || 
      !['super_admin', 'admin'].includes(adminData.role)) {
    errors.push('Invalid role - must be super_admin or admin');
  }
  
  if (!adminData.createdAt || !(adminData.createdAt instanceof Date)) {
    errors.push('Invalid creation date');
  }
  
  if (!adminData.permissions || typeof adminData.permissions !== 'object') {
    errors.push('Permissions must be an object');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate session data before storing in Firestore
export function validateSession(sessionData) {
  const errors = [];
  
  if (!sessionData.toolId || typeof sessionData.toolId !== 'string') {
    errors.push('Invalid tool ID');
  }
  
  if (!sessionData.userId || typeof sessionData.userId !== 'string') {
    errors.push('Invalid user ID');
  }
  
  if (!sessionData.extensionId || typeof sessionData.extensionId !== 'string') {
    errors.push('Invalid extension ID');
  }
  
  if (!sessionData.status || typeof sessionData.status !== 'string' || 
      !['pending_verification', 'verified', 'active', 'expired', 'revoked'].includes(sessionData.status)) {
    errors.push('Invalid status');
  }
  
  if (!sessionData.createdAt || !(sessionData.createdAt instanceof Date)) {
    errors.push('Invalid creation date');
  }
  
  if (!sessionData.expiresAt || !(sessionData.expiresAt instanceof Date)) {
    errors.push('Invalid expiration date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate tool data before storing in Firestore
export function validateTool(toolData) {
  const errors = [];
  
  if (!toolData.name || typeof toolData.name !== 'string') {
    errors.push('Invalid tool name');
  }
  
  if (!toolData.description || typeof toolData.description !== 'string') {
    errors.push('Invalid tool description');
  }
  
  if (!toolData.targetUrl || typeof toolData.targetUrl !== 'string') {
    errors.push('Invalid target URL');
  }
  
  if (!toolData.requiredPermissions || !Array.isArray(toolData.requiredPermissions)) {
    errors.push('Required permissions must be an array');
  }
  
  if (typeof toolData.enabled !== 'boolean') {
    errors.push('Enabled status must be a boolean');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Firestore Collections Structure
 * 
 * users/
 *   {userId}/
 *     email: string
 *     displayName: string
 *     role: string
 *     enabled: boolean
 *     createdAt: timestamp
 *     lastLogin: timestamp
 *     tools: array
 *       - toolId: string
 *         name: string
 *         permissions: array
 * 
 * admins/
 *   {userId}/
 *     email: string
 *     displayName: string
 *     role: string ["super_admin", "admin"]
 *     createdAt: timestamp
 *     lastActive: timestamp
 *     permissions: map
 * 
 * extensionInstances/
 *   {extensionId}/
 *     extensionId: string
 *     userId: string
 *     status: string ["active", "inactive", "disabled"]
 *     installedAt: timestamp
 *     lastActive: timestamp
 *     platform: string
 *     userAgent: string
 *     disabledAt: timestamp (optional)
 *     disabledBy: string (optional)
 *     enabledAt: timestamp (optional)
 *     enabledBy: string (optional)
 * 
 * sessions/
 *   {sessionId}/
 *     toolId: string
 *     userId: string
 *     extensionId: string
 *     encryptedCookies: string
 *     status: string ["pending_verification", "verified", "active", "expired", "revoked"]
 *     createdAt: timestamp
 *     lastActive: timestamp
 *     expiresAt: timestamp
 *     revokedAt: timestamp (optional)
 *     revokedBy: string (optional)
 *     rejectionReason: string (optional)
 * 
 * extensionCommands/
 *   {extensionId}/
 *     type: string ["forceLogout", "disable", "enable", "checkStatus"]
 *     createdAt: timestamp
 *     createdBy: string
 *     processed: boolean
 *     processedAt: timestamp (optional)
 *     result: string (optional)
 *     commandId: string
 * 
 * adminLogs/
 *   {logId}/
 *     action: string
 *     adminEmail: string
 *     timestamp: timestamp
 *     extensionId: string (optional)
 *     userId: string (optional)
 *     sessionId: string (optional)
 *     status: string
 *     details: map (optional)
 * 
 * tools/
 *   {toolId}/
 *     name: string
 *     description: string
 *     targetUrl: string
 *     requiredPermissions: array
 *     cookieRequirements: array
 *     createdAt: timestamp
 *     enabled: boolean
 * 
 * Tool cookies for admin management
 * This is used to store cookies for various tools that the admin manages
 */
const toolCookiesSchema = {
  toolId1: {
    value: "cookie-string-value-here",
    updatedAt: "2025-05-01T10:00:00.000Z"
  },
  toolId2: {
    value: "another-cookie-string-value",
    updatedAt: "2025-05-02T15:30:00.000Z"
  }
};

// Admin extension connection information
// Used to connect external admin tools/extensions
const adminExtensionSchema = {
  url: "https://admin-extension.example.com",
  connectedAt: "2025-05-01T12:00:00.000Z",
  status: "connected", // or "disconnected"
  lastActive: "2025-05-03T09:15:00.000Z"
};

// Admin password change request schema (for Firestore)
// These requests are monitored by a Cloud Function to securely change the admin password
const adminPasswordChangeRequestSchema = {
  userId: "admin",
  newPassword: "secure-hashed-password",
  requestedAt: "2025-05-02T14:20:00.000Z",
  status: "pending", // or "completed", "rejected"
  completedAt: "2025-05-02T14:25:00.000Z" // Optional, only set once processed
};

/**
 * Firebase Security Rules
 */

// Firestore rules
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == "super_admin";
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isOwnExtension(data) {
      return isAuthenticated() && data.userId == request.auth.uid;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAdmin();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isSuperAdmin();
    }
    
    // Admins collection
    match /admins/{userId} {
      allow read: if isAdmin();
      allow write: if isSuperAdmin();
    }
    
    // Extension instances
    match /extensionInstances/{extensionId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isOwnExtension(resource.data) || isAdmin();
      allow delete: if isSuperAdmin();
    }
    
    // Sessions
    match /sessions/{sessionId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isSuperAdmin();
    }
    
    // Extension commands
    match /extensionCommands/{extensionId} {
      allow read: if isAuthenticated() && (
        exists(/databases/$(database)/documents/extensionInstances/$(extensionId)) && 
        get(/databases/$(database)/documents/extensionInstances/$(extensionId)).data.userId == request.auth.uid
      ) || isAdmin();
      allow write: if isAdmin();
    }
    
    // Admin logs
    match /adminLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update, delete: if false; // Logs should be immutable
    }
    
    // Tools
    match /tools/{toolId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
`;

/**
 * Firebase Storage Rules
 */
const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Lock down storage by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
    
    // Admin logs backup
    match /admin-logs/{fileName} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // User data
    match /user-data/{userId}/{fileName} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if isAdmin();
    }
  }
}
`;

/**
 * Firebase Authentication 
 * 
 * Authentication Methods:
 * - Email/Password: For admin authentication
 * - Anonymous: For initial extension registration
 * 
 * User Claims:
 * - admin: boolean - Indicates admin status
 * - superAdmin: boolean - Indicates super admin status
 * - tools: array - List of allowed tools
 */

/**
 * Firebase Functions
 * 
 * Key functions to implement:
 * 
 * - verifySession: Validates session cookies before allowing login
 * - processForcedLogout: Handles remote logout requests
 * - manageExtensionStatus: Enables/disables extensions
 * - auditLogger: Logs all administrative actions
 * - cleanupSessions: Removes expired sessions
 * - monitorExtensions: Checks for inactive extensions
 * - syncUserPermissions: Updates permissions when changed
 */

/**
 * Example Firebase Indexes
 * 
 * sessions:
 *   - userId, status, lastActive DESC
 *   - extensionId, status, lastActive DESC
 * 
 * extensionInstances:
 *   - userId, status, lastActive DESC
 *   - status, lastActive DESC
 * 
 * adminLogs:
 *   - adminEmail, timestamp DESC
 *   - action, timestamp DESC
 */

/**
 * Firebase Environment Configuration
 * 
 * Development:
 * - Separate Firebase project for development
 * - Relaxed security rules for testing
 * - Emulator support for local testing
 * 
 * Production:
 * - Strict security rules
 * - Backups enabled
 * - Analytics for monitoring
 * - Authentication lockdown
 */ 
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshUserToken = exports.checkAdminStatus = exports.initializeAdmin = exports.setAdminClaims = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Function to set admin custom claims
exports.setAdminClaims = functions.https.onCall(async (data, context) => {
    // This function should only be called by authenticated users
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { email, makeAdmin } = data;
    // Only allow specific admin email to set claims
    const ADMIN_EMAIL = 'aryansingh2611@outlook.com';
    if (context.auth.token.email !== ADMIN_EMAIL && email !== ADMIN_EMAIL) {
        throw new functions.https.HttpsError('permission-denied', 'Only admin can set admin claims');
    }
    try {
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        // Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            admin: makeAdmin === true,
            role: makeAdmin ? 'admin' : 'user'
        });
        // Also update Firestore admin collection
        if (makeAdmin) {
            await admin.firestore().collection('admin').doc(userRecord.uid).set({
                email: email,
                uid: userRecord.uid,
                isAdmin: true,
                role: 'admin',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        else {
            // Remove from admin collection if removing admin rights
            await admin.firestore().collection('admin').doc(userRecord.uid).delete();
        }
        return {
            success: true,
            message: `Admin claims ${makeAdmin ? 'granted' : 'revoked'} for ${email}`,
            uid: userRecord.uid
        };
    }
    catch (error) {
        console.error('Error setting admin claims:', error);
        throw new functions.https.HttpsError('internal', `Failed to set admin claims: ${error.message}`);
    }
});
// Function to initialize admin user on first setup
exports.initializeAdmin = functions.https.onCall(async (data, context) => {
    const ADMIN_EMAIL = 'aryansingh2611@outlook.com';
    const ADMIN_PASSWORD = 'Max@8009';
    try {
        let userRecord;
        // Try to get existing user
        try {
            userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
            console.log('Admin user already exists:', userRecord.uid);
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create admin user
                userRecord = await admin.auth().createUser({
                    email: ADMIN_EMAIL,
                    password: ADMIN_PASSWORD,
                    displayName: 'Admin',
                    emailVerified: true
                });
                console.log('Created admin user:', userRecord.uid);
            }
            else {
                throw error;
            }
        }
        // Set admin custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            admin: true,
            role: 'admin'
        });
        // Create admin document in Firestore
        await admin.firestore().collection('admin').doc(userRecord.uid).set({
            email: ADMIN_EMAIL,
            uid: userRecord.uid,
            isAdmin: true,
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Also create in users collection
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            email: ADMIN_EMAIL,
            displayName: 'Admin',
            role: 'admin',
            isAdmin: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            message: 'Admin user initialized successfully',
            uid: userRecord.uid,
            email: ADMIN_EMAIL
        };
    }
    catch (error) {
        console.error('Error initializing admin:', error);
        throw new functions.https.HttpsError('internal', `Failed to initialize admin: ${error.message}`);
    }
});
// Function to check admin status
exports.checkAdminStatus = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        // Get user's custom claims
        const userRecord = await admin.auth().getUser(context.auth.uid);
        const customClaims = userRecord.customClaims || {};
        // Also check Firestore admin collection
        const adminDoc = await admin.firestore().collection('admin').doc(context.auth.uid).get();
        const isAdminInFirestore = adminDoc.exists && ((_a = adminDoc.data()) === null || _a === void 0 ? void 0 : _a.isAdmin) === true;
        return {
            uid: context.auth.uid,
            email: context.auth.token.email,
            isAdmin: customClaims.admin === true,
            role: customClaims.role || 'user',
            isAdminInFirestore,
            customClaims
        };
    }
    catch (error) {
        console.error('Error checking admin status:', error);
        throw new functions.https.HttpsError('internal', `Failed to check admin status: ${error.message}`);
    }
});
// Function to refresh user token (to get updated custom claims)
exports.refreshUserToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        // Create a custom token with updated claims
        const userRecord = await admin.auth().getUser(context.auth.uid);
        const customToken = await admin.auth().createCustomToken(context.auth.uid, userRecord.customClaims);
        return {
            success: true,
            customToken,
            message: 'Token refreshed with updated claims'
        };
    }
    catch (error) {
        console.error('Error refreshing token:', error);
        throw new functions.https.HttpsError('internal', `Failed to refresh token: ${error.message}`);
    }
});
//# sourceMappingURL=admin-setup.js.map
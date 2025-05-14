"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToolCookie = exports.processAdminPasswordChange = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Handle admin password change requests
exports.processAdminPasswordChange = functions.firestore
    .document('adminPasswordChangeRequests/{requestId}')
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.userId || !data.newPassword || data.status !== 'pending') {
        return null;
    }
    try {
        // Get admin user reference
        const adminRef = admin.database().ref(`users/admin`);
        const adminSnapshot = await adminRef.once('value');
        if (!adminSnapshot.exists()) {
            await snapshot.ref.update({
                status: 'rejected',
                error: 'Admin user not found',
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return null;
        }
        // Update admin password securely
        // In a real application, this would use Firebase Admin SDK to update the password
        // For demo purposes, we'll just update a hashed version in the database
        const passwordHash = hashPassword(data.newPassword);
        await adminRef.update({
            passwordHash: passwordHash,
            passwordUpdatedAt: new Date().toISOString()
        });
        // Mark request as completed
        await snapshot.ref.update({
            status: 'completed',
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        // Mark request as failed
        await snapshot.ref.update({
            status: 'failed',
            error: error.message,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: false, error: error.message };
    }
});
// Handle tool cookie validation
exports.validateToolCookie = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated and is admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        // Get admin status
        const adminRef = admin.database().ref(`users/${context.auth.uid}`);
        const adminSnapshot = await adminRef.once('value');
        if (!adminSnapshot.exists() || !adminSnapshot.val().isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
        }
        const { toolId, cookieValue } = data;
        if (!toolId) {
            throw new functions.https.HttpsError('invalid-argument', 'Tool ID is required');
        }
        // Validate cookie by making a test request to the tool's API
        // In a real implementation, you would make an actual API call to verify the cookie works
        const isValid = simulateCookieValidation(toolId, cookieValue);
        if (isValid) {
            // Store the validated cookie
            const cookieRef = admin.database().ref(`toolCookies/${toolId}`);
            await cookieRef.update({
                value: cookieValue,
                updatedAt: new Date().toISOString(),
                status: 'valid'
            });
        }
        return { valid: isValid };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// Helper function to simulate cookie validation
// In a real application, you would make an actual API call to verify the cookie
function simulateCookieValidation(toolId, cookieValue) {
    // Simple validation logic for demo purposes
    return Boolean(cookieValue && cookieValue.length > 10);
}
// Helper function to hash password
// In a real application, you would use a proper password hashing algorithm
function hashPassword(password) {
    // This is just a placeholder - in a real app, use a proper hashing algorithm
    return `hashed_${password}_${Date.now()}`;
}
//# sourceMappingURL=admin-functions.js.map
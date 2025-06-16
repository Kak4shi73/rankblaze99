import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();
const rtdb = admin.database();

// Tool name mapping
const getToolName = (toolId: string): string => {
  const toolMapping: { [key: string]: string } = {
    'chatgpt_plus': 'ChatGPT Plus',
    'envato_elements': 'Envato Elements', 
    'canva_pro': 'Canva Pro',
    'storyblocks': 'Storyblocks',
    'semrush': 'SEMrush',
    'stealth_writer': 'Stealth Writer',
    'hix_bypass': 'Hix Bypass'
  };
  
  return toolMapping[toolId] || toolId;
};

// Admin function to grant tool access to user (with Firestore integration)
export const adminGrantTool = functions.https.onCall(
  async (data: { 
    userId: string; 
    toolId: string; 
    amount?: number; 
    adminId: string 
  }, context) => {
    try {
      // Check if user is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { userId, toolId, amount = 199, adminId } = data;

      if (!userId || !toolId || !adminId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId, toolId, and adminId are required');
      }

      console.log(`Admin ${adminId} granting tool ${toolId} to user ${userId}`);

      // Check if user already has this tool
      const existingSubscription = await db
        .collection('subscriptions')
        .where('userId', '==', userId)
        .where('toolId', '==', toolId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!existingSubscription.empty) {
        throw new functions.https.HttpsError('already-exists', 'User already has active subscription for this tool');
      }

      // Create batch for atomic operations
      const batch = db.batch();
      
      // 1. Create subscription record
      const subscriptionRef = db.collection('subscriptions').doc();
      const subscription = {
        userId,
        toolId,
        toolName: getToolName(toolId),
        status: 'active',
        isActive: true,
        amount,
        paymentMethod: 'admin_activation',
        activatedBy: adminId,
        adminGranted: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        )
      };
      batch.set(subscriptionRef, subscription);
      
      // 2. Create payment record
      const paymentRef = db.collection('payments').doc();
      const payment = {
        userId,
        toolId,
        toolName: getToolName(toolId),
        amount,
        status: 'completed',
        paymentMethod: 'admin_activation',
        transactionId: `admin_${Date.now()}_${userId.slice(-6)}`,
        orderId: `admin_order_${Date.now()}_${userId.slice(-6)}`,
        grantedBy: adminId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      batch.set(paymentRef, payment);
      
      // 3. Update user's tools collection
      const userToolRef = db.collection('users').doc(userId).collection('tools').doc(toolId);
      const userTool = {
        toolId,
        toolName: getToolName(toolId),
        status: 'active',
        activatedBy: adminId,
        activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
        adminGranted: true
      };
      batch.set(userToolRef, userTool);
      
      // 4. Update user's main document with active subscriptions
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const activeSubscriptions = userData?.activeSubscriptions || [];
        
        if (!activeSubscriptions.includes(toolId)) {
          activeSubscriptions.push(toolId);
          
          batch.update(userRef, {
            activeSubscriptions,
            lastToolGranted: {
              toolId,
              toolName: getToolName(toolId),
              grantedBy: adminId,
              grantedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } else {
        // Create user document if doesn't exist
        batch.set(userRef, {
          activeSubscriptions: [toolId],
          lastToolGranted: {
            toolId,
            toolName: getToolName(toolId),
            grantedBy: adminId,
            grantedAt: admin.firestore.FieldValue.serverTimestamp()
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 5. Also add to Realtime Database for backward compatibility
      const rtdbToolRef = rtdb.ref(`toolTokens/tool_${toolId}_${Date.now()}`);
      const rtdbData = {
        userId,
        toolId,
        amount,
        status: 'completed',
        paymentMethod: 'admin_activation',
        createdAt: new Date().toISOString(),
        grantedBy: adminId
      };
      
      // Commit Firestore batch
      await batch.commit();
      
      // Set Realtime Database data
      await rtdbToolRef.set(rtdbData);
      
      console.log(`Successfully granted tool ${toolId} to user ${userId} by admin ${adminId}`);
      
      return {
        success: true,
        message: `Successfully granted ${getToolName(toolId)} to user`,
        subscriptionId: subscriptionRef.id,
        paymentId: paymentRef.id,
        toolId,
        userId
      };
      
    } catch (error) {
      console.error('Admin grant tool error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to grant tool: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

// Function to update tool tokens in both Firestore and Realtime Database
export const updateToolTokens = functions.https.onCall(
  async (data: { 
    toolId: string; 
    token?: string; 
    loginId?: string; 
    password?: string; 
    adminId: string 
  }, context) => {
    try {
      // Check if user is authenticated and is admin
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { toolId, token, loginId, password, adminId } = data;

      if (!toolId || !adminId) {
        throw new functions.https.HttpsError('invalid-argument', 'toolId and adminId are required');
      }

      console.log(`Admin ${adminId} updating tokens for tool ${toolId}`);

      // Prepare token data
      const tokenData: any = {
        toolId,
        updatedBy: adminId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastModified: new Date().toISOString()
      };

      // Add token or login credentials based on tool type
      if (toolId === 'stealth_writer' || toolId === 'tool_19') {
        // Stealth Writer uses ID and password
        if (loginId) tokenData.loginId = loginId;
        if (password) tokenData.password = password;
        tokenData.type = 'credentials';
      } else {
        // Other tools use tokens
        if (token) tokenData.token = token;
        tokenData.type = 'token';
      }

      // Update in Firestore
      const firestoreTokenRef = db.collection('toolTokens').doc(toolId);
      await firestoreTokenRef.set(tokenData, { merge: true });

      // Update in Realtime Database for backward compatibility
      const rtdbTokenRef = rtdb.ref(`toolTokens/${toolId}`);
      const rtdbData: any = {
        toolId,
        updatedBy: adminId,
        updatedAt: new Date().toISOString()
      };

      if (toolId === 'stealth_writer' || toolId === 'tool_19') {
        if (loginId) rtdbData.id = loginId;
        if (password) rtdbData.password = password;
      } else {
        if (token) rtdbData.token = token;
      }

      await rtdbTokenRef.update(rtdbData);

      console.log(`Successfully updated tokens for tool ${toolId}`);

      return {
        success: true,
        message: `Successfully updated tokens for ${getToolName(toolId)}`,
        toolId,
        type: tokenData.type
      };

    } catch (error) {
      console.error('Update tool tokens error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to update tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

// Function to get tool tokens from Firestore
export const getToolTokens = functions.https.onCall(
  async (data: { toolId?: string }, context) => {
    try {
      // Check if user is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { toolId } = data;

      if (toolId) {
        // Get specific tool token
        const tokenDoc = await db.collection('toolTokens').doc(toolId).get();
        
        if (tokenDoc.exists) {
          const tokenData = tokenDoc.data();
          return {
            success: true,
            toolId,
            data: tokenData
          };
        } else {
          // Try Realtime Database as fallback
          const rtdbSnapshot = await rtdb.ref(`toolTokens/${toolId}`).once('value');
          if (rtdbSnapshot.exists()) {
            return {
              success: true,
              toolId,
              data: rtdbSnapshot.val(),
              source: 'realtime'
            };
          } else {
            throw new functions.https.HttpsError('not-found', 'Tool token not found');
          }
        }
      } else {
        // Get all tool tokens
        const tokensSnapshot = await db.collection('toolTokens').get();
        const tokens: any = {};
        
        tokensSnapshot.docs.forEach(doc => {
          tokens[doc.id] = doc.data();
        });

        return {
          success: true,
          data: tokens
        };
      }

    } catch (error) {
      console.error('Get tool tokens error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to get tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

// Function to sync all tokens from Realtime Database to Firestore
export const syncTokensToFirestore = functions.https.onCall(
  async (data, context) => {
    try {
      // Check if user is authenticated and is admin
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      console.log('Starting token sync from Realtime Database to Firestore...');

      // Get all tokens from Realtime Database
      const rtdbSnapshot = await rtdb.ref('toolTokens').once('value');
      const rtdbTokens = rtdbSnapshot.val();

      if (!rtdbTokens) {
        return {
          success: true,
          message: 'No tokens found in Realtime Database',
          synced: 0
        };
      }

      let syncCount = 0;
      const batch = db.batch();

      // Process each token
      Object.entries(rtdbTokens).forEach(([tokenKey, tokenData]: [string, any]) => {
        if (tokenData && typeof tokenData === 'object' && tokenData.toolId) {
          const firestoreRef = db.collection('toolTokens').doc(tokenData.toolId);
          
          const firestoreData = {
            ...tokenData,
            syncedAt: admin.firestore.FieldValue.serverTimestamp(),
            syncedFrom: 'realtime_database',
            originalKey: tokenKey
          };

          batch.set(firestoreRef, firestoreData, { merge: true });
          syncCount++;
        }
      });

      if (syncCount > 0) {
        await batch.commit();
      }

      console.log(`Successfully synced ${syncCount} tokens to Firestore`);

      return {
        success: true,
        message: `Successfully synced ${syncCount} tokens to Firestore`,
        synced: syncCount
      };

    } catch (error) {
      console.error('Sync tokens error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to sync tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
); 
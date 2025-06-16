import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const rtdb = admin.database();

interface AdminToolRecord {
  amount: number;
  createdAt: string;
  paymentMethod: string;
  status: string;
  toolId: string;
  userId: string;
}

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

// Migration function to move admin-activated tools from Realtime DB to Firestore
export const migrateAdminActivatedTools = functions.https.onCall(
  async (data, context) => {
    try {
      // Check if user is authenticated
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      console.log('Starting migration of admin-activated tools...');
      
      // Get all tool records from Realtime Database
      const toolsSnapshot = await rtdb.ref('toolTokens').once('value');
      const toolsData = toolsSnapshot.val();
      
      if (!toolsData) {
        return { success: true, message: 'No tools found in Realtime Database', migrated: 0 };
      }

      let migratedCount = 0;
      const migrationResults: any[] = [];

      // Process each tool record
      for (const [toolKey, toolData] of Object.entries(toolsData)) {
        try {
          const tool = toolData as AdminToolRecord;
          
          // Only migrate admin-activated tools
          if (tool.paymentMethod === 'admin_activation' && tool.status === 'completed') {
            console.log(`Processing tool: ${toolKey} for user: ${tool.userId}`);
            
            // Check if already migrated
            const existingSubscription = await db
              .collection('subscriptions')
              .where('userId', '==', tool.userId)
              .where('toolId', '==', tool.toolId)
              .where('migrated', '==', true)
              .limit(1)
              .get();

            if (!existingSubscription.empty) {
              console.log(`Tool ${toolKey} already migrated, skipping...`);
              continue;
            }
            
            // Create Firestore records
            const batch = db.batch();
            
            // 1. Create subscription record
            const subscriptionRef = db.collection('subscriptions').doc();
            const subscription = {
              userId: tool.userId,
              toolId: tool.toolId,
              toolName: getToolName(tool.toolId),
              status: 'active',
              isActive: true,
              amount: tool.amount || 199,
              paymentMethod: 'admin_activation',
              activatedBy: 'admin',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              ),
              originalCreatedAt: tool.createdAt || new Date().toISOString(),
              migrated: true,
              originalRtdbKey: toolKey
            };
            batch.set(subscriptionRef, subscription);
            
            // 2. Create payment record
            const paymentRef = db.collection('payments').doc();
            const payment = {
              userId: tool.userId,
              toolId: tool.toolId,
              toolName: getToolName(tool.toolId),
              amount: tool.amount || 199,
              status: 'completed',
              paymentMethod: 'admin_activation',
              transactionId: `admin_${toolKey}`,
              orderId: `admin_order_${Date.now()}_${tool.userId.slice(-6)}`,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              originalCreatedAt: tool.createdAt || new Date().toISOString(),
              migrated: true,
              originalRtdbKey: toolKey
            };
            batch.set(paymentRef, payment);
            
            // 3. Update user's tools collection
            const userToolRef = db.collection('users').doc(tool.userId).collection('tools').doc(tool.toolId);
            const userTool = {
              toolId: tool.toolId,
              toolName: getToolName(tool.toolId),
              status: 'active',
              activatedBy: 'admin',
              activatedAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ),
              originalCreatedAt: tool.createdAt || new Date().toISOString(),
              migrated: true,
              originalRtdbKey: toolKey
            };
            batch.set(userToolRef, userTool);
            
            // 4. Update user's main document with active subscriptions
            const userRef = db.collection('users').doc(tool.userId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
              const userData = userDoc.data();
              const activeSubscriptions = userData?.activeSubscriptions || [];
              
              if (!activeSubscriptions.includes(tool.toolId)) {
                activeSubscriptions.push(tool.toolId);
                
                batch.update(userRef, {
                  activeSubscriptions,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            } else {
              // Create user document if doesn't exist
              batch.set(userRef, {
                activeSubscriptions: [tool.toolId],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
            
            // Commit the batch
            await batch.commit();
            
            migratedCount++;
            migrationResults.push({
              toolKey,
              userId: tool.userId,
              toolId: tool.toolId,
              status: 'migrated',
              subscriptionId: subscriptionRef.id,
              paymentId: paymentRef.id
            });
            
            console.log(`Successfully migrated tool ${toolKey} for user ${tool.userId}`);
            
          } else {
            console.log(`Skipping tool ${toolKey} - not admin activated or not completed`);
          }
        } catch (error) {
          console.error(`Error migrating tool ${toolKey}:`, error);
          migrationResults.push({
            toolKey,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      console.log(`Migration completed. Migrated ${migratedCount} tools.`);
      
      return {
        success: true,
        message: `Successfully migrated ${migratedCount} admin-activated tools to Firestore`,
        migrated: migratedCount,
        results: migrationResults
      };
      
    } catch (error) {
      console.error('Migration error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

// Function to check specific user's migrated tools
export const checkUserMigratedTools = functions.https.onCall(
  async (data: { userId: string }, context) => {
    try {
      if (!data.userId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required');
      }

      // Check Firestore subscriptions
      const subscriptionsSnapshot = await db
        .collection('subscriptions')
        .where('userId', '==', data.userId)
        .where('migrated', '==', true)
        .get();

      // Check user's tools
      const userToolsSnapshot = await db
        .collection('users')
        .doc(data.userId)
        .collection('tools')
        .where('migrated', '==', true)
        .get();

      const subscriptions = subscriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const userTools = userToolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        userId: data.userId,
        subscriptions,
        userTools,
        totalMigrated: subscriptions.length
      };

    } catch (error) {
      console.error('Check user migration error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

// Function to manually migrate specific user's tools
export const migrateSpecificUserTools = functions.https.onCall(
  async (data: { userId: string }, context) => {
    try {
      if (!data.userId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required');
      }

      console.log(`Starting migration for specific user: ${data.userId}`);
      
      // Get all tool records for this user from Realtime Database
      const toolsSnapshot = await rtdb.ref('toolTokens').once('value');
      const toolsData = toolsSnapshot.val();
      
      if (!toolsData) {
        return { success: true, message: 'No tools found in Realtime Database', migrated: 0 };
      }

      let migratedCount = 0;
      const migrationResults: any[] = [];

      // Filter tools for this specific user
      for (const [toolKey, toolData] of Object.entries(toolsData)) {
        try {
          const tool = toolData as AdminToolRecord;
          
          // Only migrate tools for this user that are admin-activated
          if (tool.userId === data.userId && 
              tool.paymentMethod === 'admin_activation' && 
              tool.status === 'completed') {
            
            console.log(`Processing tool: ${toolKey} for user: ${tool.userId}`);
            
            // Check if already migrated
            const existingSubscription = await db
              .collection('subscriptions')
              .where('userId', '==', tool.userId)
              .where('toolId', '==', tool.toolId)
              .where('migrated', '==', true)
              .limit(1)
              .get();

            if (!existingSubscription.empty) {
              console.log(`Tool ${toolKey} already migrated, skipping...`);
              continue;
            }
            
            // Create Firestore records
            const batch = db.batch();
            
            // 1. Create subscription record
            const subscriptionRef = db.collection('subscriptions').doc();
            const subscription = {
              userId: tool.userId,
              toolId: tool.toolId,
              toolName: getToolName(tool.toolId),
              status: 'active',
              isActive: true,
              amount: tool.amount || 199,
              paymentMethod: 'admin_activation',
              activatedBy: 'admin',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              ),
              originalCreatedAt: tool.createdAt || new Date().toISOString(),
              migrated: true,
              originalRtdbKey: toolKey
            };
            batch.set(subscriptionRef, subscription);
            
            // 2. Create payment record
            const paymentRef = db.collection('payments').doc();
            const payment = {
              userId: tool.userId,
              toolId: tool.toolId,
              toolName: getToolName(tool.toolId),
              amount: tool.amount || 199,
              status: 'completed',
              paymentMethod: 'admin_activation',
              transactionId: `admin_${toolKey}`,
              orderId: `admin_order_${Date.now()}_${tool.userId.slice(-6)}`,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              originalCreatedAt: tool.createdAt || new Date().toISOString(),
              migrated: true,
              originalRtdbKey: toolKey
            };
            batch.set(paymentRef, payment);
            
            // 3. Update user's tools collection
            const userToolRef = db.collection('users').doc(tool.userId).collection('tools').doc(tool.toolId);
            const userTool = {
              toolId: tool.toolId,
              toolName: getToolName(tool.toolId),
              status: 'active',
              activatedBy: 'admin',
              activatedAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAt: admin.firestore.Timestamp.fromDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ),
              originalCreatedAt: tool.createdAt || new Date().toISOString(),
              migrated: true,
              originalRtdbKey: toolKey
            };
            batch.set(userToolRef, userTool);
            
            // 4. Update user's main document with active subscriptions
            const userRef = db.collection('users').doc(tool.userId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
              const userData = userDoc.data();
              const activeSubscriptions = userData?.activeSubscriptions || [];
              
              if (!activeSubscriptions.includes(tool.toolId)) {
                activeSubscriptions.push(tool.toolId);
                
                batch.update(userRef, {
                  activeSubscriptions,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            } else {
              // Create user document if doesn't exist
              batch.set(userRef, {
                activeSubscriptions: [tool.toolId],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
            
            // Commit the batch
            await batch.commit();
            
            migratedCount++;
            migrationResults.push({
              toolKey,
              userId: tool.userId,
              toolId: tool.toolId,
              status: 'migrated',
              subscriptionId: subscriptionRef.id,
              paymentId: paymentRef.id
            });
            
            console.log(`Successfully migrated tool ${toolKey} for user ${tool.userId}`);
          }
        } catch (error) {
          console.error(`Error migrating tool ${toolKey}:`, error);
          migrationResults.push({
            toolKey,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      console.log(`Migration completed for user ${data.userId}. Migrated ${migratedCount} tools.`);
      
      return {
        success: true,
        message: `Successfully migrated ${migratedCount} admin-activated tools for user ${data.userId}`,
        userId: data.userId,
        migrated: migratedCount,
        results: migrationResults
      };
      
    } catch (error) {
      console.error('User migration error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
); 
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

const functions = getFunctions();

// Migrate all admin-activated tools from Realtime DB to Firestore
export const migrateAllAdminTools = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated');
    }

    console.log('Starting migration of all admin-activated tools...');
    
    const migrateFunction = httpsCallable(functions, 'migrateAdminActivatedTools');
    const result = await migrateFunction();
    
    console.log('Migration completed:', result.data);
    return result.data;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Migrate specific user's tools
export const migrateUserTools = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated');
    }

    console.log(`Starting migration for user: ${userId}`);
    
    const migrateFunction = httpsCallable(functions, 'migrateSpecificUserTools');
    const result = await migrateFunction({ userId });
    
    console.log(`Migration completed for user ${userId}:`, result.data);
    return result.data;
  } catch (error) {
    console.error(`Migration failed for user ${userId}:`, error);
    throw error;
  }
};

// Check user's migrated tools
export const checkUserMigration = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated');
    }

    console.log(`Checking migration status for user: ${userId}`);
    
    const checkFunction = httpsCallable(functions, 'checkUserMigratedTools');
    const result = await checkFunction({ userId });
    
    console.log(`Migration status for user ${userId}:`, result.data);
    return result.data;
  } catch (error) {
    console.error(`Check failed for user ${userId}:`, error);
    throw error;
  }
};

// Utility to get list of users from Realtime Database with admin-activated tools
export const getAdminActivatedUsers = async () => {
  try {
    const { getDatabase, ref, get } = await import('firebase/database');
    const rtdb = getDatabase();
    
    const toolsRef = ref(rtdb, 'toolTokens');
    const snapshot = await get(toolsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const tools = snapshot.val();
    const adminActivatedUsers = new Map();
    
    Object.entries(tools).forEach(([toolKey, toolData]) => {
      if (toolData.paymentMethod === 'admin_activation' && toolData.status === 'completed') {
        const userId = toolData.userId;
        if (!adminActivatedUsers.has(userId)) {
          adminActivatedUsers.set(userId, {
            userId,
            tools: [],
            totalAmount: 0
          });
        }
        
        const user = adminActivatedUsers.get(userId);
        user.tools.push({
          toolKey,
          toolId: toolData.toolId,
          amount: toolData.amount || 199,
          createdAt: toolData.createdAt
        });
        user.totalAmount += (toolData.amount || 199);
      }
    });
    
    return Array.from(adminActivatedUsers.values());
  } catch (error) {
    console.error('Error getting admin-activated users:', error);
    throw error;
  }
};

// Batch migration with progress tracking
export const batchMigrateUsers = async (userIds, onProgress) => {
  const results = [];
  const total = userIds.length;
  
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    
    try {
      const result = await migrateUserTools(userId);
      results.push({ userId, status: 'success', result });
      
      if (onProgress) {
        onProgress({ 
          completed: i + 1, 
          total, 
          current: userId, 
          status: 'success',
          percentage: Math.round(((i + 1) / total) * 100)
        });
      }
    } catch (error) {
      results.push({ userId, status: 'error', error: error.message });
      
      if (onProgress) {
        onProgress({ 
          completed: i + 1, 
          total, 
          current: userId, 
          status: 'error',
          error: error.message,
          percentage: Math.round(((i + 1) / total) * 100)
        });
      }
    }
    
    // Add small delay to avoid overwhelming the functions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}; 
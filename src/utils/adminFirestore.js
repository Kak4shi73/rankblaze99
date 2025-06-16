import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

const functions = getFunctions();

// Grant tool access to user via Firestore
export const adminGrantToolFirestore = async (userId, toolId, amount = 199) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Admin must be authenticated');
    }

    console.log(`Granting tool ${toolId} to user ${userId} via Firestore`);
    
    const grantFunction = httpsCallable(functions, 'adminGrantTool');
    const result = await grantFunction({
      userId,
      toolId,
      amount,
      adminId: user.uid
    });
    
    console.log('Tool granted successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error granting tool:', error);
    throw error;
  }
};

// Update tool tokens in Firestore
export const updateToolTokensFirestore = async (toolId, tokenData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Admin must be authenticated');
    }

    console.log(`Updating tokens for tool ${toolId}`);
    
    const updateFunction = httpsCallable(functions, 'updateToolTokens');
    const result = await updateFunction({
      toolId,
      adminId: user.uid,
      ...tokenData
    });
    
    console.log('Tokens updated successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error updating tokens:', error);
    throw error;
  }
};

// Get tool tokens from Firestore
export const getToolTokensFirestore = async (toolId = null) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Admin must be authenticated');
    }

    console.log(`Getting tokens for tool: ${toolId || 'all tools'}`);
    
    const getFunction = httpsCallable(functions, 'getToolTokens');
    const result = await getFunction({ toolId });
    
    console.log('Tokens retrieved successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

// Sync tokens from Realtime Database to Firestore
export const syncTokensToFirestore = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Admin must be authenticated');
    }

    console.log('Syncing tokens from Realtime Database to Firestore...');
    
    const syncFunction = httpsCallable(functions, 'syncTokensToFirestore');
    const result = await syncFunction();
    
    console.log('Tokens synced successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error syncing tokens:', error);
    throw error;
  }
};

// Helper function to get tool tokens for user access page
export const getTokensForTool = async (toolId) => {
  try {
    const tokenData = await getToolTokensFirestore(toolId);
    
    if (tokenData.success && tokenData.data) {
      const data = tokenData.data;
      
      // Handle different token types
      if (toolId === 'stealth_writer' || toolId === 'tool_19') {
        return {
          type: 'credentials',
          loginId: data.loginId || data.id,
          password: data.password,
          available: !!(data.loginId || data.id) && !!data.password
        };
      } else {
        return {
          type: 'token',
          token: data.token,
          available: !!data.token
        };
      }
    }
    
    return { available: false };
  } catch (error) {
    console.error('Error getting tokens for tool:', error);
    return { available: false };
  }
};

// Helper function to check if token exists for a tool
export const checkTokenAvailability = async (toolId) => {
  try {
    const tokenInfo = await getTokensForTool(toolId);
    return tokenInfo.available;
  } catch (error) {
    console.error('Error checking token availability:', error);
    return false;
  }
}; 
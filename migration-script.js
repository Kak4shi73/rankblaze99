// Migration Script for Admin-Activated Tools
// Run this in browser console after logging in as admin

async function migrateAdminTools() {
  console.log('🚀 Starting migration of admin-activated tools...');
  
  try {
    // Import Firebase functions
    const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js');
    
    // Get functions instance
    const functions = getFunctions();
    
    // Call migration function
    const migrateFunction = httpsCallable(functions, 'migrateAdminActivatedTools');
    const result = await migrateFunction();
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Results:`, result.data);
    console.log(`🎯 Migrated ${result.data.migrated} tools`);
    
    alert(`Migration completed! ${result.data.migrated} tools migrated successfully.`);
    
    return result.data;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    alert('Migration failed. Check console for details.');
    throw error;
  }
}

async function migrateSpecificUser(userId) {
  console.log(`🚀 Starting migration for user: ${userId}`);
  
  try {
    const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js');
    const functions = getFunctions();
    
    const migrateFunction = httpsCallable(functions, 'migrateSpecificUserTools');
    const result = await migrateFunction({ userId });
    
    console.log(`✅ Migration completed for user ${userId}!`);
    console.log(`📊 Results:`, result.data);
    
    alert(`User migration completed! ${result.data.migrated} tools migrated for user ${userId}.`);
    
    return result.data;
  } catch (error) {
    console.error(`❌ Migration failed for user ${userId}:`, error);
    alert(`Migration failed for user ${userId}. Check console for details.`);
    throw error;
  }
}

async function checkUserMigration(userId) {
  console.log(`🔍 Checking migration status for user: ${userId}`);
  
  try {
    const { getFunctions, httpsCallable } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js');
    const functions = getFunctions();
    
    const checkFunction = httpsCallable(functions, 'checkUserMigratedTools');
    const result = await checkFunction({ userId });
    
    console.log(`📊 Migration status for user ${userId}:`, result.data);
    console.log(`✅ Found ${result.data.totalMigrated} migrated tools`);
    
    return result.data;
  } catch (error) {
    console.error(`❌ Check failed for user ${userId}:`, error);
    throw error;
  }
}

// Example usage:
console.log(`
🔧 Migration Script Loaded!

Usage Examples:
1. Migrate all admin tools: migrateAdminTools()
2. Migrate specific user: migrateSpecificUser('USER_ID_HERE')
3. Check user migration: checkUserMigration('USER_ID_HERE')

Example:
migrateSpecificUser('f9D31qsUTjdMVgM6aGNdsY0Znpz2')
`);

// Auto-run if a specific user ID is found (from the image you showed)
const specificUserId = 'f9D31qsUTjdMVgM6aGNdsY0Znpz2';
console.log(`🎯 Found specific user ID: ${specificUserId}`);
console.log(`💡 To migrate this user, run: migrateSpecificUser('${specificUserId}')`);

// Export functions to global scope for easy access
window.migrateAdminTools = migrateAdminTools;
window.migrateSpecificUser = migrateSpecificUser;
window.checkUserMigration = checkUserMigration; 
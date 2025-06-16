import React, { useState, useEffect } from 'react';
import { 
  migrateAllAdminTools, 
  migrateUserTools, 
  checkUserMigration, 
  getAdminActivatedUsers, 
  batchMigrateUsers 
} from '../utils/adminMigration.js';
import { useToast } from '../context/ToastContext';

interface AdminActivatedUser {
  userId: string;
  tools: {
    toolKey: string;
    toolId: string;
    amount: number;
    createdAt: string;
  }[];
  totalAmount: number;
}

interface MigrationProgress {
  completed: number;
  total: number;
  current: string;
  status: 'success' | 'error';
  error?: string;
  percentage: number;
}

const AdminMigration: React.FC = () => {
  const [users, setUsers] = useState<AdminActivatedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [migrationResults, setMigrationResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    loadAdminActivatedUsers();
  }, []);

  const loadAdminActivatedUsers = async () => {
    try {
      setLoading(true);
      const adminUsers = await getAdminActivatedUsers();
      setUsers(adminUsers);
      showToast(`Found ${adminUsers.length} users with admin-activated tools`, 'success');
    } catch (error) {
      console.error('Error loading admin users:', error);
      showToast('Failed to load admin-activated users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateAll = async () => {
    try {
      setMigrating(true);
      const result = await migrateAllAdminTools();
      setMigrationResults([result]);
      showToast(`Successfully migrated ${result.migrated} tools`, 'success');
    } catch (error) {
      console.error('Migration failed:', error);
      showToast('Migration failed. Please try again.', 'error');
    } finally {
      setMigrating(false);
    }
  };

  const handleMigrateSelected = async () => {
    if (selectedUsers.length === 0) {
      showToast('Please select users to migrate', 'warning');
      return;
    }

    try {
      setMigrating(true);
      setProgress(null);
      
      const results = await batchMigrateUsers(selectedUsers, (progressData: MigrationProgress) => {
        setProgress(progressData);
      });
      
      setMigrationResults(results);
      const successCount = results.filter((r: any) => r.status === 'success').length;
      showToast(`Migration completed: ${successCount}/${results.length} users migrated successfully`, 'success');
    } catch (error) {
      console.error('Batch migration failed:', error);
      showToast('Batch migration failed. Please try again.', 'error');
    } finally {
      setMigrating(false);
      setProgress(null);
    }
  };

  const handleMigrateUser = async (userId: string) => {
    try {
      setMigrating(true);
      const result = await migrateUserTools(userId);
      showToast(`Successfully migrated ${result.migrated} tools for user`, 'success');
      
      // Refresh the user list
      await loadAdminActivatedUsers();
    } catch (error) {
      console.error('User migration failed:', error);
      showToast('User migration failed. Please try again.', 'error');
    } finally {
      setMigrating(false);
    }
  };

  const handleCheckUserMigration = async (userId: string) => {
    try {
      const result = await checkUserMigration(userId);
      showToast(`User has ${result.totalMigrated} migrated tools`, 'info');
      console.log('Migration status:', result);
    } catch (error) {
      console.error('Check migration failed:', error);
      showToast('Failed to check migration status', 'error');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const filteredUserIds = filteredUsers.map(user => user.userId);
    setSelectedUsers(filteredUserIds);
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const filteredUsers = users.filter(user => 
    user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tools.some(tool => tool.toolId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Tool Migration</h1>
            <p className="text-gray-300 mb-6">
              Migrate admin-activated tools from Realtime Database to Firestore. 
              This will ensure existing customers can continue using their tools.
            </p>

            {/* Migration Controls */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={handleMigrateAll}
                disabled={migrating || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {migrating ? 'Migrating...' : 'Migrate All Tools'}
              </button>

              <button
                onClick={handleMigrateSelected}
                disabled={migrating || loading || selectedUsers.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Migrate Selected ({selectedUsers.length})
              </button>

              <button
                onClick={loadAdminActivatedUsers}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Progress Bar */}
            {progress && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">Migration Progress</span>
                  <span className="text-white">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-gray-300 mt-2">
                  Processing: {progress.current} ({progress.completed}/{progress.total})
                  {progress.status === 'error' && progress.error && (
                    <span className="text-red-400 ml-2">Error: {progress.error}</span>
                  )}
                </p>
              </div>
            )}

            {/* Search and Selection */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by User ID or Tool ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none flex-1 min-w-0"
              />
              
              <button
                onClick={selectAllUsers}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Select All
              </button>
              
              <button
                onClick={deselectAllUsers}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Deselect All
              </button>
            </div>

            {/* Users List */}
            <div className="bg-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading admin-activated users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-300">No admin-activated users found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-600">
                    {filteredUsers.map((user) => (
                      <div key={user.userId} className="p-4 hover:bg-gray-600 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.userId)}
                              onChange={() => toggleUserSelection(user.userId)}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <div>
                              <p className="text-white font-medium">User ID: {user.userId}</p>
                              <p className="text-gray-300 text-sm">
                                {user.tools.length} tools • Total: ₹{user.totalAmount}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMigrateUser(user.userId)}
                              disabled={migrating}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Migrate
                            </button>
                            <button
                              onClick={() => handleCheckUserMigration(user.userId)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Check
                            </button>
                          </div>
                        </div>
                        
                        {/* Tools List */}
                        <div className="mt-3 ml-7">
                          <div className="flex flex-wrap gap-2">
                            {user.tools.map((tool) => (
                              <span 
                                key={tool.toolKey}
                                className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                              >
                                {tool.toolId} (₹{tool.amount})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Migration Results */}
          {migrationResults.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Migration Results</h2>
              <div className="space-y-4">
                {migrationResults.map((result, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {result.userId ? `User: ${result.userId}` : 'Bulk Migration'}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        result.status === 'success' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    {result.result && (
                      <p className="text-gray-300 text-sm">
                        {result.result.message} • Migrated: {result.result.migrated}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-red-400 text-sm">Error: {result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMigration; 
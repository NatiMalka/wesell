import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useTeamManagement } from '../../hooks/useTeamManagement';
import { useTeamSalesSync } from '../../hooks/useTeamSalesSync';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  User, 
  Shield, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Database,
  Target,
  Users,
  Activity,
  Settings
} from 'lucide-react';

export const UserDebug: React.FC = () => {
  const { user } = useAuth();
  const [agentIdToCleanup, setAgentIdToCleanup] = useState('');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string>('');
  const [isCleaningLeaderboard, setIsCleaningLeaderboard] = useState(false);
  const [leaderboardCleanupResult, setLeaderboardCleanupResult] = useState<string>('');

  const { cleanupDeletedAgent } = useTeamManagement(user?.id || '', user?.teamId || '');

  const handleManualCleanup = async () => {
    if (!agentIdToCleanup.trim()) {
      setCleanupResult('Please enter an agent ID');
      return;
    }

    setIsCleaningUp(true);
    setCleanupResult('');

    try {
      await cleanupDeletedAgent(agentIdToCleanup.trim());
      setCleanupResult(`✅ Successfully cleaned up agent: ${agentIdToCleanup}`);
      setAgentIdToCleanup('');
    } catch (error) {
      setCleanupResult(`❌ Error cleaning up agent: ${error}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleLeaderboardCleanup = async () => {
    if (!user?.teamId) {
      setLeaderboardCleanupResult('❌ No team ID found');
      return;
    }

    setIsCleaningLeaderboard(true);
    setLeaderboardCleanupResult('🔄 Starting leaderboard cleanup...');

    try {
      const agentSalesRef = collection(db, 'teams', user.teamId, 'agentSales');
      const agentSalesSnapshot = await getDocs(agentSalesRef);
      
      console.log(`📊 Found ${agentSalesSnapshot.docs.length} agentSales records`);
      
      const usersRef = collection(db, 'users');
      
      // Get both agents and managers
      const currentAgentsQuery = query(
        usersRef, 
        where('teamId', '==', user.teamId),
        where('role', '==', 'agent')
      );
      
      const currentManagersQuery = query(
        usersRef, 
        where('teamId', '==', user.teamId),
        where('role', '==', 'manager')
      );
      
      const [agentsSnapshot, managersSnapshot] = await Promise.all([
        getDocs(currentAgentsQuery),
        getDocs(currentManagersQuery)
      ]);
      
      const currentMemberIds = [
        ...agentsSnapshot.docs.map(doc => doc.id),
        ...managersSnapshot.docs.map(doc => doc.id)
      ];
      
      console.log(`👥 Found ${agentsSnapshot.docs.length} agents and ${managersSnapshot.docs.length} managers:`, currentMemberIds);
      
      const orphanedRecords: string[] = [];
      agentSalesSnapshot.docs.forEach(doc => {
        if (!currentMemberIds.includes(doc.id)) {
          orphanedRecords.push(doc.id);
        }
      });
      
      console.log(`🗑️ Found ${orphanedRecords.length} orphaned sales records:`, orphanedRecords);
      
      for (const agentId of orphanedRecords) {
        try {
          await deleteDoc(doc(db, 'teams', user.teamId, 'agentSales', agentId));
          console.log(`✅ Removed orphaned sales record for: ${agentId}`);
        } catch (error) {
          console.error(`❌ Error removing sales record for ${agentId}:`, error);
        }
      }
      
      setLeaderboardCleanupResult(
        `✅ Leaderboard cleanup completed!\n` +
        `• Found ${agentSalesSnapshot.docs.length} total sales records\n` +
        `• Found ${currentMemberIds.length} current active team members\n` +
        `• Removed ${orphanedRecords.length} orphaned records\n` +
        `• Leaderboard should now show only active team members`
      );
      
    } catch (error) {
      console.error('Error cleaning leaderboard:', error);
      setLeaderboardCleanupResult(`❌ Error cleaning leaderboard: ${error}`);
    } finally {
      setIsCleaningLeaderboard(false);
    }
  };

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"
      >
        <div className="text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-slate-300">Please log in to access debug tools</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-2xl">
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            כלי פיתוח מתקדמים
          </h1>
          <p className="text-slate-300 text-lg">Developer Tools & System Maintenance</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-xl">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mr-3">User Info</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { label: 'Name', value: user.name, icon: User },
                  { label: 'Email', value: user.email, icon: User },
                  { label: 'Role', value: user.role, icon: Shield },
                  { label: 'Team ID', value: user.teamId, icon: Users }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center">
                      <item.icon className="w-4 h-4 text-slate-400 ml-2" />
                      <span className="text-slate-300 font-medium">{item.label}:</span>
                    </div>
                    <span className="text-white font-semibold text-sm bg-white/10 px-2 py-1 rounded-lg">
                      {item.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Tools Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Leaderboard Cleanup */}
            {user.role === 'manager' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/30 shadow-2xl"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-2xl shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-2xl font-bold text-white">Leaderboard Cleanup</h3>
                    <p className="text-blue-200">Remove orphaned sales records</p>
                  </div>
                </div>
                
                <p className="text-blue-100 mb-6 leading-relaxed">
                  This advanced tool will scan your team's sales database and remove all orphaned records 
                  from team members (agents and managers) who no longer exist or are no longer part of your team.
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLeaderboardCleanup}
                  disabled={isCleaningLeaderboard}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
                >
                  {isCleaningLeaderboard ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Processing cleanup...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Execute Leaderboard Cleanup
                    </>
                  )}
                </motion.button>
                
                <AnimatePresence>
                  {leaderboardCleanupResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-4 p-4 rounded-2xl border-2 ${
                        leaderboardCleanupResult.startsWith('✅') 
                          ? 'bg-green-500/20 border-green-500/30 text-green-100' 
                          : 'bg-red-500/20 border-red-500/30 text-red-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {leaderboardCleanupResult.startsWith('✅') ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                        )}
                        <pre className="text-sm font-mono whitespace-pre-line flex-1">
                          {leaderboardCleanupResult}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Manual Agent Cleanup */}
            {user.role === 'manager' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-6 border border-red-500/30 shadow-2xl"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-2xl shadow-lg">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-2xl font-bold text-white">Manual Agent Cleanup</h3>
                    <p className="text-red-200">Target specific agent removal</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-red-100 font-medium mb-2">
                      Agent ID to Clean Up:
                    </label>
                    <input
                      type="text"
                      value={agentIdToCleanup}
                      onChange={(e) => setAgentIdToCleanup(e.target.value)}
                      placeholder="Enter agent ID (e.g., zBsRy5cDHpboA8Po2cCx30u3V393)"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm"
                      disabled={isCleaningUp}
                    />
                    <p className="text-red-300 text-sm mt-2">
                      💡 You can find agent IDs in the Firebase console under users collection
                    </p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManualCleanup}
                    disabled={isCleaningUp || !agentIdToCleanup.trim()}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    {isCleaningUp ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Cleaning up...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Execute Manual Cleanup
          </>
        )}
                  </motion.button>
                  
                  <AnimatePresence>
                    {cleanupResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-2xl border-2 ${
                          cleanupResult.startsWith('✅') 
                            ? 'bg-green-500/20 border-green-500/30 text-green-100' 
                            : 'bg-red-500/20 border-red-500/30 text-red-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {cleanupResult.startsWith('✅') ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="font-medium">{cleanupResult}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Firebase Auth Conflict Resolver */}
            {user.role === 'manager' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 shadow-2xl"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-3 rounded-2xl shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-2xl font-bold text-white">Firebase Auth Conflict Resolver</h3>
                    <p className="text-purple-200">Fix authentication conflicts</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                    <h4 className="text-purple-100 font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Common Issue: "auth/invalid-credential"
                    </h4>
                    <p className="text-purple-200 text-sm leading-relaxed">
                      This error often occurs when an agent was deleted but their Firebase Auth account wasn't cleaned up. 
                      When recreating the agent, there's a conflict between the old Firebase Auth user and the new pending user.
                    </p>
                  </div>
                  
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                    <h4 className="text-purple-100 font-semibold mb-2">💡 Solution:</h4>
                    <p className="text-purple-200 text-sm">
                      The enhanced login system now automatically handles these conflicts. When a user tries to login and gets 
                      "invalid-credential", the system will check for pending users and either create a new Firebase Auth account 
                      or provide a helpful error message for manual resolution.
                    </p>
                  </div>
                  
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                    <h4 className="text-green-100 font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Status: Enhanced Authentication Active
                    </h4>
                    <p className="text-green-200 text-sm">
                      The system has been updated to better handle Firebase Auth conflicts. Try logging in with נתנאל מלכה again 
                      using the credentials shown in Firebase (email: netamal3134@gmail.com, password: Aa123456).
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-6 border border-yellow-500/30 shadow-2xl"
            >
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-2xl shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="mr-4">
                  <h3 className="text-2xl font-bold text-white">Quick Actions</h3>
                  <p className="text-yellow-200">Common cleanup tasks</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAgentIdToCleanup('zBsRy5cDHpboA8Po2cCx30u3V393')}
                  className="w-full text-right px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-white transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">זBsRy5cDHpboA8Po2cCx30u3V393</span>
                  </div>
                  <span className="text-yellow-200 text-sm">נתנאל מלכה - if needed</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
      </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-slate-400"
        >
          <p className="text-sm">
            🛠️ Advanced Developer Tools • Use with caution • Always backup data before cleanup
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}; 
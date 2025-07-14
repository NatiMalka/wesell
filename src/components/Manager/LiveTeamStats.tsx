import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  Clock, 
  Activity,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import { User } from '../../types';
import { useRealTimeTeamPerformance } from '../../hooks/useRealTimeTeamPerformance';
import { formatCurrency } from '../../utils/calculations';

interface LiveTeamStatsProps {
  user: User;
}

export const LiveTeamStats: React.FC<LiveTeamStatsProps> = ({ user }) => {
  const { 
    livePerformance, 
    isConnected, 
    loading,
    getTopPerformers 
  } = useRealTimeTeamPerformance(user.id, user.teamId || '');

  const topPerformers = getTopPerformers(3);
  const onlineMembers = livePerformance.members.filter(member => member.isOnline);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-48">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-6 bg-blue-600 rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Performance Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">ביצועי הצוות</h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/20 ${
                  isConnected ? 'text-green-200' : 'text-red-200'
                }`}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span>LIVE</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>OFFLINE</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-blue-100">
                {isConnected 
                  ? 'עדכונים בזמן אמת מכל הסוכנים'
                  : 'ממתין לחיבור...'
                }
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-blue-200">סה"כ מכירות החודש</p>
            <motion.p 
              key={livePerformance.totalTeamSales}
              initial={{ scale: 1.1, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#ffffff' }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold"
            >
              {formatCurrency(livePerformance.totalTeamSales)}
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Members */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">חברי צוות פעילים</p>
              <motion.p 
                key={onlineMembers.length}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-green-800"
              >
                {onlineMembers.length} / {livePerformance.members.length}
              </motion.p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Total Clients */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">סה"כ לקוחות</p>
              <motion.p 
                key={livePerformance.totalTeamClients}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-blue-800"
              >
                {livePerformance.totalTeamClients}
              </motion.p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Performers Live */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            מובילי הצוות כרגע
          </h4>
          {isConnected && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Zap className="w-3 h-3" />
              <span>עדכון חי</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {topPerformers.map((member, index) => (
              <motion.div
                key={`${member.id}-${member.totalSales}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border border-gray-200' :
                  'bg-orange-50 border border-orange-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-500' :
                    'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {member.name}
                      {member.isOnline && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="פעיל כרגע" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {member.clientCount} לקוחות
                    </p>
                  </div>
                </div>
                <motion.div 
                  key={member.totalSales}
                  initial={{ scale: 1.1, color: '#059669' }}
                  animate={{ scale: 1, color: '#374151' }}
                  transition={{ duration: 0.5 }}
                  className="text-lg font-bold"
                >
                  {formatCurrency(member.totalSales)}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {topPerformers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>אין עדיין מכירות היום</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}; 
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  Calendar,
  Trophy,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { User } from '../../types';
import { useTeamManagement } from '../../hooks/useTeamManagement';
import { StatCard } from '../UI/StatCard';
import { ProgressBar } from '../UI/ProgressBar';
import { formatCurrency, getCurrentBonusTier } from '../../utils/calculations';

interface TeamManagerDashboardProps {
  user: User;
}

export const TeamManagerDashboard: React.FC<TeamManagerDashboardProps> = ({ user }) => {
  const {
    teamMembers,
    teamClients,
    notifications,
    loading,
    getTeamOverview,
    getTeamMemberStats,
  } = useTeamManagement(user.id, user.teamId || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const teamOverview = getTeamOverview();
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-purple-600 to-purple-700 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <Shield className="w-6 h-6 ml-2" />
              שלום {user.name}! 👋
            </h1>
            <p className="text-purple-100">
              דשבורד ניהול הצוות שלך - מעקב אחר הביצועים והתקדמות
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-purple-200">מכירות הצוות החודש</p>
            <p className="text-3xl font-bold">{formatCurrency(teamOverview.totalStats.totalSales)}</p>
          </div>
        </div>
      </motion.div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={'חברי צוות'}
          value={teamOverview.totalMembers}
          icon={Users}
          color="primary"
        />
        <StatCard
          title={'מכירות החודש'}
          value={formatCurrency(teamOverview.totalStats.totalSales)}
          icon={TrendingUp}
          color="success"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title={'סה"כ לקוחות'}
          value={teamOverview.totalClients}
          icon={Target}
          color="warning"
        />
        <StatCard
          title={'התראות'}
          value={unreadNotifications}
          icon={AlertCircle}
          color="danger"
        />
      </div>

      {/* Team Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">ביצועי הצוות</h2>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>

        <div className="space-y-4">
          {teamOverview.memberStats.map((member, index) => {
            const currentTier = getCurrentBonusTier(member.stats.totalSales);
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center ml-3">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(member.stats.totalSales)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.stats.clientCount} לקוחות
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">התקדמות לבונוס הבא</span>
                    {currentTier && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        🏆 {currentTier.name}
                      </span>
                    )}
                  </div>
                  <ProgressBar
                    progress={member.stats.progressPercentage}
                    label={`${formatCurrency(member.stats.totalSales)} / ${formatCurrency(member.stats.nextTierThreshold)}`}
                    color="primary"
                    size="sm"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 ml-2 text-purple-600" />
            התראות אחרונות
          </h3>
          
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-r-4 ${
                  notification.type === 'bonus_achieved' 
                    ? 'bg-success-50 border-success-400'
                    : notification.type === 'milestone'
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-yellow-50 border-yellow-400'
                } ${!notification.read ? 'shadow-sm' : 'opacity-75'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {notification.type === 'bonus_achieved' ? (
                      <Award className="w-4 h-4 text-success-600 ml-2" />
                    ) : notification.type === 'milestone' ? (
                      <CheckCircle className="w-4 h-4 text-blue-600 ml-2" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600 ml-2" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notification.agentName}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </div>
            ))}
            
            {notifications.length === 0 && (
              <p className="text-gray-500 text-center py-4">אין התראות חדשות</p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">פעולות מהירות</h3>
          
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Users className="w-5 h-5 ml-2" />
              הוסף סוכן חדש
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Target className="w-5 h-5 ml-2" />
              הגדר יעדים חדשים
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center p-3 bg-success-50 text-success-700 rounded-lg hover:bg-success-100 transition-colors"
            >
              <Calendar className="w-5 h-5 ml-2" />
              צפה בדוחות מפורטים
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 
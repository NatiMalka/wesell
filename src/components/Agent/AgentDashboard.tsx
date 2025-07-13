import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Award, Calendar, Phone } from 'lucide-react';
import { StatCard } from '../UI/StatCard';
import { ProgressBar } from '../UI/ProgressBar';
import { User, Client } from '../../types';
import { calculateMonthlyStats, formatCurrency, getCurrentBonusTier } from '../../utils/calculations';

interface AgentDashboardProps {
  user: User;
  clients: Client[];
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ user, clients }) => {
  const stats = calculateMonthlyStats(clients);
  const currentTier = getCurrentBonusTier(stats.totalSales);
  
  const recentClients = clients
    .filter(client => client.status === 'purchased')
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">שלום {user.name}! 👋</h1>
            <p className="text-primary-100">
              {stats.totalSales > 0 
                ? `מכירות מעולות החודש! המשיכו כך 🚀`
                : 'בואו נתחיל לעבוד על המכירות החודש!'
              }
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-primary-200">החודש הנוכחי</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalSales)}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="מכירות החודש"
          value={formatCurrency(stats.totalSales)}
          icon={TrendingUp}
          color="primary"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="לקוחות פעילים"
          value={stats.clientCount}
          icon={Users}
          color="success"
        />
        <StatCard
          title="בונוס נוכחי"
          value={formatCurrency(stats.currentBonus)}
          icon={Award}
          color="warning"
        />
        <StatCard
          title="יעד הבא"
          value={formatCurrency(stats.nextTierThreshold)}
          icon={Target}
          color="primary"
        />
      </div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">התקדמות לבונוס הבא</h2>
          {currentTier && (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              🏆 {currentTier.name}
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <ProgressBar
            progress={stats.progressPercentage}
            label={`${formatCurrency(stats.totalSales)} מתוך ${formatCurrency(stats.nextTierThreshold)}`}
            color="primary"
            size="lg"
          />
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>נותרו: {formatCurrency(stats.nextTierThreshold - stats.totalSales)}</span>
            <span>בונוס צפוי: {formatCurrency(stats.nextTierBonus)}</span>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 ml-2 text-primary-600" />
            מכירות אחרונות
          </h3>
          
          <div className="space-y-3">
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <motion.div
                  key={client.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="bg-success-100 p-2 rounded-full ml-3">
                      <Users className="w-4 h-4 text-success-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(client.purchaseDate).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-success-600">
                    {formatCurrency(client.price)}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">אין מכירות אחרונות</p>
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
              className="w-full flex items-center justify-center p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Users className="w-5 h-5 ml-2" />
              הוסף לקוח חדש
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center p-3 bg-success-50 text-success-700 rounded-lg hover:bg-success-100 transition-colors"
            >
              <Phone className="w-5 h-5 ml-2" />
              צור קשר עם לקוח
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <Target className="w-5 h-5 ml-2" />
              צפה ביעדים
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
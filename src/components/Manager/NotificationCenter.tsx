import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Award, 
  CheckCircle, 
  Clock, 
  Users, 
  Filter
} from 'lucide-react';
import { User } from '../../types';
import { useTeamManagement } from '../../hooks/useTeamManagement';

interface NotificationCenterProps {
  user: User;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ user }) => {
  const {
    notifications,
    loading,
    markNotificationAsRead,
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

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bonus_achieved':
        return <Award className="w-5 h-5 text-yellow-600" />;
      case 'milestone':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bonus_achieved':
        return 'bg-yellow-50 border-yellow-200';
      case 'milestone':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="w-6 h-6 ml-2 text-purple-600" />
            מרכז התראות
          </h1>
          <p className="text-gray-600 mt-1">
            התראות על הישגים ואירועים חשובים בצוות
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {notifications.filter(n => !n.read).length} לא נקראו
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card ${getNotificationColor(notification.type)} ${
              !notification.read ? 'border-l-4 border-l-purple-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {notification.agentName}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleString('he-IL')}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      notification.type === 'bonus_achieved' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : notification.type === 'milestone'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {notification.type === 'bonus_achieved' && '🏆 בונוס'}
                      {notification.type === 'milestone' && '🎯 יעד'}
                      {notification.type === 'warning' && '⚠️ אזהרה'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!notification.read && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="סמן כנקרא"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">אין התראות להצגה</p>
        </div>
      )}
    </div>
  );
}; 
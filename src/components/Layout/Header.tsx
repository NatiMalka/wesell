import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Bell, Settings, Shield, HelpCircle, ChevronDown, Award, CheckCircle, Clock, AlertCircle, X, DollarSign } from 'lucide-react';
import { User as UserType } from '../../types';
import { useTeamManagement } from '../../hooks/useTeamManagement';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Get notifications data (for all team members)
  const { notifications: allNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useTeamManagement(
    user.id, 
    user.teamId || ''
  );

  // Filter notifications based on user role:
  // - Managers see ALL notifications
  // - Agents see notifications from OTHER agents only (not their own sales)
  const notifications = allNotifications.filter(notification => {
    if (user.role === 'manager') {
      // Managers see all notifications
      return true;
    } else {
      // Agents don't see their own sale notifications
      if (notification.type === 'sale_made' && notification.agentId === user.id) {
        return false;
      }
      return true;
    }
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unread notifications count for current user (from filtered notifications)
  const unreadCount = notifications.filter(n => !n.readBy.includes(user.id)).length;

  // Handle notification click
  const handleNotificationClick = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  };

  // Handle clear all notifications
  const handleClearAll = async () => {
    await markAllNotificationsAsRead();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bonus_achieved':
        return Award;
      case 'milestone':
        return CheckCircle;
      case 'warning':
        return AlertCircle;
      case 'sale_made':
        return DollarSign;
      default:
        return Clock;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'bonus_achieved':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'milestone':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'sale_made':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const menuItems = [
    {
      icon: Settings,
      label: 'הגדרות',
      onClick: () => {
        setIsDropdownOpen(false);
        // Add settings navigation logic here
        console.log('Navigate to settings');
      }
    },
    {
      icon: Shield,
      label: 'שינוי סיסמה',
      onClick: () => {
        setIsDropdownOpen(false);
        // Add password change logic here
        console.log('Change password');
      }
    },
    {
      icon: HelpCircle,
      label: 'עזרה ותמיכה',
      onClick: () => {
        setIsDropdownOpen(false);
        // Add help/support logic here
        console.log('Open help');
      }
    },
    {
      icon: LogOut,
      label: 'התנתק',
      onClick: () => {
        setIsDropdownOpen(false);
        onLogout();
      },
      danger: true
    }
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Agent Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-primary-100 p-2 rounded-full cursor-pointer hover:bg-primary-200 transition-colors"
              >
                <User className="w-5 h-5 text-primary-600" />
                <ChevronDown className={`w-4 h-4 text-primary-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.role === 'agent' ? 'סוכן מכירות' : 'מנהל צוות'}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {menuItems.map((item, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ backgroundColor: item.danger ? '#fef2f2' : '#f9fafb' }}
                          onClick={item.onClick}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-right hover:bg-gray-50 transition-colors ${
                            item.danger ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          <item.icon className={`w-4 h-4 ${item.danger ? 'text-red-500' : 'text-gray-400'}`} />
                          <span>{item.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Agent Name */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.role === 'agent' ? 'סוכן מכירות' : 'מנהל צוות'}
              </p>
            </div>

            {/* Notifications */}
            {user.teamId && (
              <div className="relative" ref={notificationRef}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                  )}
                </motion.button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">התראות</h3>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClearAll}
                                className="px-3 py-1 text-xs font-medium text-purple-600 hover:text-purple-700 bg-white/70 hover:bg-white rounded-full transition-colors"
                              >
                                סמן הכל כנקרא
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setIsNotificationOpen(false)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            {unreadCount} התראות חדשות
                          </p>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="py-2">
                            {notifications.slice(0, 8).map((notification, index) => {
                              const Icon = getNotificationIcon(notification.type);
                              return (
                                <motion.div
                                  key={notification.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => handleNotificationClick(notification.id)}
                                  className={`mx-2 mb-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    notification.readBy.includes(user.id)
                                      ? 'bg-gray-50 border-gray-200 opacity-75' 
                                      : getNotificationColor(notification.type)
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${
                                      notification.readBy.includes(user.id) ? 'bg-gray-200' : 'bg-white/80'
                                    }`}>
                                      <Icon className={`w-4 h-4 ${
                                        notification.readBy.includes(user.id) ? 'text-gray-400' : ''
                                      }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className={`font-medium text-sm ${
                                          notification.readBy.includes(user.id) ? 'text-gray-600' : 'text-gray-900'
                                        }`}>
                                          {notification.agentName}
                                        </p>
                                        {!notification.readBy.includes(user.id) && (
                                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                        )}
                                      </div>
                                      <p className={`text-sm ${
                                        notification.readBy.includes(user.id) ? 'text-gray-500' : 'text-gray-700'
                                      }`}>
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {notification.timestamp.toLocaleDateString('he-IL')} - {notification.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-gray-400"
                            >
                              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm font-medium text-gray-500">אין התראות חדשות</p>
                              <p className="text-xs text-gray-400 mt-1">
                                התראות על מכירות ובונוסים יופיעו כאן
                              </p>
                            </motion.div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 8 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                          <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                            צפה בכל ההתראות ({notifications.length})
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg font-bold text-xl shadow-lg">
              WeSell
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};
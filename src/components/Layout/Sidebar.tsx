import React from 'react';
import { motion } from 'framer-motion';
import { Home, Users, Target, BarChart3, Settings, UserPlus, Shield, Bell, Bug } from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User;
}

const agentMenuItems = [
  { id: 'dashboard', label: 'דשבורד', icon: Home },
  { id: 'clients', label: 'ניהול לקוחות', icon: Users },
  { id: 'goals', label: 'יעדים ובונוסים', icon: Target },
  { id: 'reports', label: 'דוחות', icon: BarChart3 },
  { id: 'settings', label: 'הגדרות', icon: Settings },
];

const managerMenuItems = [
  // Team Management Section
  { id: 'manager-dashboard', label: 'דשבורד מנהל', icon: Shield },
  { id: 'agent-management', label: 'ניהול סוכנים', icon: UserPlus },
  { id: 'team-reports', label: 'דוחות צוות', icon: BarChart3 },
  
  // Personal Selling Section
  { id: 'my-clients', label: 'הלקוחות שלי', icon: Users },
  { id: 'my-goals', label: 'היעדים שלי', icon: Target },
  { id: 'my-reports', label: 'הדוחות שלי', icon: Home },
  
  { id: 'settings', label: 'הגדרות', icon: Settings },
  { id: 'debug', label: 'כלי פיתוח', icon: Bug },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, user }) => {
  const menuItems = user.role === 'manager' ? managerMenuItems : agentMenuItems;

  return (
    <motion.aside
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white shadow-lg h-full"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            user.role === 'manager' 
              ? 'bg-purple-100 text-purple-600' 
              : 'bg-primary-100 text-primary-600'
          }`}>
            {user.role === 'manager' ? (
              <Shield className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">
              {user.role === 'manager' ? 'מנהל צוות' : 'סוכן מכירות'}
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {user.role === 'manager' ? (
            <>
              {/* Team Management Section */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  ניהול צוות
                </h3>
                {managerMenuItems.slice(0, 3).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02, x: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center px-4 py-3 text-right rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-purple-100 text-purple-700 border-r-4 border-purple-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ml-3 ${
                        isActive ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Personal Selling Section */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  מכירות אישיות
                </h3>
                {managerMenuItems.slice(3, 6).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02, x: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-right rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-r-4 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                      <Icon className={`w-5 h-5 ml-3 ${
                        isActive ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Settings */}
              <div className="border-t pt-4">
                {managerMenuItems.slice(6).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02, x: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center px-4 py-3 text-right rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-100 text-gray-700 border-r-4 border-gray-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ml-3 ${
                        isActive ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
              </div>
            </>
          ) : (
            menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02, x: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-right rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-4 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ml-3 ${
                    isActive ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              );
            })
          )}
        </div>
      </nav>
    </motion.aside>
  );
};
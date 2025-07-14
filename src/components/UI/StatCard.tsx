import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend,
  onClick,
}) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-yellow-500 to-yellow-600',
    danger: 'from-red-500 to-red-600',
  };

  const bgColorClasses = {
    primary: 'bg-primary-50',
    success: 'bg-success-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`card cursor-pointer ${onClick ? 'hover:shadow-xl' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-success-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500 mr-1">מהחודש הקודם</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${bgColorClasses[color]}`}>
          <Icon className={`w-6 h-6 bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`} />
        </div>
      </div>
    </motion.div>
  );
};
import React from 'react';
import { motion } from 'framer-motion';
import { Target, Award, TrendingUp, Calendar, Star, Trophy, Crown, Gem } from 'lucide-react';
import { ProgressBar } from '../UI/ProgressBar';
import { Client, BONUS_TIERS } from '../../types';
import { calculateMonthlyStats, formatCurrency, getCurrentBonusTier } from '../../utils/calculations';

interface GoalsAndBonusesProps {
  clients: Client[];
}

export const GoalsAndBonuses: React.FC<GoalsAndBonusesProps> = ({ clients }) => {
  const stats = calculateMonthlyStats(clients);
  const currentTier = getCurrentBonusTier(stats.totalSales);
  
  const getTierIcon = (index: number) => {
    const icons = [Target, Award, Star, Trophy, Crown, Gem, Crown];
    const Icon = icons[index] || Target;
    return Icon;
  };

  const getTierColor = (index: number, isAchieved: boolean, isCurrent: boolean) => {
    if (isCurrent) return 'from-yellow-400 to-yellow-500';
    if (isAchieved) return 'from-green-400 to-green-500';
    return 'from-gray-300 to-gray-400';
  };

  const getTierBgColor = (index: number, isAchieved: boolean, isCurrent: boolean) => {
    if (isCurrent) return 'bg-yellow-50 border-yellow-200';
    if (isAchieved) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">יעדים ובונוסים</h1>
        <p className="text-gray-600">עקבו אחר ההתקדמות שלכם והשיגו את היעדים החודשיים</p>
      </motion.div>

      {/* Current Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary-200" />
            <p className="text-primary-200 text-sm">מכירות החודש</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</p>
          </div>
          <div className="text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-primary-200" />
            <p className="text-primary-200 text-sm">בונוס נוכחי</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.currentBonus)}</p>
          </div>
          <div className="text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-primary-200" />
            <p className="text-primary-200 text-sm">יעד הבא</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.nextTierThreshold)}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-primary-200">התקדמות ליעד הבא</span>
            <span className="text-white font-semibold">{Math.round(stats.progressPercentage)}%</span>
          </div>
          <div className="w-full bg-primary-800 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stats.progressPercentage, 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="bg-gradient-to-r from-yellow-400 to-yellow-300 h-3 rounded-full"
            />
          </div>
          <div className="flex justify-between text-sm text-primary-200 mt-2">
            <span>נותרו: {formatCurrency(Math.max(0, stats.nextTierThreshold - stats.totalSales))}</span>
            <span>בונוס צפוי: {formatCurrency(stats.nextTierBonus)}</span>
          </div>
        </div>
      </motion.div>

      {/* Bonus Tiers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">מדרגות הבונוסים</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {BONUS_TIERS.map((tier, index) => {
            const isAchieved = stats.totalSales >= tier.threshold;
            const isCurrent = currentTier?.threshold === tier.threshold;
            const Icon = getTierIcon(index);
            
            return (
              <motion.div
                key={tier.threshold}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${getTierBgColor(index, isAchieved, isCurrent)}`}
              >
                {/* Achievement Badge */}
                {isAchieved && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + 0.1 * index }}
                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                  >
                    <Star className="w-4 h-4" />
                  </motion.div>
                )}
                
                {/* Current Tier Indicator */}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -left-2 bg-yellow-500 text-white rounded-full p-1"
                  >
                    <Crown className="w-4 h-4" />
                  </motion.div>
                )}

                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${getTierColor(index, isAchieved, isCurrent)} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-1">{tier.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{formatCurrency(tier.threshold)}</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(tier.bonus)}</p>
                  
                  {!isAchieved && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min((stats.totalSales / tier.threshold) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(Math.max(0, tier.threshold - stats.totalSales))} נותרו
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Monthly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Month Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-6 h-6 ml-2 text-primary-600" />
            סטטיסטיקות החודש
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">סה"כ מכירות</span>
              <span className="font-bold text-primary-600">{formatCurrency(stats.totalSales)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">מספר לקוחות</span>
              <span className="font-bold text-success-600">{stats.clientCount}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">בונוס שנצבר</span>
              <span className="font-bold text-yellow-600">{formatCurrency(stats.currentBonus)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">ממוצע למכירה</span>
              <span className="font-bold text-gray-900">
                {stats.clientCount > 0 ? formatCurrency(stats.totalSales / stats.clientCount) : formatCurrency(0)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Trophy className="w-6 h-6 ml-2 text-yellow-600" />
            הישגים
          </h3>
          
          <div className="space-y-3">
            {BONUS_TIERS.filter(tier => stats.totalSales >= tier.threshold).map((tier, index) => (
              <motion.div
                key={tier.threshold}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="bg-green-500 text-white rounded-full p-2 ml-3">
                  <Star className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">{tier.name}</p>
                  <p className="text-sm text-green-600">בונוס: {formatCurrency(tier.bonus)}</p>
                </div>
                <div className="text-green-600">
                  <Trophy className="w-5 h-5" />
                </div>
              </motion.div>
            ))}
            
            {BONUS_TIERS.filter(tier => stats.totalSales >= tier.threshold).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>עדיין לא הושגו הישגים</p>
                <p className="text-sm">המשיכו לעבוד קשה!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Motivation Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card bg-gradient-to-r from-green-500 to-green-600 text-white text-center"
      >
        <div className="max-w-2xl mx-auto">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-green-200" />
          <h3 className="text-2xl font-bold mb-2">המשיכו כך! 🚀</h3>
          <p className="text-green-100 mb-4">
            {stats.totalSales > 0 
              ? `כבר השגתם ${formatCurrency(stats.totalSales)} החודש! אתם בדרך הנכונה להשגת היעדים.`
              : 'זה הזמן להתחיל! כל מכירה מקרבת אתכם ליעד הבא.'
            }
          </p>
          {stats.nextTierThreshold > stats.totalSales && (
            <p className="text-lg font-semibold">
              רק {formatCurrency(stats.nextTierThreshold - stats.totalSales)} נותרו ליעד הבא! 💪
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
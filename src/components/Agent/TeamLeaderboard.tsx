import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  Target,
  Crown,
  Zap,
  Star,
  Flame,
  Wifi,
  WifiOff
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import { useRealTimeTeamPerformance } from '../../hooks/useRealTimeTeamPerformance';

interface TeamMemberStats {
  id: string;
  name: string;
  totalSales: number;
  clientCount: number;
  rank: number;
  isCurrentUser: boolean;
  avatar?: string;
  streak: number; // Days of consecutive sales
  lastSaleDate: Date;
}

interface TeamLeaderboardProps {
  currentUserId: string;
  teamId: string;
}

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({ currentUserId, teamId }) => {
  const [animationKey, setAnimationKey] = useState(0);
  
  // Use the new real-time performance hook for instant updates
  const { 
    livePerformance, 
    isConnected, 
    loading 
  } = useRealTimeTeamPerformance(currentUserId, teamId);

  // Convert live performance data to TeamMemberStats format
  const agents: TeamMemberStats[] = livePerformance.members.map(member => ({
    id: member.id,
    name: member.name,
    totalSales: member.totalSales,
    clientCount: member.clientCount,
    rank: member.rank,
    isCurrentUser: member.id === currentUserId,
    streak: 0, // We can calculate this from lastSaleTime if needed
    lastSaleDate: new Date(member.lastSaleTime)
  }));

  // Trigger animation when live performance updates
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [livePerformance.lastUpdated]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'from-primary-500 to-primary-600';
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-400 to-amber-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getMotivationalMessage = (rank: number, totalAgents: number) => {
    if (rank === 1) return '🔥 המוביל! המשיכו כך!';
    if (rank === 2) return '💪 כמעט במקום הראשון!';
    if (rank === 3) return '🚀 במקום השלישי - לדבר!';
    if (rank <= totalAgents / 2) return '📈 באמצע הדרך - בואו נתקדם!';
    return '⚡ זמן להתעורר - בואו נראה כוח!';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const topAgent = agents[0];
  const currentUser = agents.find(agent => agent.isCurrentUser);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-3 rounded-full">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">🏆 לוח התחרות</h2>
              {/* Real-time connection indicator */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isConnected 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
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
            <p className="text-sm text-gray-600">
              {isConnected ? 'עדכונים בזמן אמת' : 'מכירות החודש הנוכחי'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">סה"כ חברי צוות</p>
          <p className="text-2xl font-bold text-primary-600">{agents.length}</p>
        </div>
      </div>

      {/* Current User's Position */}
      {currentUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getRankIcon(currentUser.rank)}
              <div>
                <p className="font-semibold text-gray-900">המיקום שלך</p>
                <p className="text-sm text-gray-600">{getMotivationalMessage(currentUser.rank, agents.length)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary-600">{formatCurrency(currentUser.totalSales)}</p>
              <p className="text-sm text-gray-500">{currentUser.clientCount} לקוחות</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {agents.map((agent, index) => (
            <motion.div
              key={`${agent.id}-${animationKey}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.1 }}
              layoutId={agent.id}
              className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                agent.isCurrentUser 
                  ? 'border-primary-300 bg-primary-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r ${getRankColor(agent.rank, agent.isCurrentUser)} opacity-5`} />
              
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                      {getRankIcon(agent.rank)}
                    </div>

                    {/* Agent Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${agent.isCurrentUser ? 'text-primary-900' : 'text-gray-900'}`}>
                          {agent.name}
                        </p>
                        {agent.isCurrentUser && (
                          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                            אתה
                          </span>
                        )}
                                                 {agent.streak > 0 && (
                           <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
                             <Flame className="w-3 h-3" />
                             {agent.streak}
                           </div>
                         )}
                      </div>
                      <p className="text-sm text-gray-600">{agent.clientCount} לקוחות</p>
                    </div>
                  </div>

                  {/* Sales Amount */}
                  <div className="text-right">
                    <p className={`text-lg font-bold ${agent.isCurrentUser ? 'text-primary-600' : 'text-gray-900'}`}>
                      {formatCurrency(agent.totalSales)}
                    </p>
                    {agent.rank <= 3 && (
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-xs text-yellow-600">TOP 3</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topAgent ? (agent.totalSales / topAgent.totalSales) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-2 rounded-full bg-gradient-to-r ${getRankColor(agent.rank, agent.isCurrentUser)}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Motivational Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-2 rounded-full">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">💡 טיפ יומי</p>
            <p className="text-sm text-gray-600">
              {isConnected 
                ? agents.length > 1 
                  ? "🔥 מתחרים בזמן אמת! סוכנים ומנהלים יחד - כל מכירה מעדכנת את הדירוג מיידית! 🚀"
                  : "בקרוב יצטרפו עוד חברי צוות - תתכוננו להתחרות חיה! 💪"
                : agents.length > 1 
                  ? "התחרות מחזקת את כולנו! בואו נמשיך לדחוף קדימה יחד 🚀"
                  : "בקרוב יצטרפו עוד חברי צוות - תתכוננו להתחרות! 💪"
              }
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 
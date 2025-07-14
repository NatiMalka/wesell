import { useState, useEffect, useCallback } from 'react';
import { 
  ref, 
  onValue, 
  set, 
  push, 
  serverTimestamp, 
  off,
  onDisconnect
} from 'firebase/database';
import { rtdb } from '../config/firebase';

interface LivePerformanceMember {
  id: string;
  name: string;
  role: 'agent' | 'manager';
  totalSales: number;
  clientCount: number;
  rank: number;
  lastSaleTime: number;
  lastActive: number;
  isOnline: boolean;
}

interface LiveTeamPerformance {
  members: LivePerformanceMember[];
  lastUpdated: number;
  totalTeamSales: number;
  totalTeamClients: number;
}

export const useRealTimeTeamPerformance = (currentUserId: string, teamId: string) => {
  const [livePerformance, setLivePerformance] = useState<LiveTeamPerformance>({
    members: [],
    lastUpdated: Date.now(),
    totalTeamSales: 0,
    totalTeamClients: 0
  });
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  // Set up real-time listeners
  useEffect(() => {
    if (!teamId || !currentUserId) {
      setLoading(false);
      return;
    }

    console.log('🔥 Setting up Realtime Database listeners for team:', teamId);

    // Reference to team performance data
    const teamPerformanceRef = ref(rtdb, `teams/${teamId}/livePerformance`);
    
    // Connection state listener
    const connectedRef = ref(rtdb, '.info/connected');
    const connectionListener = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val();
      setIsConnected(connected);
      
      if (connected) {
        console.log('🔥 Connected to Realtime Database');
        // Set user as online
        const userPresenceRef = ref(rtdb, `teams/${teamId}/livePerformance/${currentUserId}/isOnline`);
        set(userPresenceRef, true);
        
        // Set user as offline when disconnected
        onDisconnect(userPresenceRef).set(false);
        
        // Update last active timestamp
        const lastActiveRef = ref(rtdb, `teams/${teamId}/livePerformance/${currentUserId}/lastActive`);
        set(lastActiveRef, serverTimestamp());
        onDisconnect(lastActiveRef).set(serverTimestamp());
      } else {
        console.log('📴 Disconnected from Realtime Database');
      }
    });

    // Team performance data listener
    const performanceListener = onValue(teamPerformanceRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // Convert Firebase object to array and sort by totalSales
        const membersArray: LivePerformanceMember[] = Object.entries(data)
          .map(([id, memberData]: [string, any]) => ({
            id,
            name: memberData.name || 'Unknown',
            role: memberData.role || 'agent',
            totalSales: memberData.totalSales || 0,
            clientCount: memberData.clientCount || 0,
            rank: 0, // Will be calculated
            lastSaleTime: memberData.lastSaleTime || 0,
            lastActive: memberData.lastActive || 0,
            isOnline: memberData.isOnline || false
          }))
          .sort((a, b) => b.totalSales - a.totalSales)
          .map((member, index) => ({ ...member, rank: index + 1 }));

        const totalTeamSales = membersArray.reduce((sum, member) => sum + member.totalSales, 0);
        const totalTeamClients = membersArray.reduce((sum, member) => sum + member.clientCount, 0);

        setLivePerformance({
          members: membersArray,
          lastUpdated: Date.now(),
          totalTeamSales,
          totalTeamClients
        });

        // Log only significant updates
        if (membersArray.length > 0 && membersArray.some(m => m.totalSales > 0)) {
          console.log(`🔥 Live performance update: ${membersArray.length} members, total: ${totalTeamSales}`);
        }
      } else {
        // No data yet, set empty state
        setLivePerformance({
          members: [],
          lastUpdated: Date.now(),
          totalTeamSales: 0,
          totalTeamClients: 0
        });
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Error in Realtime Database listener:', error);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up Realtime Database listeners');
      off(teamPerformanceRef, 'value', performanceListener);
      off(connectedRef, 'value', connectionListener);
    };
  }, [teamId, currentUserId]);

  // Update member performance in real-time
  const updateMemberPerformance = useCallback(async (
    memberId: string,
    memberName: string,
    memberRole: 'agent' | 'manager',
    totalSales: number,
    clientCount: number
  ) => {
    if (!teamId) return;

    try {
      const memberRef = ref(rtdb, `teams/${teamId}/livePerformance/${memberId}`);
      
      const updateData = {
        name: memberName,
        role: memberRole,
        totalSales,
        clientCount,
        lastSaleTime: serverTimestamp(),
        lastActive: serverTimestamp(),
        isOnline: true
      };

      await set(memberRef, updateData);
      
      console.log(`🔥 Updated live performance for ${memberName}: ${totalSales} sales, ${clientCount} clients`);
      
      // Log achievement if it's a significant milestone
      if (totalSales > 0 && totalSales % 1000 === 0) {
        console.log(`🎉 ${memberName} reached ${totalSales} in sales!`);
      }
    } catch (error) {
      console.error('Error updating member performance:', error);
    }
  }, [teamId]);

  // Remove member from live performance (when deleted)
  const removeMemberFromLivePerformance = useCallback(async (memberId: string) => {
    if (!teamId) return;

    try {
      const memberRef = ref(rtdb, `teams/${teamId}/livePerformance/${memberId}`);
      await set(memberRef, null); // Delete the member's data
      console.log(`🗑️ Removed member ${memberId} from live performance`);
    } catch (error) {
      console.error('Error removing member from live performance:', error);
    }
  }, [teamId]);

  // Initialize member in live performance
  const initializeMemberInLivePerformance = useCallback(async (
    memberId: string,
    memberName: string,
    memberRole: 'agent' | 'manager'
  ) => {
    if (!teamId) return;

    try {
      const memberRef = ref(rtdb, `teams/${teamId}/livePerformance/${memberId}`);
      
      const initialData = {
        name: memberName,
        role: memberRole,
        totalSales: 0,
        clientCount: 0,
        lastSaleTime: 0,
        lastActive: serverTimestamp(),
        isOnline: true
      };

      await set(memberRef, initialData);
      console.log(`✅ Initialized ${memberName} in live performance`);
    } catch (error) {
      console.error('Error initializing member in live performance:', error);
    }
  }, [teamId]);

  // Get member by ID
  const getMemberPerformance = useCallback((memberId: string) => {
    return livePerformance.members.find(member => member.id === memberId) || null;
  }, [livePerformance.members]);

  // Get top performers
  const getTopPerformers = useCallback((limit: number = 3) => {
    return livePerformance.members
      .filter(member => member.totalSales > 0)
      .slice(0, limit);
  }, [livePerformance.members]);

  return {
    livePerformance,
    isConnected,
    loading,
    updateMemberPerformance,
    removeMemberFromLivePerformance,
    initializeMemberInLivePerformance,
    getMemberPerformance,
    getTopPerformers
  };
}; 
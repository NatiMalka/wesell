import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Client, MonthlyStats } from '../types';
import { calculateMonthlyStats } from '../utils/calculations';
import { useTeamSalesSync } from './useTeamSalesSync';

export const useTeamManagement = (userId: string, teamId: string) => {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [teamClients, setTeamClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    agentId: string;
    agentName: string;
    message: string;
    type: 'bonus_achieved' | 'milestone' | 'warning' | 'sale_made';
    timestamp: Date;
    readBy: string[];
    clientName?: string;
    saleAmount?: number;
    planName?: string;
  }>>([]);

  // Initialize team sales sync only if teamId exists
  const { initializeTeamSales, updateSalesForClient, removeAgentFromTeamSales } = useTeamSalesSync(userId, teamId || '');

  // Load team data
  useEffect(() => {
    if (userId && teamId) {
      loadTeamData();
    }
  }, [userId, teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading team data for teamId:', teamId);
      
      // Load team members (both agents and managers)
      const agentsQuery = query(
        collection(db, 'users'),
        where('teamId', '==', teamId),
        where('role', '==', 'agent')
      );
      
      const managersQuery = query(
        collection(db, 'users'),
        where('teamId', '==', teamId),
        where('role', '==', 'manager')
      );
      
      const [agentsSnapshot, managersSnapshot] = await Promise.all([
        getDocs(agentsQuery),
        getDocs(managersQuery)
      ]);
      
      // Combine snapshots
      const combinedDocs = [...agentsSnapshot.docs, ...managersSnapshot.docs];
      const members: User[] = [];
      
      combinedDocs.forEach((doc) => {
        const data = doc.data();
        console.log('👤 Found team member:', {
          id: doc.id,
          name: data.name,
          email: data.email,
          teamId: data.teamId,
          role: data.role
        });
        members.push({
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          phone: data.phone || '',
          role: data.role || 'agent',
          teamId: data.teamId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      console.log('📊 Total team members loaded:', members.length);
      setTeamMembers([...members]); // Force new array reference to trigger re-render

      // Load all clients for team members
      const memberIds = members.map(m => m.id);
      if (memberIds.length > 0) {
        const clientsQuery = query(
          collection(db, 'clients'),
          where('agentId', 'in', memberIds)
        );
        
        const clientsSnapshot = await getDocs(clientsQuery);
        const clients: Client[] = [];
        
        clientsSnapshot.forEach((doc) => {
          const data = doc.data();
          clients.push({
            id: doc.id,
            name: data.name || '',
            phone: data.phone || '',
            plan: data.plan,
            price: data.price || 0,
            status: data.status || 'potential',
            purchaseDate: data.purchaseDate?.toDate() || new Date(),
            notes: data.notes || '',
            agentId: data.agentId || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        
        setTeamClients(clients);
      }
      
      // Initialize team sales sync
      await initializeTeamSales();
      
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time notification listener
  useEffect(() => {
    if (!teamId) return;

    console.log('🔔 Setting up real-time notification listener for teamId:', teamId);

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('teamId', '==', teamId)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const loadedNotifications: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedNotifications.push({
          id: doc.id,
          agentId: data.agentId || '',
          agentName: data.agentName || '',
          message: data.message || '',
          type: data.type || 'milestone',
          timestamp: data.timestamp?.toDate() || new Date(),
          readBy: data.readBy || [],
          clientName: data.clientName || '',
          saleAmount: data.saleAmount || 0,
          planName: data.planName || '',
        });
      });
      
      const sortedNotifications = loadedNotifications.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      setNotifications(sortedNotifications);
      console.log('🔔 Real-time notifications updated:', sortedNotifications.length);
    }, (error: any) => {
      console.error('Error in notification listener:', error);
    });

    return () => {
      console.log('🔔 Cleaning up notification listener');
      unsubscribe();
    };
  }, [teamId]);

  // Get team member stats
  const getTeamMemberStats = (agentId: string): MonthlyStats => {
    const agentClients = teamClients.filter(client => client.agentId === agentId);
    return calculateMonthlyStats(agentClients);
  };

  // Get team overview stats
  const getTeamOverview = () => {
    const totalStats = calculateMonthlyStats(teamClients);
    const memberStats = teamMembers.map(member => ({
      ...member,
      stats: getTeamMemberStats(member.id)
    }));
    
    return {
      totalStats,
      memberStats,
      totalMembers: teamMembers.length,
      totalClients: teamClients.length,
      activeMembersCount: memberStats.filter(m => m.stats.totalSales > 0).length,
    };
  };

  // Update team member
  const updateTeamMember = async (memberId: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        ...updates,
        updatedAt: new Date(),
      });
      
      // Update local state
      setTeamMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, ...updates }
            : member
        )
      );
    } catch (error) {
      console.error('Error updating team member:', error);
      throw new Error('שגיאה בעדכון פרטי הסוכן');
    }
  };

  // Comprehensive cleanup function for removing all traces of an agent
  const cleanupDeletedAgent = async (agentId: string, agentName?: string) => {
    try {
      console.log(`🧹 Starting comprehensive cleanup for agent: ${agentId} (${agentName || 'Unknown'})`);
      
      // 1. Remove from agentSales collection
      try {
        await removeAgentFromTeamSales(agentId);
        console.log('✅ Removed from agentSales');
      } catch (error) {
        console.log('ℹ️ Agent not found in agentSales or already removed');
      }
      
      // 2. Completely delete user document from Firebase
      try {
        await deleteDoc(doc(db, 'users', agentId));
        console.log('✅ Deleted user document from Firebase');
      } catch (error) {
        console.log('ℹ️ User document not found or already deleted');
      }
      
      // Also check and delete from pendingUsers if exists
      try {
        await deleteDoc(doc(db, 'pendingUsers', agentId));
        console.log('✅ Deleted from pendingUsers collection');
      } catch (error) {
        console.log('ℹ️ Not found in pendingUsers collection');
      }
      
      // 3. Handle agent's clients - reassign to manager
      const agentClients = teamClients.filter(client => client.agentId === agentId);
      console.log(`📋 Found ${agentClients.length} clients to reassign`);
      
      for (const client of agentClients) {
        try {
          await updateDoc(doc(db, 'clients', client.id), {
            agentId: userId,
            notes: `${client.notes || ''}\n[הועבר מסוכן שהוסר מהצוות - ${new Date().toLocaleDateString('he-IL')}]`.trim(),
            updatedAt: new Date(),
          });
          console.log(`📌 Reassigned client ${client.name} to manager`);
        } catch (error) {
          console.error('Error reassigning client:', client.id, error);
        }
      }
      
      // 4. Clean up notifications
      try {
        const agentNotifications = notifications.filter(n => n.agentId === agentId);
        for (const notification of agentNotifications) {
          try {
            await deleteDoc(doc(db, 'notifications', notification.id));
          } catch (error) {
            console.log('Notification already deleted:', notification.id);
          }
        }
        if (agentNotifications.length > 0) {
          console.log(`🔔 Cleaned up ${agentNotifications.length} notifications`);
        }
      } catch (error) {
        console.log('ℹ️ No notifications to clean up');
      }
      
      // 5. Update local state
      setTeamMembers(prev => prev.filter(member => member.id !== agentId));
      setTeamClients(prev => prev.map(client => 
        client.agentId === agentId 
          ? { ...client, agentId: userId, notes: `${client.notes || ''}\n[הועבר מסוכן שהוסר מהצוות]`.trim() }
          : client
      ));
      setNotifications(prev => prev.filter(notification => notification.agentId !== agentId));
      
      console.log('✅ Comprehensive cleanup completed successfully');
      
      // 6. Verify cleanup was successful
      try {
        const verificationDoc = await getDoc(doc(db, 'users', agentId));
        if (verificationDoc.exists()) {
          console.warn('⚠️ Warning: User document still exists after cleanup');
        } else {
          console.log('✅ Verified: User document successfully deleted');
        }
      } catch (error) {
        console.log('✅ Verified: User document does not exist (as expected)');
      }
      
      // Force reload of team data to ensure consistency
      setTimeout(() => {
        loadTeamData();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error in comprehensive cleanup:', error);
      throw new Error(`Failed to cleanup agent: ${error.message || 'Unknown error'}`);
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      // Get agent name for logging
      const agent = teamMembers.find(m => m.id === memberId);
      const agentName = agent?.name || 'Unknown Agent';
      
      console.log(`🗑️ Starting agent deletion process for: ${agentName} (${memberId})`);
      
      // Use the comprehensive cleanup function
      await cleanupDeletedAgent(memberId, agentName);
      
      console.log(`✅ Agent ${agentName} deleted successfully`);
    } catch (error) {
      console.error('Error removing team member:', error);
      throw new Error('שגיאה בהסרת הסוכן מהצוות');
    }
  };

  // Update client (manager can edit any team member's clients)
  const updateTeamClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      const oldClient = teamClients.find(client => client.id === clientId);
      
      await updateDoc(doc(db, 'clients', clientId), {
        ...updates,
        updatedAt: new Date(),
      });
      
      // Update local state
      const updatedClient = { ...oldClient, ...updates } as Client;
      setTeamClients(prev => 
        prev.map(client => 
          client.id === clientId 
            ? updatedClient
            : client
        )
      );
      
      // Sync sales data for the affected agent
      if (oldClient) {
        await updateSalesForClient('updated', updatedClient, oldClient);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error('שגיאה בעדכון פרטי הלקוח');
    }
  };

  // Delete client (manager can delete any team member's clients)
  const deleteTeamClient = async (clientId: string) => {
    try {
      const clientToDelete = teamClients.find(client => client.id === clientId);
      
      await deleteDoc(doc(db, 'clients', clientId));
      
      // Update local state
      setTeamClients(prev => prev.filter(client => client.id !== clientId));
      
      // Sync sales data for the affected agent
      if (clientToDelete) {
        await updateSalesForClient('removed', clientToDelete);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      throw new Error('שגיאה במחיקת הלקוח');
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      // Get current notification to check readBy array
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (notificationDoc.exists()) {
        const data = notificationDoc.data();
        const currentReadBy = data.readBy || [];
        
        // Only update if current user hasn't read it yet
        if (!currentReadBy.includes(userId)) {
          await updateDoc(notificationRef, {
            readBy: [...currentReadBy, userId],
            updatedAt: new Date(),
          });
          console.log('✅ Notification marked as read for user:', userId);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read for current user
  const markAllNotificationsAsRead = async () => {
    try {
      console.log('🔔 Marking all notifications as read for user:', userId);
      
      const updates = notifications
        .filter(notification => !notification.readBy.includes(userId))
        .map(async (notification) => {
          const notificationRef = doc(db, 'notifications', notification.id);
          const currentReadBy = notification.readBy || [];
          return updateDoc(notificationRef, {
            readBy: [...currentReadBy, userId],
            updatedAt: new Date(),
          });
        });

      await Promise.all(updates);
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Create notification (for bonus achievements)
  const createNotification = async (
    agentId: string,
    agentName: string,
    message: string,
    type: 'bonus_achieved' | 'milestone' | 'warning' | 'sale_made'
  ) => {
    try {
      const notificationData = {
        teamId,
        agentId,
        agentName,
        message,
        type,
        timestamp: new Date(),
        readBy: [], // No one has read it yet
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Real-time listener will automatically update local state
      console.log('✅ Notification created:', message);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return {
    teamMembers,
    teamClients,
    notifications,
    loading,
    getTeamMemberStats,
    getTeamOverview,
    updateTeamMember,
    removeTeamMember,
    cleanupDeletedAgent,
    updateTeamClient,
    deleteTeamClient,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    createNotification,
    refreshData: loadTeamData,
  };
}; 
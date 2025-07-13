import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Client, MonthlyStats } from '../types';
import { calculateMonthlyStats } from '../utils/calculations';

export const useTeamManagement = (managerId: string, teamId: string) => {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [teamClients, setTeamClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    agentId: string;
    agentName: string;
    message: string;
    type: 'bonus_achieved' | 'milestone' | 'warning';
    timestamp: Date;
    read: boolean;
  }>>([]);

  // Load team data
  useEffect(() => {
    if (managerId && teamId) {
      loadTeamData();
    }
  }, [managerId, teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Load team members
      const membersQuery = query(
        collection(db, 'users'),
        where('teamId', '==', teamId),
        where('role', '==', 'agent')
      );
      
      const membersSnapshot = await getDocs(membersQuery);
      const members: User[] = [];
      
      membersSnapshot.forEach((doc) => {
        const data = doc.data();
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
      
      setTeamMembers(members);

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
      
      // Load notifications
      await loadNotifications();
      
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('teamId', '==', teamId)
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const loadedNotifications: any[] = [];
      
      notificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        loadedNotifications.push({
          id: doc.id,
          agentId: data.agentId || '',
          agentName: data.agentName || '',
          message: data.message || '',
          type: data.type || 'milestone',
          timestamp: data.timestamp?.toDate() || new Date(),
          read: data.read || false,
        });
      });
      
      setNotifications(loadedNotifications.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      ));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

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

  // Remove team member
  const removeTeamMember = async (memberId: string) => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        teamId: '',
        updatedAt: new Date(),
      });
      
      // Update local state
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (error) {
      console.error('Error removing team member:', error);
      throw new Error('שגיאה בהסרת הסוכן מהצוות');
    }
  };

  // Update client (manager can edit any team member's clients)
  const updateTeamClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      await updateDoc(doc(db, 'clients', clientId), {
        ...updates,
        updatedAt: new Date(),
      });
      
      // Update local state
      setTeamClients(prev => 
        prev.map(client => 
          client.id === clientId 
            ? { ...client, ...updates }
            : client
        )
      );
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error('שגיאה בעדכון פרטי הלקוח');
    }
  };

  // Delete client (manager can delete any team member's clients)
  const deleteTeamClient = async (clientId: string) => {
    try {
      await deleteDoc(doc(db, 'clients', clientId));
      
      // Update local state
      setTeamClients(prev => prev.filter(client => client.id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw new Error('שגיאה במחיקת הלקוח');
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        updatedAt: new Date(),
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Create notification (for bonus achievements)
  const createNotification = async (
    agentId: string,
    agentName: string,
    message: string,
    type: 'bonus_achieved' | 'milestone' | 'warning'
  ) => {
    try {
      const notificationData = {
        teamId,
        agentId,
        agentName,
        message,
        type,
        timestamp: new Date(),
        read: false,
      };
      
      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Update local state
      setNotifications(prev => [
        {
          id: `temp_${Date.now()}`,
          ...notificationData,
        },
        ...prev
      ]);
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
    updateTeamClient,
    deleteTeamClient,
    markNotificationAsRead,
    createNotification,
    refreshData: loadTeamData,
  };
}; 
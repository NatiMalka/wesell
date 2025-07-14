import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PLAN_PRICES } from '../types';

export type NotificationType = 'bonus_achieved' | 'milestone' | 'warning' | 'sale_made';

export interface NotificationData {
  teamId: string;
  agentId: string;
  agentName: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  readBy: string[]; // Array of user IDs who have read this notification
  // For sale notifications
  clientName?: string;
  saleAmount?: number;
  planName?: string;
}

// Get plan name in Hebrew
const getPlanName = (planType: string): string => {
  switch (planType) {
    case 'webinar_price':
      return 'תוכנית ובינר';
    case 'full_price':
      return 'תוכנית מלאה';
    case 'webinar_top':
      return 'ובינר TOP';
    case 'full_top':
      return 'מלאה TOP';
    default:
      return 'תוכנית לא ידועה';
  }
};

// Get all team members for notification broadcasting
const getTeamMembers = async (teamId: string): Promise<Array<{id: string, name: string}>> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('teamId', '==', teamId)
    );
    
    const snapshot = await getDocs(usersQuery);
    const members: Array<{id: string, name: string}> = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      members.push({
        id: doc.id,
        name: data.name || 'משתמש לא ידוע'
      });
    });
    
    return members;
  } catch (error) {
    console.error('Error getting team members:', error);
    return [];
  }
};

// Send sale notification to all team members
export const sendSaleNotification = async (
  teamId: string,
  sellerAgentId: string,
  sellerAgentName: string,
  clientName: string,
  planType: string,
  saleAmount: number
) => {
  try {
    if (!teamId) {
      console.log('No teamId provided, skipping sale notification');
      return;
    }

    console.log('🔔 Sending sale notification for:', clientName, 'by', sellerAgentName);
    
    // Get all team members
    const teamMembers = await getTeamMembers(teamId);
    
    if (teamMembers.length === 0) {
      console.log('No team members found for teamId:', teamId);
      return;
    }

    const planName = getPlanName(planType);
    const message = `מכירה חדשה! ${clientName} רכש ${planName} תמורת ${saleAmount.toLocaleString('he-IL')} ₪`;

    // Create ONE notification for the entire team (not per member)
    const notificationData: NotificationData = {
      teamId,
      agentId: sellerAgentId,
      agentName: sellerAgentName,
      message,
      type: 'sale_made',
      timestamp: new Date(),
      readBy: [], // No one has read it yet
      clientName,
      saleAmount,
      planName,
    };

    try {
      await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`✅ Sale notification created for team`);
    } catch (error) {
      console.error(`❌ Failed to create sale notification:`, error);
    }
    
  } catch (error) {
    console.error('Error sending sale notification:', error);
  }
};

// Send bonus achievement notification
export const sendBonusNotification = async (
  teamId: string,
  agentId: string,
  agentName: string,
  bonusAmount: number,
  tierName: string
) => {
  try {
    if (!teamId) return;

    const message = `🏆 ${agentName} הגיע לדרגת בונוס ${tierName} וזכה ב-${bonusAmount.toLocaleString('he-IL')} ₪!`;

    const notificationData: NotificationData = {
      teamId,
      agentId,
      agentName,
      message,
      type: 'bonus_achieved',
      timestamp: new Date(),
      readBy: [], // No one has read it yet
    };

    await addDoc(collection(db, 'notifications'), notificationData);
    console.log('✅ Bonus notification sent');
    
  } catch (error) {
    console.error('Error sending bonus notification:', error);
  }
};

// Send milestone notification
export const sendMilestoneNotification = async (
  teamId: string,
  agentId: string,
  agentName: string,
  milestone: string
) => {
  try {
    if (!teamId) return;

    const message = `🎯 ${agentName} הגיע לאבן דרך: ${milestone}`;

    const notificationData: NotificationData = {
      teamId,
      agentId,
      agentName,
      message,
      type: 'milestone',
      timestamp: new Date(),
      readBy: [], // No one has read it yet
    };

    await addDoc(collection(db, 'notifications'), notificationData);
    console.log('✅ Milestone notification sent');
    
  } catch (error) {
    console.error('Error sending milestone notification:', error);
  }
}; 
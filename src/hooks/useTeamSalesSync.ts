import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db, rtdb } from '../config/firebase';
import { Client } from '../types';
import { calculateMonthlyStats } from '../utils/calculations';

interface AgentSalesData {
  id: string;
  name: string;
  email: string;
  totalSales: number;
  clientCount: number;
  lastSaleDate: Date;
  streak: number;
  updatedAt: Date;
}

export const useTeamSalesSync = (currentUserId: string, teamId: string) => {
  const [agentSalesData, setAgentSalesData] = useState<AgentSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Debounce mechanism to prevent rapid-fire updates
  const [updateTimeouts, setUpdateTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
  
  // Prevent multiple simultaneous initialization calls
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Sync current user's sales data to Firebase (memoized to prevent unnecessary calls)
  const syncUserSales = useCallback(async (clients: Client[]) => {
    if (!currentUserId || !teamId) return;

    // Get user role and data - now allow both agents and managers to sync their sales data
    let userData: any;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (!userDoc.exists()) return;
      
      userData = userDoc.data();
      if (userData.role !== 'agent' && userData.role !== 'manager') {
        return; // Skip for other roles
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      return;
    }

    try {
      const stats = calculateMonthlyStats(clients);
      const purchasedClients = clients.filter(client => client.status === 'purchased');
      
      // Calculate streak (consecutive days with sales)
      const sortedPurchases = purchasedClients
        .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const client of sortedPurchases) {
        const purchaseDate = new Date(client.purchaseDate);
        purchaseDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
          currentDate = new Date(purchaseDate);
        } else {
          break;
        }
      }

      // Get user profile for name and email
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('__name__', '==', currentUserId)
      ));

      let userName = 'Unknown';
      let userEmail = '';
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        userName = userData.name || 'Unknown';
        userEmail = userData.email || '';
      }

      // Update agent sales data in Firebase
      const salesData: AgentSalesData = {
        id: currentUserId,
        name: userName,
        email: userEmail,
        totalSales: stats.totalSales,
        clientCount: stats.clientCount,
        lastSaleDate: sortedPurchases.length > 0 ? new Date(sortedPurchases[0].purchaseDate) : new Date(),
        streak,
        updatedAt: new Date(),
      };

      // Store in team sales collection (Firestore)
      await setDoc(doc(db, 'teams', teamId, 'agentSales', currentUserId), salesData);
      
      // Also sync to Realtime Database for live updates
      try {
        const livePerformanceRef = ref(rtdb, `teams/${teamId}/livePerformance/${currentUserId}`);
        const liveData = {
          name: salesData.name,
          role: userData.role,
          totalSales: salesData.totalSales,
          clientCount: salesData.clientCount,
          lastSaleTime: Date.now(),
          lastActive: serverTimestamp(),
          isOnline: true
        };
        
        await set(livePerformanceRef, liveData);
        
        // Only log significant changes (not zero sales)
        if (salesData.totalSales > 0 || salesData.clientCount > 0) {
          console.log(`✅ Synced sales: ${salesData.name} - ${salesData.totalSales} (${salesData.clientCount} clients) [Firestore + Realtime]`);
        }
      } catch (realtimeError) {
        console.error('Error syncing to Realtime Database:', realtimeError);
        // Still log Firestore success even if Realtime fails
        if (salesData.totalSales > 0 || salesData.clientCount > 0) {
          console.log(`✅ Synced sales: ${salesData.name} - ${salesData.totalSales} (${salesData.clientCount} clients) [Firestore only]`);
        }
      }
    } catch (error) {
      console.error('Error syncing user sales:', error);
    }
  }, [currentUserId, teamId]);

  // Listen to real-time updates for all team members' sales
  useEffect(() => {
    if (!teamId) return;

    const teamSalesRef = collection(db, 'teams', teamId, 'agentSales');
    const q = query(teamSalesRef, orderBy('totalSales', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData: AgentSalesData[] = [];
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        salesData.push({
          id: doc.id,
          name: data.name || 'Unknown Agent',
          email: data.email || '',
          totalSales: data.totalSales || 0,
          clientCount: data.clientCount || 0,
          lastSaleDate: data.lastSaleDate?.toDate() || new Date(),
          streak: data.streak || 0,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      setAgentSalesData(salesData);
      setLoading(false);
      
      // Reduce logging frequency - only log occasionally
      if (Math.random() < 0.1) { // Log only 10% of updates
        console.log('🔄 Real-time sales update:', salesData.length, 'agents');
      }
    }, (error) => {
      console.error('Error listening to sales updates:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [teamId]);

  // Initialize team sales structure if it doesn't exist (memoized)
  const initializeTeamSales = useCallback(async () => {
    if (!teamId) return;
    
    // Prevent multiple simultaneous initialization calls
    if (isInitializing) {
      return; // Skip silently if already initializing
    }
    
    setIsInitializing(true);

    try {
      // Get both AGENTS and MANAGERS in the team
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
      
      // Combine both agents and managers
      const teamMembersSnapshot = {
        docs: [...agentsSnapshot.docs, ...managersSnapshot.docs]
      };
      
      // Initialize sales data for each team member if it doesn't exist
      for (const memberDoc of teamMembersSnapshot.docs) {
        const memberData = memberDoc.data();
        const salesDocRef = doc(db, 'teams', teamId, 'agentSales', memberDoc.id);
        
        // Check if sales data exists using direct document access
        const existingSalesDoc = await getDoc(salesDocRef);
        
        if (!existingSalesDoc.exists()) {
          // Create initial sales data
          const initialSalesData: AgentSalesData = {
            id: memberDoc.id,
            name: memberData.name || 'Unknown Agent',
            email: memberData.email || '',
            totalSales: 0,
            clientCount: 0,
            lastSaleDate: new Date(),
            streak: 0,
            updatedAt: new Date(),
          };
          
          await setDoc(salesDocRef, initialSalesData);
          
          // Also initialize in Realtime Database
          try {
            const livePerformanceRef = ref(rtdb, `teams/${teamId}/livePerformance/${memberDoc.id}`);
            const liveInitialData = {
              name: memberData.name || 'Unknown',
              role: memberData.role || 'agent',
              totalSales: 0,
              clientCount: 0,
              lastSaleTime: 0,
              lastActive: serverTimestamp(),
              isOnline: false
            };
            
            await set(livePerformanceRef, liveInitialData);
            console.log(`✅ Initialized ${memberData.role || 'team member'}: ${memberData.name} [Firestore + Realtime]`);
          } catch (realtimeError) {
            console.error('Error initializing in Realtime Database:', realtimeError);
            console.log(`✅ Initialized ${memberData.role || 'team member'}: ${memberData.name} [Firestore only]`);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing team sales:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [teamId, isInitializing]);

  // Update sales when a client is added/updated/removed (memoized & optimized with debouncing)
  const updateSalesForClient = useCallback(async (
    clientChange: 'added' | 'updated' | 'removed',
    clientData: Client,
    oldClientData?: Client
  ) => {
    if (!currentUserId || !teamId) return;

    // Debounce updates - clear previous timeout and set new one
    const timeoutKey = `${currentUserId}-${clientChange}`;
    const existingTimeout = updateTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const newTimeout = setTimeout(async () => {
      try {
        // Get current sales data
        const salesDocRef = doc(db, 'teams', teamId, 'agentSales', currentUserId);
        const currentSalesDoc = await getDocs(query(
          collection(db, 'teams', teamId, 'agentSales'),
          where('__name__', '==', currentUserId)
        ));

        let currentSales = 0;
        let currentCount = 0;
        
        if (!currentSalesDoc.empty) {
          const currentData = currentSalesDoc.docs[0].data();
          currentSales = currentData.totalSales || 0;
          currentCount = currentData.clientCount || 0;
        }

        // Calculate the change
        let salesChange = 0;
        let countChange = 0;

        if (clientChange === 'added' && clientData.status === 'purchased') {
          salesChange = clientData.price;
          countChange = 1;
        } else if (clientChange === 'removed' && clientData.status === 'purchased') {
          salesChange = -clientData.price;
          countChange = -1;
        } else if (clientChange === 'updated' && oldClientData) {
          // Handle status changes
          const oldWasPurchased = oldClientData.status === 'purchased';
          const newIsPurchased = clientData.status === 'purchased';
          
          if (!oldWasPurchased && newIsPurchased) {
            // Changed to purchased
            salesChange = clientData.price;
            countChange = 1;
          } else if (oldWasPurchased && !newIsPurchased) {
            // Changed from purchased
            salesChange = -oldClientData.price;
            countChange = -1;
          } else if (oldWasPurchased && newIsPurchased) {
            // Both purchased, check price change
            salesChange = clientData.price - oldClientData.price;
          }
        }

        // Only update if there's an actual change
        if (salesChange !== 0 || countChange !== 0) {
          const newSales = Math.max(0, currentSales + salesChange);
          const newCount = Math.max(0, currentCount + countChange);

          await updateDoc(salesDocRef, {
            totalSales: newSales,
            clientCount: newCount,
            lastSaleDate: clientData.status === 'purchased' ? new Date(clientData.purchaseDate) : new Date(),
            updatedAt: new Date(),
          });

          console.log('✅ Updated sales for client change:', {
            change: clientChange,
            clientName: clientData.name,
            salesChange,
            countChange,
            newSales,
            newCount
          });
        } else {
          console.log('ℹ️ No sales impact for client change:', clientChange, clientData.name);
        }
      } catch (error) {
        console.error('Error updating sales for client:', error);
      }
      
      // Remove timeout from map after execution
      setUpdateTimeouts(prev => {
        const newMap = new Map(prev);
        newMap.delete(timeoutKey);
        return newMap;
      });
    }, 500); // 500ms debounce

    // Store timeout in map
    setUpdateTimeouts(prev => {
      const newMap = new Map(prev);
      newMap.set(timeoutKey, newTimeout);
      return newMap;
    });
  }, [currentUserId, teamId, updateTimeouts]);

  // Cleanup duplicate entries in team sales
  const cleanupDuplicates = useCallback(async () => {
    if (!teamId) return;
    
    // Prevent multiple simultaneous cleanup calls
    if (isCleaningUp) {
      return; // Skip silently if already cleaning up
    }
    
    setIsCleaningUp(true);

    try {
      const teamSalesRef = collection(db, 'teams', teamId, 'agentSales');
      const salesSnapshot = await getDocs(teamSalesRef);
      
      const agentSalesMap = new Map<string, any[]>();
      let duplicatesFound = false;
      
      // Group documents by agent ID
      salesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const agentId = data.id || doc.id;
        
        if (!agentSalesMap.has(agentId)) {
          agentSalesMap.set(agentId, []);
        }
        agentSalesMap.get(agentId)!.push({ docId: doc.id, data });
      });
      
      // Remove duplicates (keep the one with highest sales or most recent update)
      for (const [agentId, docs] of agentSalesMap.entries()) {
        if (docs.length > 1) {
          if (!duplicatesFound) {
            console.log('🧹 Found duplicate entries, cleaning up...');
            duplicatesFound = true;
          }
          
          console.log(`🔍 Agent ${docs[0].data.name}: ${docs.length} duplicates found`);
          
          // Sort by totalSales desc, then by updatedAt desc
          docs.sort((a, b) => {
            if (b.data.totalSales !== a.data.totalSales) {
              return b.data.totalSales - a.data.totalSales;
            }
            const aDate = a.data.updatedAt?.toDate() || new Date(0);
            const bDate = b.data.updatedAt?.toDate() || new Date(0);
            return bDate.getTime() - aDate.getTime();
          });
          
          // Keep the first (best) one, delete the rest
          const toKeep = docs[0];
          const toDelete = docs.slice(1);
          
          for (const duplicate of toDelete) {
            await deleteDoc(doc(db, 'teams', teamId, 'agentSales', duplicate.docId));
          }
          
          console.log(`✅ Kept best entry for ${toKeep.data.name} (${toKeep.data.totalSales} sales)`);
        }
      }
      
      if (duplicatesFound) {
        console.log('✅ Cleanup completed - duplicates removed');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      setIsCleaningUp(false);
    }
  }, [teamId, isCleaningUp]);

  // Remove agent from team sales when they're deleted
  const removeAgentFromTeamSales = useCallback(async (agentId: string) => {
    if (!teamId) return;

    try {
      // Remove from Firestore
      await deleteDoc(doc(db, 'teams', teamId, 'agentSales', agentId));
      
      // Remove from Realtime Database
      try {
        const livePerformanceRef = ref(rtdb, `teams/${teamId}/livePerformance/${agentId}`);
        await set(livePerformanceRef, null);
        console.log(`🗑️ Removed agent ${agentId} from team sales [Firestore + Realtime]`);
      } catch (realtimeError) {
        console.error('Error removing from Realtime Database:', realtimeError);
        console.log(`🗑️ Removed agent ${agentId} from team sales [Firestore only]`);
      }
    } catch (error) {
      console.error('Error removing agent from team sales:', error);
    }
  }, [teamId]);

  return {
    agentSalesData,
    loading,
    syncUserSales,
    initializeTeamSales,
    updateSalesForClient,
    cleanupDuplicates,
    removeAgentFromTeamSales,
  };
}; 
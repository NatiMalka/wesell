import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Client, PlanType, ClientStatus, PLAN_PRICES } from '../types';
import { useTeamSalesSync } from './useTeamSalesSync';
import { sendSaleNotification } from '../utils/notifications';

// Client management hook - ready for production use
export const useClients = (agentId: string, teamId: string = '', agentName: string = '') => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize team sales sync only if teamId exists
  const { updateSalesForClient, syncUserSales } = useTeamSalesSync(agentId, teamId || '');

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    console.log('🔄 Loading clients for agent:', agentId);

    // Set up real-time listener for agent's clients
    const clientsQuery = query(
      collection(db, 'clients'),
      where('agentId', '==', agentId)
    );

    const unsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      const loadedClients: Client[] = [];
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        loadedClients.push({
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

      console.log('✅ Loaded clients for agent:', agentId, 'count:', loadedClients.length);
      setClients(loadedClients);
      setLoading(false);
    }, (error) => {
      console.error('Error loading clients:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [agentId]);

  // Auto-sync sales data whenever clients change
  useEffect(() => {
    if (!loading && teamId && clients.length >= 0) {
      // Only log when there are purchased clients
      const purchasedCount = clients.filter(c => c.status === 'purchased').length;
      if (purchasedCount > 0) {
        console.log(`🔄 Auto-syncing sales: ${purchasedCount} purchased clients`);
      }
      syncUserSales(clients);
    }
  }, [clients, loading, teamId, agentId, syncUserSales]);

  const addClient = async (clientData: Omit<Client, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('➕ Adding new client:', clientData.name);
      
      const newClientData = {
        name: clientData.name,
        phone: clientData.phone,
        plan: clientData.plan,
        price: clientData.price,
        status: clientData.status,
        purchaseDate: clientData.purchaseDate,
        notes: clientData.notes || '',
        agentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to Firebase
      const docRef = await addDoc(collection(db, 'clients'), newClientData);
      
      const newClient: Client = {
        ...newClientData,
        id: docRef.id,
      };

      console.log('✅ Client added to Firebase:', newClient.id);
      
      // The real-time listener will update the local state automatically
      // Sync with team sales if teamId is provided
      if (teamId) {
        await updateSalesForClient('added', newClient);
        
        // Send sale notification to all team members if this is a purchase
        if (newClient.status === 'purchased' && agentName) {
          await sendSaleNotification(
            teamId,
            agentId,
            agentName,
            newClient.name,
            newClient.plan,
            newClient.price
          );
        }
      }
      
      return newClient;
    } catch (error) {
      console.error('Error adding client:', error);
      throw new Error('שגיאה בהוספת הלקוח');
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const oldClient = clients.find(client => client.id === id);
      if (!oldClient) {
        throw new Error('לקוח לא נמצא');
      }

      console.log('📝 Updating client:', oldClient.name);

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      // Update in Firebase
      await updateDoc(doc(db, 'clients', id), updateData);
      
      const updatedClient = { ...oldClient, ...updateData } as Client;
      console.log('✅ Client updated in Firebase:', id);
      
      // The real-time listener will update the local state automatically
      // Sync with team sales if teamId is provided
      if (teamId) {
        await updateSalesForClient('updated', updatedClient, oldClient);
        
        // Send sale notification if status changed to purchased
        if (oldClient.status !== 'purchased' && updatedClient.status === 'purchased' && agentName) {
          await sendSaleNotification(
            teamId,
            agentId,
            agentName,
            updatedClient.name,
            updatedClient.plan,
            updatedClient.price
          );
        }
      }
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error('שגיאה בעדכון הלקוח');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const clientToDelete = clients.find(client => client.id === id);
      if (!clientToDelete) {
        throw new Error('לקוח לא נמצא');
      }

      console.log('🗑️ Deleting client:', clientToDelete.name);

      // Delete from Firebase
      await deleteDoc(doc(db, 'clients', id));
      
      console.log('✅ Client deleted from Firebase:', id);
      
      // The real-time listener will update the local state automatically
      // Sync with team sales if teamId is provided
      if (teamId) {
        await updateSalesForClient('removed', clientToDelete);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      throw new Error('שגיאה במחיקת הלקוח');
    }
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
  };
};
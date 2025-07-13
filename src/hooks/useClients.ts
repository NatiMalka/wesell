import { useState, useEffect } from 'react';
import { Client, PlanType, ClientStatus, PLAN_PRICES } from '../types';

// Demo hook - replace with actual Firebase Firestore
export const useClients = (agentId: string) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo data
    const demoClients: Client[] = [
      {
        id: '1',
        name: 'משה לוי',
        phone: '052-1111111',
        plan: 'webinar_price',
        price: PLAN_PRICES.webinar_price,
        status: 'purchased',
        purchaseDate: new Date('2024-01-15'),
        notes: 'לקוח מעולה, מעוניין בהמשך',
        agentId,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        name: 'שרה אברהם',
        phone: '053-2222222',
        plan: 'full_top',
        price: PLAN_PRICES.full_top,
        status: 'purchased',
        purchaseDate: new Date('2024-01-20'),
        notes: 'רכשה את התוכנית המלאה',
        agentId,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: '3',
        name: 'דוד כהן',
        phone: '054-3333333',
        plan: 'webinar_price',
        price: PLAN_PRICES.webinar_price,
        status: 'considering',
        purchaseDate: new Date(),
        notes: 'מתלבט בין התוכניות',
        agentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    setTimeout(() => {
      setClients(demoClients);
      setLoading(false);
    }, 500);
  }, [agentId]);

  const addClient = async (clientData: Omit<Client, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      agentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id 
        ? { ...client, ...updates, updatedAt: new Date() }
        : client
    ));
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
  };
};
import { Client, BONUS_TIERS, MonthlyStats } from '../types';

export const calculateMonthlyStats = (clients: Client[]): MonthlyStats => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyClients = clients.filter(client => {
    const purchaseDate = new Date(client.purchaseDate);
    return purchaseDate.getMonth() === currentMonth && 
           purchaseDate.getFullYear() === currentYear &&
           client.status === 'purchased';
  });

  const totalSales = monthlyClients.reduce((sum, client) => sum + client.price, 0);
  const clientCount = monthlyClients.length;

  // Find current bonus tier
  let currentBonus = 0;
  let nextTierThreshold = BONUS_TIERS[0].threshold;
  let nextTierBonus = BONUS_TIERS[0].bonus;

  for (let i = 0; i < BONUS_TIERS.length; i++) {
    if (totalSales >= BONUS_TIERS[i].threshold) {
      currentBonus = BONUS_TIERS[i].bonus;
      if (i < BONUS_TIERS.length - 1) {
        nextTierThreshold = BONUS_TIERS[i + 1].threshold;
        nextTierBonus = BONUS_TIERS[i + 1].bonus;
      } else {
        nextTierThreshold = BONUS_TIERS[i].threshold;
        nextTierBonus = BONUS_TIERS[i].bonus;
      }
    } else {
      nextTierThreshold = BONUS_TIERS[i].threshold;
      nextTierBonus = BONUS_TIERS[i].bonus;
      break;
    }
  }

  const progressPercentage = Math.min((totalSales / nextTierThreshold) * 100, 100);

  return {
    totalSales,
    clientCount,
    currentBonus,
    nextTierThreshold,
    nextTierBonus,
    progressPercentage,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const getCurrentBonusTier = (totalSales: number) => {
  for (let i = BONUS_TIERS.length - 1; i >= 0; i--) {
    if (totalSales >= BONUS_TIERS[i].threshold) {
      return BONUS_TIERS[i];
    }
  }
  return null;
};
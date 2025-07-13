export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'agent' | 'manager';
  teamId?: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  plan: PlanType;
  price: number;
  status: ClientStatus;
  purchaseDate: Date;
  notes?: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PlanType = 'webinar_price' | 'full_price' | 'webinar_top' | 'full_top';

export type ClientStatus = 'purchased' | 'considering' | 'potential' | 'cancelled';

export interface BonusTier {
  threshold: number;
  bonus: number;
  name: string;
}

export interface MonthlyStats {
  totalSales: number;
  clientCount: number;
  currentBonus: number;
  nextTierThreshold: number;
  nextTierBonus: number;
  progressPercentage: number;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  agentIds: string[];
  createdAt: Date;
}

export const PLAN_PRICES: Record<PlanType, number> = {
  webinar_price: 1790,
  full_price: 1490,
  webinar_top: 5200,
  full_top: 7700,
};

export const PLAN_NAMES: Record<PlanType, string> = {
  webinar_price: 'תוכנית מחיר וובינר',
  full_price: 'תוכנית מחיר מלא',
  webinar_top: 'מחיר וובינר TOP',
  full_top: 'מחיר מלא TOP',
};

export const BONUS_TIERS: BonusTier[] = [
  { threshold: 50000, bonus: 1700, name: 'ברונזה' },
  { threshold: 60000, bonus: 2200, name: 'כסף' },
  { threshold: 70000, bonus: 2700, name: 'זהב' },
  { threshold: 80000, bonus: 3300, name: 'פלטינה' },
  { threshold: 90000, bonus: 4000, name: 'יהלום' },
  { threshold: 100000, bonus: 5600, name: 'מאסטר' },
  { threshold: 120000, bonus: 6600, name: 'גרנד מאסטר' },
];
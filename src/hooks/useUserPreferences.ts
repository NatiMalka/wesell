import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserPreferences } from '../types';

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  reportViewType: 'monthly',
  selectedYear: new Date().getFullYear(),
  clientSearchTerm: '',
  clientStatusFilter: 'all',
  lastActiveTab: 'dashboard',
  notificationEnabled: true,
  emailNotifications: true,
  dashboardLayout: 'detailed',
};

export const useUserPreferences = (userId: string) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user preferences from Firebase
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    console.log('🔄 Loading user preferences for:', userId);

    // Set up real-time listener for user preferences
    const preferencesRef = doc(db, 'userPreferences', userId);
    
    const unsubscribe = onSnapshot(preferencesRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const userPreferences: UserPreferences = {
          id: doc.id,
          userId: data.userId,
          reportViewType: data.reportViewType || DEFAULT_PREFERENCES.reportViewType,
          selectedYear: data.selectedYear || DEFAULT_PREFERENCES.selectedYear,
          clientSearchTerm: data.clientSearchTerm || DEFAULT_PREFERENCES.clientSearchTerm,
          clientStatusFilter: data.clientStatusFilter || DEFAULT_PREFERENCES.clientStatusFilter,
          lastActiveTab: data.lastActiveTab || DEFAULT_PREFERENCES.lastActiveTab,
          notificationEnabled: data.notificationEnabled ?? DEFAULT_PREFERENCES.notificationEnabled,
          emailNotifications: data.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications,
          dashboardLayout: data.dashboardLayout || DEFAULT_PREFERENCES.dashboardLayout,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        console.log('✅ Loaded user preferences:', userPreferences);
        setPreferences(userPreferences);
      } else {
        // Create default preferences if they don't exist
        console.log('🆕 Creating default preferences for user:', userId);
        await createDefaultPreferences();
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading user preferences:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Create default preferences
  const createDefaultPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const defaultPrefs: UserPreferences = {
        id: userId,
        userId,
        ...DEFAULT_PREFERENCES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'userPreferences', userId), defaultPrefs);
      console.log('✅ Created default preferences for user:', userId);
      setPreferences(defaultPrefs);
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  }, [userId]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!userId || !preferences) return;

    try {
      const updatedPrefs = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'userPreferences', userId), updatedPrefs);
      console.log('✅ Updated user preferences:', updates);
      
      // Update local state immediately for better UX
      setPreferences(prev => prev ? { ...prev, ...updatedPrefs } : null);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('שגיאה בעדכון ההעדפות');
    }
  }, [userId, preferences]);

  // Helper functions for common preference updates
  const setReportViewType = useCallback((viewType: 'monthly' | 'yearly') => {
    updatePreferences({ reportViewType: viewType });
  }, [updatePreferences]);

  const setSelectedYear = useCallback((year: number) => {
    updatePreferences({ selectedYear: year });
  }, [updatePreferences]);

  const setClientSearchTerm = useCallback((searchTerm: string) => {
    updatePreferences({ clientSearchTerm: searchTerm });
  }, [updatePreferences]);

  const setClientStatusFilter = useCallback((filter: 'all' | 'purchased' | 'considering' | 'potential' | 'cancelled') => {
    updatePreferences({ clientStatusFilter: filter });
  }, [updatePreferences]);

  const setLastActiveTab = useCallback((tab: string) => {
    updatePreferences({ lastActiveTab: tab });
  }, [updatePreferences]);

  const setNotificationEnabled = useCallback((enabled: boolean) => {
    updatePreferences({ notificationEnabled: enabled });
  }, [updatePreferences]);

  const setEmailNotifications = useCallback((enabled: boolean) => {
    updatePreferences({ emailNotifications: enabled });
  }, [updatePreferences]);

  const setDashboardLayout = useCallback((layout: 'compact' | 'detailed') => {
    updatePreferences({ dashboardLayout: layout });
  }, [updatePreferences]);

  return {
    preferences,
    loading,
    updatePreferences,
    // Helper functions
    setReportViewType,
    setSelectedYear,
    setClientSearchTerm,
    setClientStatusFilter,
    setLastActiveTab,
    setNotificationEnabled,
    setEmailNotifications,
    setDashboardLayout,
  };
}; 
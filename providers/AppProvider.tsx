import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import createContextHook from '@nkzw/create-context-hook';
import { firebaseService, UserData, AnalysisHistory } from '@/services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppContextType {
  // Auth state
  user: User | null;
  isAuthLoading: boolean;
  
  // User data
  userData: UserData | null;
  isUserDataLoading: boolean;
  
  // Analysis history
  analysisHistory: AnalysisHistory[];
  isHistoryLoading: boolean;
  
  // Pro status
  isPro: boolean;
  
  // Dark mode
  isDarkMode: boolean;
  
  // Quota properties
  scansUsed: number;
  weeklyLimit: number;
  isDeveloperMode: boolean;
  
  // Actions
  initializeApp: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshProStatus: () => Promise<void>;
  clearHistory: () => Promise<void>;
  mockPurchase: () => Promise<void>;
  setDarkMode: (value: boolean) => void;
  checkQuota: () => boolean;
  incrementScans: () => Promise<void>;
  addToHistory: (historyItem: { id: string; imageUri: string; analysis: any; timestamp: string }) => Promise<void>;
  
  // Local storage functions
  getLocalHistory: () => Promise<any[]>;
  clearLocalHistory: () => Promise<void>;
  saveToLocalStorage: (historyItem: { id: string; imageUri: string; analysis: any; timestamp: string }) => Promise<void>;
}

export const [AppProvider, useApp] = createContextHook<AppContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDeveloperMode] = useState(__DEV__);

  // Initialize app and Firebase auth
  const initializeApp = useCallback(async () => {
    try {
      console.log('Initializing app...');
      setIsAuthLoading(true);
      
      // Initialize Firebase auth (sign in anonymously if needed)
      const authenticatedUser = await firebaseService.initializeAuth();
      setUser(authenticatedUser);
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsUserDataLoading(true);
      const data = await firebaseService.getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setIsUserDataLoading(false);
    }
  }, [user]);

  // Refresh pro status
  const refreshProStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const proStatus = await firebaseService.checkProStatus(user.uid);
      setIsPro(proStatus);
    } catch (error) {
      console.error('Failed to refresh pro status:', error);
    }
  }, [user]);

  // Clear analysis history
  const clearHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      await firebaseService.clearAnalysisHistory(user.uid);
      setAnalysisHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }, [user]);

  // Mock purchase for development
  const mockPurchase = useCallback(async () => {
    try {
      const result = await firebaseService.mockGooglePlayPurchase();
      if (result.success) {
        setIsPro(true);
        await refreshUserData();
      }
    } catch (error) {
      console.error('Failed to mock purchase:', error);
      throw error;
    }
  }, [refreshUserData]);

  // Set up real-time listeners when user changes
  useEffect(() => {
    if (!user) {
      setUserData(null);
      setAnalysisHistory([]);
      setIsPro(false);
      return;
    }

    console.log('Setting up real-time listeners for user:', user.uid);

    // Listen to user data changes
    const unsubscribeUserData = firebaseService.onUserDataChange(user.uid, (data) => {
      if (data) {
        setUserData(data);
      }
      setIsUserDataLoading(false);
    });

    // Listen to analysis history changes
    const unsubscribeHistory = firebaseService.onAnalysisHistoryChange(user.uid, (history) => {
      setAnalysisHistory(history);
      setIsHistoryLoading(false);
    });

    // Check pro status initially
    refreshProStatus();

    return () => {
      unsubscribeUserData();
      unsubscribeHistory();
    };
  }, [user, refreshProStatus]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChange((authUser) => {
      setUser(authUser);
      if (!authUser) {
        setIsAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Check quota function
  const checkQuota = useCallback(() => {
    if (isPro) return true; // Pro users have unlimited scans
    const currentScansUsed = userData?.scansUsed || 0;
    const currentWeeklyLimit = userData?.weeklyLimit || 3;
    return currentScansUsed < currentWeeklyLimit;
  }, [isPro, userData?.scansUsed, userData?.weeklyLimit]);

  // Increment scans function
  const incrementScans = useCallback(async () => {
    if (!user) return;
    
    try {
      const currentScansUsed = userData?.scansUsed || 0;
      const newScansUsed = currentScansUsed + 1;
      await firebaseService.updateUserScans(user.uid, newScansUsed);
      console.log('Scans incremented to:', newScansUsed);
    } catch (error) {
      console.error('Failed to increment scans:', error);
      throw error;
    }
  }, [user, userData?.scansUsed]);

  // Local storage functions
  const saveToLocalStorage = useCallback(async (historyItem: { id: string; imageUri: string; analysis: any; timestamp: string }) => {
    try {
      const stored = await AsyncStorage.getItem('iris_analysis_history');
      const existingHistory = stored ? JSON.parse(stored) : [];
      const newHistory = [historyItem, ...existingHistory].slice(0, 50); // Keep only last 50 items
      await AsyncStorage.setItem('iris_analysis_history', JSON.stringify(newHistory));
      console.log('Analysis saved to local storage');
    } catch (error) {
      console.error('Failed to save to local storage:', error);
      throw error;
    }
  }, []);
  
  // Add to history function
  const addToHistory = useCallback(async (historyItem: { id: string; imageUri: string; analysis: any; timestamp: string }) => {
    try {
      if (user) {
        // Save to Firebase for authenticated users
        const imageStoragePath = await firebaseService.uploadImage(historyItem.imageUri, user.uid);
        await firebaseService.saveAnalysisToHistory(user.uid, {
          imageStoragePath,
          analysis: historyItem.analysis,
          timestamp: new Date(historyItem.timestamp)
        });
        console.log('Analysis saved to Firebase history');
      } else {
        // Save to local storage for anonymous users
        await saveToLocalStorage(historyItem);
      }
    } catch (error) {
      console.error('Failed to add to history:', error);
      // Try local storage as fallback even for authenticated users
      if (user) {
        try {
          await saveToLocalStorage(historyItem);
          console.log('Fallback: Analysis saved to local storage');
        } catch (fallbackError) {
          console.error('Fallback storage also failed:', fallbackError);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }, [user, saveToLocalStorage]);

  // Computed values
  const scansUsed = userData?.scansUsed || 0;
  const weeklyLimit = userData?.weeklyLimit || 3;

  return useMemo(() => ({
    user,
    isAuthLoading,
    userData,
    isUserDataLoading,
    analysisHistory,
    isHistoryLoading,
    isPro,
    isDarkMode,
    scansUsed,
    weeklyLimit,
    isDeveloperMode,
    initializeApp,
    refreshUserData,
    refreshProStatus,
    clearHistory,
    mockPurchase,
    setDarkMode: setIsDarkMode,
    checkQuota,
    incrementScans,
    addToHistory,
    getLocalHistory: async () => {
      try {
        const stored = await AsyncStorage.getItem('iris_analysis_history');
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Failed to get local history:', error);
        return [];
      }
    },
    clearLocalHistory: async () => {
      try {
        await AsyncStorage.removeItem('iris_analysis_history');
      } catch (error) {
        console.error('Failed to clear local history:', error);
        throw error;
      }
    },
    saveToLocalStorage
  }), [
    user,
    isAuthLoading,
    userData,
    isUserDataLoading,
    analysisHistory,
    isHistoryLoading,
    isPro,
    isDarkMode,
    scansUsed,
    weeklyLimit,
    isDeveloperMode,
    initializeApp,
    refreshUserData,
    refreshProStatus,
    clearHistory,
    mockPurchase,
    checkQuota,
    incrementScans,
    addToHistory,
    saveToLocalStorage
  ]);
});
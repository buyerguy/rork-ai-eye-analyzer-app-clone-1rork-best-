import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import createContextHook from '@nkzw/create-context-hook';
import { firebaseService, UserData, AnalysisHistory } from '@/services/firebaseService';

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
  
  // Actions
  initializeApp: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshProStatus: () => Promise<void>;
  clearHistory: () => Promise<void>;
  mockPurchase: () => Promise<void>;
  setDarkMode: (value: boolean) => void;
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

  return useMemo(() => ({
    user,
    isAuthLoading,
    userData,
    isUserDataLoading,
    analysisHistory,
    isHistoryLoading,
    isPro,
    isDarkMode,
    initializeApp,
    refreshUserData,
    refreshProStatus,
    clearHistory,
    mockPurchase,
    setDarkMode: setIsDarkMode
  }), [
    user,
    isAuthLoading,
    userData,
    isUserDataLoading,
    analysisHistory,
    isHistoryLoading,
    isPro,
    isDarkMode,
    initializeApp,
    refreshUserData,
    refreshProStatus,
    clearHistory,
    mockPurchase
  ]);
});
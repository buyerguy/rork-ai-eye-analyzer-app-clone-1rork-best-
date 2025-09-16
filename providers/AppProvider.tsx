import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { firebaseService, UserData } from "@/services/firebaseService";
import { Platform, Alert } from "react-native";

interface ScanHistory {
  id: string;
  imageUri: string;
  analysis: any;
  timestamp: string;
}

interface AppContextType {
  scansUsed: number;
  weeklyLimit: number;
  isDeveloperMode: boolean;
  scanHistory: ScanHistory[];
  userId: string | null;
  isOnline: boolean;
  isDarkMode: boolean;
  setDeveloperMode: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;
  incrementScans: () => void;
  checkQuota: () => boolean;
  addToHistory: (scan: ScanHistory) => void;
  clearHistory: () => void;
  resetWeeklyScans: () => void;
  syncWithFirebase: () => Promise<void>;
}

export const [AppProvider, useApp] = createContextHook<AppContextType>(() => {
  const [scansUsed, setScansUsed] = useState(0);
  const [weeklyLimit] = useState(3);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [lastResetDate, setLastResetDate] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    saveAppData();
  }, [scansUsed, isDeveloperMode, scanHistory, lastResetDate, isDarkMode]);

  const initializeApp = async () => {
    try {
      await loadAppData();
      await generateUserId();
      checkWeeklyReset();
      
      // Try to sync with Firebase if online
      if (Platform.OS === 'android') {
        // On Android, be more conservative with network requests
        console.log('Android detected - using offline-first mode');
        setIsOnline(false);
        
        // Try a simple connectivity test with manual timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch('https://toolkit.rork.com', {
            method: 'HEAD',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            setIsOnline(true);
            await syncWithFirebase();
          }
        } catch (networkError) {
          console.log('Network test failed on Android, staying offline:', networkError);
        }
      } else {
        // On other platforms, try normal sync
        try {
          await syncWithFirebase();
        } catch (error) {
          console.log('Firebase sync failed, working offline:', error);
          setIsOnline(false);
        }
      }
    } catch (error) {
      console.error('App initialization error:', error);
      // Continue with offline mode if initialization fails
      setIsOnline(false);
    }
  };

  const generateUserId = async () => {
    try {
      let storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        // Generate a unique user ID for anonymous users
        storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('userId', storedUserId);
      }
      setUserId(storedUserId);
    } catch (error) {
      console.error('Error generating user ID:', error);
    }
  };

  const syncWithFirebase = async () => {
    if (!userId) return;
    
    try {
      // Add timeout for Android
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firebase sync timeout')), 
          Platform.OS === 'android' ? 10000 : 15000);
      });
      
      const syncPromise = (async () => {
        // Try to get user data from Firebase
        let userData = await firebaseService.getUserData(userId);
        
        if (!userData) {
          // Create new user in Firebase
          await firebaseService.createUser(userId, `${userId}@anonymous.com`);
          userData = await firebaseService.getUserData(userId);
        }
        
        if (userData) {
          // Update local state with Firebase data
          setScansUsed(userData.scansUsed);
          setIsDeveloperMode(userData.isDeveloperMode);
          setLastResetDate(userData.lastResetDate);
          
          // Check for weekly reset
          await firebaseService.checkWeeklyReset(userId);
          setIsOnline(true);
        }
      })();
      
      await Promise.race([syncPromise, timeoutPromise]);
    } catch (error) {
      console.error('Firebase sync error:', error);
      setIsOnline(false);
      
      // On Android, don't show error alerts for network issues
      if (Platform.OS !== 'android' && error instanceof Error && 
          !error.message.includes('timeout') && 
          !error.message.includes('Failed to fetch')) {
        console.warn('Unexpected Firebase error:', error.message);
      }
    }
  };

  const loadAppData = async () => {
    try {
      const [scans, devMode, history, resetDate, darkMode] = await Promise.all([
        AsyncStorage.getItem("scansUsed"),
        AsyncStorage.getItem("isDeveloperMode"),
        AsyncStorage.getItem("scanHistory"),
        AsyncStorage.getItem("lastResetDate"),
        AsyncStorage.getItem("isDarkMode"),
      ]);

      if (scans) setScansUsed(parseInt(scans));
      if (devMode) setIsDeveloperMode(devMode === "true");
      if (history) setScanHistory(JSON.parse(history));
      if (resetDate) setLastResetDate(resetDate);
      if (darkMode !== null) setIsDarkMode(darkMode === "true");
    } catch (error) {
      console.error("Error loading app data:", error);
    }
  };

  const saveAppData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem("scansUsed", scansUsed.toString()),
        AsyncStorage.setItem("isDeveloperMode", isDeveloperMode.toString()),
        AsyncStorage.setItem("scanHistory", JSON.stringify(scanHistory)),
        AsyncStorage.setItem("lastResetDate", lastResetDate),
        AsyncStorage.setItem("isDarkMode", isDarkMode.toString()),
      ]);
    } catch (error) {
      console.error("Error saving app data:", error);
    }
  };

  const checkWeeklyReset = () => {
    const now = new Date();
    const lastReset = lastResetDate ? new Date(lastResetDate) : new Date(0);
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceReset >= 7) {
      resetWeeklyScansLocal();
    }
  };

  const setDeveloperModeLocal = async (value: boolean) => {
    setIsDeveloperMode(value);
    
    // Sync with Firebase if online
    if (isOnline && userId) {
      try {
        await firebaseService.toggleDeveloperMode(userId, value);
      } catch (error) {
        console.error('Failed to sync developer mode with Firebase:', error);
      }
    }
  };

  const incrementScansLocal = async () => {
    if (!isDeveloperMode) {
      const newScansUsed = scansUsed + 1;
      setScansUsed(newScansUsed);
      
      // Sync with Firebase if online
      if (isOnline && userId) {
        try {
          await firebaseService.updateUserScans(userId, newScansUsed);
        } catch (error) {
          console.error('Failed to sync scans with Firebase:', error);
        }
      }
    }
  };

  const resetWeeklyScansLocal = async () => {
    setScansUsed(0);
    setLastResetDate(new Date().toISOString());
    
    // Sync with Firebase if online
    if (isOnline && userId) {
      try {
        await firebaseService.resetWeeklyScans(userId);
      } catch (error) {
        console.error('Failed to sync weekly reset with Firebase:', error);
      }
    }
  };

  const checkQuota = () => {
    if (isDeveloperMode) return true;
    return scansUsed < weeklyLimit;
  };

  const addToHistory = (scan: ScanHistory) => {
    setScanHistory(prev => [scan, ...prev].slice(0, 50)); // Keep last 50 scans
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  const setDarkModeLocal = async (value: boolean) => {
    setIsDarkMode(value);
  };

  return {
    scansUsed,
    weeklyLimit,
    isDeveloperMode,
    scanHistory,
    userId,
    isOnline,
    isDarkMode,
    setDeveloperMode: setDeveloperModeLocal,
    setDarkMode: setDarkModeLocal,
    incrementScans: incrementScansLocal,
    checkQuota,
    addToHistory,
    clearHistory,
    resetWeeklyScans: resetWeeklyScansLocal,
    syncWithFirebase,
  };
});
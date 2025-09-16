import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';
import { Platform } from 'react-native';

export interface UserData {
  id: string;
  email: string;
  scansUsed: number;
  weeklyLimit: number;
  isDeveloperMode: boolean;
  lastResetDate: string;
  subscriptionStatus: 'free' | 'premium';
  createdAt: any;
  updatedAt: any;
}

export interface ScanRecord {
  id: string;
  userId: string;
  imageUrl: string;
  analysis: any;
  timestamp: any;
  deviceInfo: {
    platform: string;
    userAgent?: string;
  };
}

class FirebaseService {
  async createUser(userId: string, email: string): Promise<void> {
    try {
      const userData: Omit<UserData, 'id'> = {
        email,
        scansUsed: 0,
        weeklyLimit: 5,
        isDeveloperMode: false,
        lastResetDate: new Date().toISOString(),
        subscriptionStatus: 'free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', userId), userData);
      console.log('User created successfully:', userId);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  async updateUserScans(userId: string, scansUsed: number): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        scansUsed,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user scans:', error);
      throw error;
    }
  }

  async toggleDeveloperMode(userId: string, isDeveloperMode: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isDeveloperMode,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling developer mode:', error);
      throw error;
    }
  }

  async resetWeeklyScans(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        scansUsed: 0,
        lastResetDate: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resetting weekly scans:', error);
      throw error;
    }
  }

  async uploadImage(imageUri: string, userId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const filename = `iris-scans/${userId}/${timestamp}.jpg`;
      const imageRef = ref(storage, filename);

      let blob: Blob;
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        // For mobile, convert URI to blob
        const response = await fetch(imageUri);
        blob = await response.blob();
      }

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      
      console.log('Image uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async saveScanRecord(scanData: Omit<ScanRecord, 'id'>): Promise<string> {
    try {
      const scanRef = doc(collection(db, 'scans'));
      const scanRecord: ScanRecord = {
        id: scanRef.id,
        ...scanData,
        timestamp: serverTimestamp(),
        deviceInfo: {
          platform: Platform.OS,
          userAgent: Platform.OS === 'web' ? navigator.userAgent : undefined
        }
      };

      await setDoc(scanRef, scanRecord);
      console.log('Scan record saved:', scanRef.id);
      return scanRef.id;
    } catch (error) {
      console.error('Error saving scan record:', error);
      throw error;
    }
  }

  async getUserScanHistory(userId: string, limitCount: number = 50): Promise<ScanRecord[]> {
    try {
      const scansQuery = query(
        collection(db, 'scans'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(scansQuery);
      const scans: ScanRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        scans.push({ id: doc.id, ...doc.data() } as ScanRecord);
      });

      return scans;
    } catch (error) {
      console.error('Error getting scan history:', error);
      throw error;
    }
  }

  async checkWeeklyReset(userId: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(userId);
      if (!userData) return false;

      const now = new Date();
      const lastReset = new Date(userData.lastResetDate);
      const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceReset >= 7) {
        await this.resetWeeklyScans(userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking weekly reset:', error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
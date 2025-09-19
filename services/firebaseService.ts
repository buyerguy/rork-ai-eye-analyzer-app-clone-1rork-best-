import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { db, storage, auth } from './firebaseConfig';
import { Platform } from 'react-native';

export interface UserData {
  id: string;
  scansUsed: number;
  weeklyLimit: number;
  subscriptionStatus: 'free' | 'premium';
  subscriptionExpiry?: Date;
  purchaseToken?: string;
  productId?: string;
  lastVerified?: any;
  createdAt: any;
  updatedAt: any;
}

export interface AnalysisHistory {
  id: string;
  userId: string;
  imageStoragePath: string;
  analysis: any;
  timestamp: any;
}

export interface IrisAnalysis {
  pattern: {
    name: string;
    description: string;
    metrics?: {
      prevalence: string;
      regions: string;
      genetic: string;
    };
  };
  sensitivity: {
    name: string;
    description: string;
  };
  uniquePatterns: string[];
  rarity: {
    title: string;
    description: string;
    percentage: number;
  };
  additionalInsights: {
    icon: string;
    title: string;
    description: string;
  }[];
  summary: string;
}

class FirebaseService {
  private currentUser: User | null = null;
  private functions = getFunctions();
  
  constructor() {
    // Connect to functions emulator in development
    if (__DEV__ && Platform.OS !== 'web') {
      try {
        connectFunctionsEmulator(this.functions, 'localhost', 5001);
      } catch (error) {
        console.log('Functions emulator connection failed:', error);
      }
    }
  }
  
  // Initialize Firebase Auth and sign in anonymously
  async initializeAuth(): Promise<User> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            console.log('User already signed in:', user.uid);
            this.currentUser = user;
            await this.ensureUserDocument(user.uid);
            unsubscribe();
            resolve(user);
          } else {
            console.log('Signing in anonymously...');
            const userCredential = await signInAnonymously(auth);
            this.currentUser = userCredential.user;
            await this.ensureUserDocument(userCredential.user.uid);
            unsubscribe();
            resolve(userCredential.user);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          unsubscribe();
          reject(error);
        }
      });
    });
  }
  
  // Ensure user document exists
  private async ensureUserDocument(userId: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        const userData: Omit<UserData, 'id'> = {
          scansUsed: 0,
          weeklyLimit: 3, // Changed to 3 scans before paywall
          subscriptionStatus: 'free',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', userId), userData);
        console.log('User document created:', userId);
      }
    } catch (error) {
      console.error('Error ensuring user document:', error);
      throw error;
    }
  }
  
  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  // Monitor auth state changes
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      callback(user);
    });
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
  
  // Check if user is pro (has active subscription)
  async checkProStatus(userId: string): Promise<boolean> {
    try {
      if (!this.currentUser) return false;
      
      // Get fresh token to check custom claims
      const tokenResult = await this.currentUser.getIdTokenResult(true);
      const isPro = tokenResult.claims.isPro || false;
      const subscriptionExpiry = (tokenResult.claims.subscriptionExpiry as number) || 0;
      
      // Check if subscription is still valid
      const isActive = isPro && subscriptionExpiry > Date.now();
      
      return isActive;
    } catch (error) {
      console.error('Error checking pro status:', error);
      return false;
    }
  }

  async uploadImage(imageUri: string, userId: string): Promise<string> {
    try {
      // Validate input
      if (!imageUri || typeof imageUri !== 'string' || imageUri.trim().length === 0) {
        throw new Error('Invalid image URI provided');
      }
      
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('Invalid user ID provided');
      }
      
      const timestamp = Date.now();
      const imageId = `${timestamp}.jpg`;
      const storagePath = `user-uploads/${userId}/${imageId}`;
      const imageRef = ref(storage, storagePath);

      let blob: Blob;
      
      // Handle base64 data URIs
      if (imageUri.startsWith('data:')) {
        console.log('Converting base64 data URI to blob...');
        try {
          // Extract base64 data from data URI
          const base64Data = imageUri.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid base64 data URI format');
          }
          
          const mimeType = imageUri.split(';')[0].split(':')[1] || 'image/jpeg';
          
          // Convert base64 to binary
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          blob = new Blob([bytes], { type: mimeType });
          console.log('Base64 converted to blob, size:', blob.size, 'bytes');
          
          // Check blob size (limit to 10MB)
          if (blob.size > 10 * 1024 * 1024) {
            throw new Error('Image is too large (max 10MB)');
          }
        } catch (base64Error) {
          console.error('Base64 conversion error:', base64Error);
          throw new Error('Failed to process base64 image data');
        }
      } else {
        // Handle regular file URIs
        console.log('Fetching image from URI...');
        try {
          // Validate URI length (reasonable limit)
          if (imageUri.length > 10000) {
            throw new Error('Image URI is too long');
          }
          
          const response = await fetch(imageUri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          
          blob = await response.blob();
          console.log('Image fetched, size:', blob.size, 'bytes');
          
          // Check blob size (limit to 10MB)
          if (blob.size > 10 * 1024 * 1024) {
            throw new Error('Image is too large (max 10MB)');
          }
          
          // Validate blob type
          if (!blob.type.startsWith('image/')) {
            throw new Error('Invalid file type - must be an image');
          }
        } catch (fetchError) {
          console.error('Image fetch error:', fetchError);
          if (fetchError instanceof Error && fetchError.message.includes('too long')) {
            throw new Error('Image URI too long');
          }
          throw new Error('Failed to fetch image from URI');
        }
      }

      console.log('Uploading to Firebase Storage...');
      await uploadBytes(imageRef, blob);
      
      console.log('Image uploaded successfully to:', storagePath);
      return storagePath; // Return storage path instead of download URL
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('too long')) {
          throw new Error('Image URI too long');
        }
        if (error.message.includes('too large')) {
          throw new Error('Image is too large (max 10MB)');
        }
        if (error.message.includes('Invalid')) {
          throw error; // Re-throw validation errors as-is
        }
      }
      
      throw new Error('Failed to upload image');
    }
  }
  
  // Analyze iris using Cloud Function
  async analyzeIris(imageStoragePath: string): Promise<IrisAnalysis> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      console.log('Calling analyzeIris cloud function...');
      const analyzeIrisFunction = httpsCallable(this.functions, 'analyzeIris');
      const result = await analyzeIrisFunction({ imageStoragePath });
      
      console.log('Analysis completed successfully');
      return result.data as IrisAnalysis;
    } catch (error) {
      console.error('Error analyzing iris:', error);
      throw error;
    }
  }
  
  // Verify Google Play purchase
  async verifyGooglePlayPurchase(purchaseToken: string, productId: string): Promise<{ success: boolean; isPro: boolean; expiryTime: number }> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      console.log('Verifying Google Play purchase...');
      const verifyPurchaseFunction = httpsCallable(this.functions, 'verifyGooglePlayPurchase');
      const result = await verifyPurchaseFunction({ purchaseToken, productId });
      
      console.log('Purchase verified successfully');
      return result.data as { success: boolean; isPro: boolean; expiryTime: number };
    } catch (error) {
      console.error('Error verifying purchase:', error);
      throw error;
    }
  }

  // Get user's analysis history
  async getAnalysisHistory(userId: string, limitCount: number = 50): Promise<AnalysisHistory[]> {
    try {
      const historyQuery = query(
        collection(db, 'users', userId, 'history'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(historyQuery);
      const history: AnalysisHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as AnalysisHistory);
      });

      return history;
    } catch (error) {
      console.error('Error getting analysis history:', error);
      throw error;
    }
  }
  
  // Listen to user's analysis history in real-time
  onAnalysisHistoryChange(userId: string, callback: (history: AnalysisHistory[]) => void): () => void {
    const historyQuery = query(
      collection(db, 'users', userId, 'history'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    return onSnapshot(historyQuery, (snapshot) => {
      const history: AnalysisHistory[] = [];
      snapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as AnalysisHistory);
      });
      callback(history);
    });
  }
  
  // Clear user's analysis history
  async clearAnalysisHistory(userId: string): Promise<void> {
    try {
      const historyQuery = query(collection(db, 'users', userId, 'history'));
      const querySnapshot = await getDocs(historyQuery);
      
      // Delete documents one by one using deleteDoc
      const { deleteDoc } = await import('firebase/firestore');
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }
      
      console.log('Analysis history cleared for user:', userId);
    } catch (error) {
      console.error('Error clearing analysis history:', error);
      throw error;
    }
  }

  // Listen to user data changes in real-time
  onUserDataChange(userId: string, callback: (userData: UserData | null) => void): () => void {
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as UserData);
      } else {
        callback(null);
      }
    });
  }
  
  // Mock Google Play purchase for development (since we can't use real billing in Expo Go)
  // WARNING: This is for development only - remove in production
  async mockGooglePlayPurchase(): Promise<{ success: boolean; isPro: boolean; expiryTime: number }> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock purchases not allowed in production');
    }
    
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      console.log('Mock: Simulating Google Play purchase...');
      
      // Simulate successful purchase with 1 week expiry
      const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 1 week from now
      
      // Update user document directly (in real app, this would be done by cloud function)
      await updateDoc(doc(db, 'users', this.currentUser.uid), {
        subscriptionStatus: 'premium',
        subscriptionExpiry: new Date(expiryTime),
        purchaseToken: 'mock_token_' + Date.now(),
        productId: 'weekly_subscription',
        lastVerified: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Mock purchase completed successfully');
      return {
        success: true,
        isPro: true,
        expiryTime
      };
    } catch (error) {
      console.error('Error with mock purchase:', error);
      throw error;
    }
  }

  // Save analysis to history
  async saveAnalysisToHistory(userId: string, historyData: {
    imageStoragePath: string;
    analysis: any;
    timestamp: Date;
  }): Promise<void> {
    try {
      const historyRef = collection(db, 'users', userId, 'history');
      const docData = {
        userId,
        imageStoragePath: historyData.imageStoragePath,
        analysis: historyData.analysis,
        timestamp: historyData.timestamp
      };
      
      await setDoc(doc(historyRef), docData);
      console.log('Analysis saved to history for user:', userId);
    } catch (error) {
      console.error('Error saving analysis to history:', error);
      throw error;
    }
  }

  // Get download URL for image (for displaying in history)
  async getImageDownloadURL(storagePath: string): Promise<string> {
    try {
      const imageRef = ref(storage, storagePath);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
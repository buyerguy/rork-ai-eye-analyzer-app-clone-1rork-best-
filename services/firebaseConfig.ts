import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDCUfubbyWL01w1PWxQDzQGxkulbAcAxRE",
  authDomain: "onlyone-99913.firebaseapp.com",
  projectId: "onlyone-99913",
  storageBucket: "onlyone-99913.firebasestorage.app",
  messagingSenderId: "355889657524",
  appId: "1:355889657524:web:9854389af49862a0c789e1",
  measurementId: "G-Z6WMXCRJ9N"
};

// Check if Firebase app is already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDmCcvVXCC9QWm3B0MBpv7ujmqRPXufV28",
  authDomain: "daily-task-63644.firebaseapp.com",
  projectId: "daily-task-63644",
  storageBucket: "daily-task-63644.firebasestorage.app",
  messagingSenderId: "500278862567",
  appId: "1:500278862567:web:2d3b06a0c9c819f5e83842",
  measurementId: "G-4BETSRN29J"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Initialize Analytics safely
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;

// Firebase Configuration for Mushak Dash Leaderboard (Firestore)
// Modular Firebase JS SDK v9+ / v10+

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Replace the values below with your Firebase project credentials from the Firebase Console:
 * Project Settings -> General -> Your apps -> Web app -> Config
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAx9lBbI1jFcaCb1y6_kOmT-tttrZiKGY8",
  authDomain: "leaderboard7.firebaseapp.com",
  projectId: "leaderboard7",
  storageBucket: "leaderboard7.firebasestorage.app",
  messagingSenderId: "819545184172",
  appId: "1:819545184172:web:66f0d97f236a9054480c09",
  measurementId: "G-5JVWS4XBZE"
};

/**
 * Checks if Firebase has been configured with valid non-placeholder credentials.
 */
export const isFirebaseConfigured = () => {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    Boolean(firebaseConfig.projectId) &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
};

let app = null;
let db = null;

try {
  if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } else {
    // If not configured, initialize dummy/noop placeholder or allow lazy init
    // This allows the game to run seamlessly with friendly fallback states
  }
} catch (error) {
  console.warn('[Firebase] Initialization notice:', error.message);
}

export { app, db };

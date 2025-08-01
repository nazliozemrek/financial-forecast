// /backend/firebase.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Use environment variables or hardcoded test values (for server)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase once for the backend
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export only the db (you can add auth later if needed)
export { db };
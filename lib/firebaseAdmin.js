import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// ✅ Only initialize if not already initialized
if (!admin.apps.length) {
  // Decode base64 service account
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  if (!serviceAccountBase64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is required');
  }

  const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString());

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminDb = getFirestore();

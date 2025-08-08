import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, bankId } = req.body || {};

  if (!uid || !bankId) {
    return res.status(400).json({ error: 'Missing uid or bankId' });
  }

  try {
    console.log(`🗑️ Test disconnect: uid=${uid}, bankId=${bankId}`);
    
    // For now, just return success to test if the endpoint works
    return res.status(200).json({ 
      message: 'Bank disconnect test successful', 
      uid, 
      bankId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔥 Error in disconnect test:', error?.stack || error?.message || error);
    res.status(500).json({ error: 'Failed to disconnect bank', details: error?.message });
  }
}
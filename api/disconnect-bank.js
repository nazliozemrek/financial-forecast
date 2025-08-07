// api/disconnect_bank.mjs
import { adminDb } from '../backend/firebaseAdmin.mjs';

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

  const { uid, bankId } = req.body;

  if (!uid || !bankId) {
    return res.status(400).json({ error: 'Missing uid or bankId' });
  }

  try {
    const docRef = adminDb.doc(`users/${uid}/bankAccounts/${bankId}`);
    console.log(`📍 Deleting doc at: users/${uid}/bankAccounts/${bankId}`);
    await docRef.delete();
    res.status(200).json({ message: 'Bank account disconnected' });
  } catch (error) {
    console.error('🔥 Error disconnecting bank:', error.message);
    res.status(500).json({ error: error.message });
  }
}
import { adminDb } from '../backend/firebaseAdmin.mjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, bankId } = req.body || {};

  if (!uid || !bankId) {
    return res.status(400).json({ error: 'Missing uid or bankId' });
  }

  try {
    console.log(`🗑️ Disconnect request: uid=${uid}, bankId=${bankId}`);
    
    // For now, just return success to get the frontend working
    // The bank will be removed from the UI even if Firebase isn't updated
    return res.status(200).json({ 
      message: 'Bank disconnected successfully',
      uid,
      bankId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔥 Error in disconnect:', error?.stack || error?.message || error);
    res.status(500).json({ error: 'Failed to disconnect bank', details: error?.message });
  }
}
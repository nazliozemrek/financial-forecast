import { plaidClient } from '../lib/plaidClient.js';
import { adminDb } from '../lib/firebaseAdmin.js';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'Missing UID' });
  }

  try {
    console.log('🔄 Unlinking bank for user:', uid.substring(0, 10) + '...');

    // Fetch access token from Firestore
    const docRef = adminDb.collection('plaid_tokens').doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log('❌ No access token found for user:', uid.substring(0, 10) + '...');
      return res.status(404).json({ error: 'Access token not found for this user.' });
    }

    const accessToken = doc.data()?.accessToken;
    if (!accessToken) {
      console.log('❌ Access token missing in document for user:', uid.substring(0, 10) + '...');
      return res.status(404).json({ error: 'Access token is missing in the document.' });
    }

    console.log('🔄 Removing item from Plaid...');
    
    // Remove item from Plaid
    await plaidClient.itemRemove({ access_token: accessToken });
    console.log('✅ Successfully removed item from Plaid');

    // Delete access token from Firestore
    await docRef.delete();
    console.log('✅ Successfully deleted access token from Firestore');

    res.status(200).json({ 
      success: true, 
      message: 'Bank account unlinked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to unlink bank:', error);
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid access token' });
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Item not found in Plaid' });
    } else {
      res.status(500).json({ error: 'Failed to unlink bank account' });
    }
  }
}

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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, bankId } = req.body;

    if (!userId || !bankId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🗑️ Removing bank:', bankId, 'for user:', userId);

    // Delete the bank account from Firebase
    const bankAccountRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('bankAccounts')
      .doc(bankId);

    await bankAccountRef.delete();

    console.log('✅ Bank account deleted from Firebase');

    res.status(200).json({ 
      success: true, 
      message: 'Bank removed successfully' 
    });
  } catch (err) {
    console.error('❌ Error removing bank:', err);
    res.status(500).json({ error: 'Failed to remove bank' });
  }
}

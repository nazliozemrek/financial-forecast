const { adminDb } = require('../backend/firebaseAdmin.mjs');

module.exports = async function handler(req, res) {
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

    console.log('🗑️ Removing bank:', {
      bankId: bankId.substring(0, 10) + '...', // Log partial ID for security
      userId: userId.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

    // Delete the bank account from Firebase
    const bankAccountRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('bankAccounts')
      .doc(bankId);

    await bankAccountRef.delete();

    console.log('✅ Bank account deleted from Firebase:', bankAccountRef.path);

    res.status(200).json({ 
      success: true, 
      message: 'Bank removed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error removing bank:', err);
    
    // Categorize errors based on Plaid handbook
    if (err.code === 'permission-denied') {
      res.status(403).json({ error: 'Permission denied' });
    } else if (err.code === 'not-found') {
      res.status(404).json({ error: 'Bank account not found' });
    } else {
      res.status(500).json({ error: 'Failed to remove bank' });
    }
  }
};

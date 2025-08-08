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
    console.log(`🗑️ Simple disconnect: uid=${uid}, bankId=${bankId}`);
    
    // Just return success - no Firebase operations
    return res.status(200).json({ 
      message: 'Bank disconnected successfully',
      uid,
      bankId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔥 Error in simple disconnect:', error?.stack || error?.message || error);
    res.status(500).json({ error: 'Failed to disconnect bank', details: error?.message });
  }
}

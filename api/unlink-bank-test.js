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
    console.log('🔄 Test unlink bank for user:', uid.substring(0, 10) + '...');

    // For now, just return success without Firebase/Plaid
    res.status(200).json({ 
      success: true, 
      message: 'Bank account unlinked successfully (test version)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to unlink bank:', error);
    res.status(500).json({ error: 'Failed to unlink bank account' });
  }
}

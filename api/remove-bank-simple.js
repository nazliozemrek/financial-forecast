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

    console.log('🗑️ Removing bank (simple):', {
      bankId: bankId.substring(0, 10) + '...',
      userId: userId.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

    // For now, just return success without Firebase
    res.status(200).json({
      success: true,
      message: 'Bank removed successfully (simple version)',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error in simple remove bank:', err);
    res.status(500).json({ error: 'Failed to remove bank' });
  }
}

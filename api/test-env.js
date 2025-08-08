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

  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    
    res.status(200).json({
      success: true,
      hasServiceAccount: !!serviceAccountBase64,
      serviceAccountLength: serviceAccountBase64 ? serviceAccountBase64.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Environment test failed:', error);
    res.status(500).json({ 
      error: 'Environment test failed',
      message: error.message 
    });
  }
}

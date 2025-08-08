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

  try {
    res.status(200).json({
      message: 'Simple API test is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      body: req.body || 'No body'
    });
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({ error: 'Test API failed' });
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  res.status(200).json({
    success: true,
    hasServiceAccount: !!serviceAccountBase64,
    serviceAccountLength: serviceAccountBase64 ? serviceAccountBase64.length : 0,
    timestamp: new Date().toISOString()
  });
}

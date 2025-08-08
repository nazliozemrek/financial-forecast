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

  try {
    console.log('🔄 Testing Firebase Admin connection...');
    
    // Test if we can access Firestore
    const testDoc = adminDb.collection('test').doc('test');
    await testDoc.set({ timestamp: new Date() });
    console.log('✅ Successfully wrote to Firestore');
    
    res.status(200).json({
      success: true,
      message: 'Firebase Admin is working!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Firebase Admin test failed:', error);
    res.status(500).json({ 
      error: 'Firebase Admin test failed',
      message: error.message 
    });
  }
}

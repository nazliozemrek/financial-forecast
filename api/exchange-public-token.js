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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { public_token, userId, institution } = req.body;

    if (!public_token || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Body:', {
      public_token: public_token.substring(0, 20) + '...',
      userId,
      institution: institution?.name || 'Unknown',
      institution_id: institution?.institution_id || 'Unknown'
    });

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    console.log('✅ Got access token:', accessToken.substring(0, 20) + '...');
    console.log('✅ Item ID:', itemId);

    // Save to Firebase - using the new structure
    const docRef = adminDb.collection('plaid_tokens').doc(userId);
    await docRef.set({
      accessToken,
      itemId,
      institution: institution || {},
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      accessToken,
      itemId,
    });
  } catch (err) {
    console.error('Plaid API Error:', err.response?.data);
    
    if (err.response?.status === 400) {
      res.status(400).json({ error: 'Invalid public token' });
    } else if (err.response?.status === 401) {
      res.status(401).json({ error: 'Plaid authentication failed' });
    } else if (err.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ error: 'Failed to exchange token' });
    }
  }
}
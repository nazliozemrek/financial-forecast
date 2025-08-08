const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const dotenv = require('dotenv');
const { adminDb } = require('../backend/firebaseAdmin.js');

dotenv.config();

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);

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
    const { public_token, userId, institution } = req.body;

    if (!public_token || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🔥 /exchange_public_token hit!');
    console.log('Body:', { 
      public_token: public_token.substring(0, 20) + '...', // Log partial token for security
      userId, 
      institution: institution?.name || 'Unknown',
      institution_id: institution?.institution_id || 'Unknown'
    });

    // Exchange public token for access token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    console.log('✅ Got access token:', accessToken.substring(0, 20) + '...');
    console.log('✅ Item ID:', itemId);

    // Save access token to Firebase (via shared Admin instance)
    const bankAccountRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('bankAccounts')
      .doc();
    await bankAccountRef.set({
      accessToken,
      itemId,
      institution: institution || {},
      createdAt: new Date(),
    });

    console.log('✅ Saved access token to', bankAccountRef.path);

    res.status(200).json({ 
      success: true, 
      accessToken,
      itemId,
      bankAccountId: bankAccountRef.id 
    });
  } catch (err) {
    console.error('❌ Error exchanging token:', err);
    
    // Log specific Plaid error details
    if (err.response?.data) {
      console.error('Plaid API Error:', err.response.data);
    }
    
    // Return more specific error messages based on Plaid handbook
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
};
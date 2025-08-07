const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config();

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
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId in request body' });
    }

    const response = await plaidClient.linkTokenCreate({
      user: { 
        client_user_id: userId, 
      },
      client_name: 'Financial Forecast',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });

    res.status(200).json({ link_token: response.data.link_token });
  } catch (err) {
    console.error("PLAID ERROR:", err.response?.data || err.message || err);
    res.status(500).json({ error: 'Unable to create link token' });
  }
};
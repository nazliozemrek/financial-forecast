// api/exchange_public_token.mjs
import express from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';

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
const router = express.Router();

router.post('/exchange-public-token', async (req, res) => {
  try {
    const { public_token } = req.body;
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;

    // Save access_token securely in a DB — here we just return it for test
    res.json({ access_token });
    localStorage.setItem('access_token',response.access_token);
    setAccessToken(response.access_token);
  } catch (error) {
    console.error('Failed to exchange token:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

export default router;
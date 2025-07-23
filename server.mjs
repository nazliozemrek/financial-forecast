// server.mjs
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import createLinkTokenRouter from './api/create_link_token.mjs';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔧 Setup Plaid client once
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

// 🔁 Attach routes
app.use('/api', createLinkTokenRouter);

// 🔐 Exchange public token for access token
app.post('/api/exchange-token', async (req, res) => {
  const { public_token } = req.body;

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;

    console.log('✅ Access Token:', access_token);
    res.json({ access_token });
  } catch (error) {
    console.error('❌ Exchange failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// 🚀 Start the server
app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});

app.post('/api/transactions', async (req, res) => {
  const { access_token } = req.body;

  try {
    const response = await plaidClient.transactionsGet({
      access_token,
      start_date: '2024-01-01', // adjust this to what you want
      end_date: '2025-12-31',   // today
    });

    res.json(response.data.transactions);
  } catch (error) {
    console.error('❌ Fetch transactions failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});
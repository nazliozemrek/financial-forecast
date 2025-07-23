import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import createLinkTokenRouter from '../api/create_link_token.mjs';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path:path.resolve(__dirname,'../.env')});


const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

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

app.post('/api/transactions', async (req, res) => {
  const { access_token } = req.body;

  try {
    const response = await plaidClient.transactionsGet({
      access_token,
      start_date: '2024-01-01',
      end_date: '2025-12-31',
    });

    res.json(response.data.transactions);
  } catch (error) {
    console.error('❌ Fetch transactions failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/disconnect', async (req, res) => {
  const { access_token } = req.body;

  if (!access_token) {
    console.error('❌ No access_token provided in request body');
    return res.status(400).json({ error: 'Missing access_token' });
  }

  try {
    await plaidClient.itemRemove({ access_token });
    console.log(`🔌 Disconnected access_token`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Disconnection failed:', {
      message: error.message,
      data: error.response?.data,
      status: error.response?.status,
    });
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
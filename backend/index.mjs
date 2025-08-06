import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import createLinkTokenRouter from '../api/create_link_token.mjs';
import saveBankInfoRouter from '../api/save_bank_info.mjs';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import exchangePublicTokenRouter from '../api/exchange_public_token.mjs';
import fetchInstitutionInfo from '../api/fetch_institution_info.mjs';
import disconnectBankRouter from '../api/disconnect_bank.mjs';
import admin from 'firebase-admin';

const serviceAccountBuffer = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64');

let serviceAccountJson;
try {
  serviceAccountJson = JSON.parse(serviceAccountBuffer.toString('utf8'));
} catch (err) {
  console.error('❌ Failed to parse Firebase service account:', err);
}

if (!admin.apps.length && serviceAccountJson) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
  });
}


const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path:path.resolve(__dirname,'../.env')});


const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());
app.use('/api',disconnectBankRouter);



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
app.use('/api', exchangePublicTokenRouter);
app.use('/api', saveBankInfoRouter);
app.use('/api', fetchInstitutionInfo);



// 🔐 Exchange public token for access token


app.post('/api/transactions', async (req, res) => {
  const { access_token } = req.body;
  let retries = 0;

  while (retries < 5) {
    try {
      const response = await plaidClient.transactionsGet({
        access_token,
        start_date: '2024-01-01',
        end_date: '2025-12-31',
      });

      const txs = response.data.transactions;
      if (Array.isArray(txs)) {
        console.log(`✅ [Plaid] Transactions fetched: ${txs.length}`);
        return res.json({
          transactions: txs,
          fetchedCount: txs.length,
          status: 'success',
          note: `Fetched ${txs.length} transactions`,
        });
      }

      console.warn('⚠️ transactions not an array:', txs);
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.error_code === 'PRODUCT_NOT_READY') {
        console.warn(`🔁 Retry ${retries + 1}: PRODUCT_NOT_READY`);
      } else {
        console.error("❌ Unexpected Error:", errorData || error.message);
        return res.status(500).json({
          error: errorData || error.message,
          status: 'error',
          note: 'Unexpected error while fetching transactions'
        });
      }
    }

    await new Promise(r => setTimeout(r, 3000));
    retries++;
  }

  return res.status(500).json({
    error: 'Timeout waiting for transactions to be ready.',
    status: 'timeout',
    note: 'Max retries reached without success',
  });
});

app.post('/api/plaid/recurring', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'Missing access_token' });
  try {
    const response = await plaidClient.transactionsRecurringGet({ access_token });
    res.json({ recurring_transactions: response.data.recurring_transactions || [] });
  } catch (err) {
    console.error('❌ Error fetching recurring transactions:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
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
app.get('/api/get_access_token', async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'Missing uid' });

  try {
    const snapshot = await admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('bankAccounts')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No bank account found' });
    }

    const accessToken = snapshot.docs[0].data().access_token;
    if (!accessToken) {
      return res.status(404).json({ error: 'No access token found' });
    }

    res.json({ access_token: accessToken });
  } catch (err) {
    console.error('❌ get_access_token error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
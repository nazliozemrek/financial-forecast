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
    if(Array.isArray(txs)){
      console.log(`Transactions fetched:${txs.length}`);
      return res.json({transactions: txs});
    }
    console.warn('transactions not an array; retrying',txs);
     } catch (error) {
      const errorData = error.response?.data;
      if(errorData?.error_code === 'PRODUCT_NOT_READY'){
        console.warn(`Attempt ${retries+1}: PRODUCT_NOT_READY`);
      } else {
        return res.status(500).json({ error:errorData || error.message});
      }
  }
  await new Promise(r => setTimeout(r,3000));
  retries ++;
  }
  return res.status(500).json({error:'Timet out waiting for transactions to be ready.'})
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
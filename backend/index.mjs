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

// 🔐 Secure transaction fetching with temporary token handling
app.post('/api/transactions', async (req, res) => {
  const { access_token, userId, institutionId } = req.body;
  
  if (!access_token) {
    return res.status(400).json({ 
      error: 'Access token required',
      status: 'error',
      note: 'Secure token handling required'
    });
  }

  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      // 🔒 SECURITY: Use token only for this request, don't store it
      const response = await plaidClient.transactionsGet({
        access_token,
        start_date: '2024-01-01',
        end_date: '2025-12-31',
      });

      const txs = response.data.transactions;
      if (Array.isArray(txs)) {
        // 🔒 SECURITY: Sanitize transaction data before sending to client
        const sanitizedTransactions = txs.map(tx => ({
          // ✅ Safe to send: Transaction metadata
          transaction_id: tx.transaction_id,
          name: tx.name,
          amount: tx.amount,
          date: tx.date,
          category: tx.category,
          category_id: tx.category_id,
          pending: tx.pending,
          account_id: tx.account_id,
          // ❌ NOT sent: account_owner, check_number, payment_channel, etc.
          // ❌ NOT sent: raw descriptions, account numbers, sensitive metadata
        }));

        console.log(`✅ [Plaid] Transactions fetched securely: ${sanitizedTransactions.length}`);
        return res.json({
          transactions: sanitizedTransactions,
          fetchedCount: sanitizedTransactions.length,
          status: 'success',
          note: `Fetched ${sanitizedTransactions.length} transactions securely`,
          security: 'No sensitive data stored or transmitted'
        });
      }

      console.warn('⚠️ transactions not an array:', txs);
      return res.status(500).json({
        error: 'Invalid transaction data format',
        status: 'error',
        note: 'Data format error'
      });
    } catch (error) {
      const errorData = error.response?.data;
      
      if (errorData?.error_code === 'PRODUCT_NOT_READY') {
        console.warn(`🔁 Retry ${retries + 1}: PRODUCT_NOT_READY`);
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
      } else if (errorData?.error_code === 'ITEM_LOGIN_REQUIRED') {
        console.error('❌ Bank login required - user needs to reconnect');
        return res.status(401).json({
          error: 'Bank login required',
          status: 'error',
          note: 'Please reconnect your bank account',
          requiresReconnection: true
        });
      } else if (errorData?.error_code === 'INVALID_ACCESS_TOKEN') {
        console.error('❌ Invalid access token');
        return res.status(401).json({
          error: 'Invalid access token',
          status: 'error',
          note: 'Please reconnect your bank account',
          requiresReconnection: true
        });
      }
      
      console.error("❌ Unexpected Error:", errorData || error.message);
      return res.status(500).json({
        error: 'Transaction fetch failed',
        status: 'error',
        note: 'Please try again later'
      });
    }
  }

  return res.status(500).json({
    error: 'Max retries exceeded',
    status: 'error',
    note: 'Please try again later'
  });
});

// 🔒 SECURITY: Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    security: 'No sensitive data stored',
    environment: process.env.PLAID_ENV || 'sandbox',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security: No sensitive data stored in database`);
  console.log(`🌍 Environment: ${process.env.PLAID_ENV || 'sandbox'}`);
});
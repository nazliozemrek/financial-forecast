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
        return res.status(200).json({
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
}

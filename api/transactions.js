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

  try {
    const { accessToken, startDate, endDate } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing access token' });
    }

    // Fetch transactions with retries
    let transactions = [];
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
        });

        transactions = response.data.transactions;
        break;
      } catch (err) {
        retries++;
        console.log(`🔁 Retry ${retries}: ${err.response?.data?.error_code || err.message}`);
        
        if (retries >= maxRetries) {
          throw err;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // Sanitize transactions before sending to client
    const sanitizedTransactions = transactions.map(transaction => ({
      id: transaction.transaction_id,
      name: transaction.name,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.category,
      pending: transaction.pending,
      account_id: transaction.account_id,
      // Don't include sensitive fields like account_number, etc.
    }));

    res.status(200).json({ transactions: sanitizedTransactions });
  } catch (err) {
    console.error('❌ Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

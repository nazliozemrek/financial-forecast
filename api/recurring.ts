// api/recurring.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const config = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
});

const plaidClient = new PlaidApi(config);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Missing access token' });
    }

    const response = await plaidClient.transactionsRecurringGet({ access_token: accessToken });

    res.status(200).json({
      recurring: response.data.recurring_transactions,
    });
  } catch (err) {
    console.error('❌ Error fetching recurring transactions:', err);
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
}
import { plaidClient } from '../lib/plaidClient.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const accessToken = body.accessToken || body.access_token;

    const endDate = body.endDate || new Date().toISOString().slice(0, 10);
    const startDate = body.startDate || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    if (!accessToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing access token' }),
      };
    }

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
        if (retries >= maxRetries) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    const sanitizedTransactions = transactions.map(transaction => ({
      id: transaction.transaction_id,
      name: transaction.name,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.category,
      pending: transaction.pending,
      account_id: transaction.account_id,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ transactions: sanitizedTransactions }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch transactions' }),
    };
  }
};

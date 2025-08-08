import { plaidClient } from '../lib/plaidClient.js';
import { adminDb } from '../lib/firebaseAdmin.js';

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

  try {
    console.log('🔄 Debug transactions endpoint called');
    
    const body = JSON.parse(event.body);
    console.log('📝 Request body:', {
      hasAccessToken: !!body.accessToken,
      hasAccess_token: !!body.access_token,
      accessTokenLength: body.accessToken?.length || 0,
      access_tokenLength: body.access_token?.length || 0
    });

    const accessToken = body.accessToken || body.access_token;

    if (!accessToken) {
      console.log('❌ No access token provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing access token',
          debug: 'No access token in request body'
        }),
      };
    }

    console.log('✅ Access token found, length:', accessToken.length);

    const endDate = body.endDate || new Date().toISOString().slice(0, 10);
    const startDate = body.startDate || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    console.log('📅 Date range:', { startDate, endDate });

    // Test Plaid client
    console.log('🔄 Testing Plaid client...');
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    console.log('✅ Plaid API call successful');
    console.log('📊 Transactions count:', response.data.transactions?.length || 0);

    const transactions = response.data.transactions || [];
    const sanitizedTransactions = transactions.map(transaction => ({
      id: transaction.transaction_id,
      name: transaction.name,
      amount: transaction.amount,
      date: transaction.date,
      category: transaction.category,
      pending: transaction.pending,
      account_id: transaction.account_id,
    }));

    console.log('✅ Returning sanitized transactions');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        transactions: sanitizedTransactions,
        debug: {
          originalCount: transactions.length,
          sanitizedCount: sanitizedTransactions.length,
          hasTransactions: transactions.length > 0
        }
      }),
    };
  } catch (err) {
    console.error('❌ Transactions debug error:', err);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch transactions',
        debug: {
          message: err.message,
          stack: err.stack,
          response: err.response?.data
        }
      }),
    };
  }
};

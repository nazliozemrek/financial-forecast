import { plaidClient } from '../lib/plaidClient.js';

export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { userId } = body;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userId in request body' }),
      };
    }

    console.log('🔄 Creating link token for user:', userId.substring(0, 10) + '...');

    const response = await plaidClient.linkTokenCreate({
      user: { 
        client_user_id: userId, 
      },
      client_name: 'Financial Forecast',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings'],
        },
      },
    });

    console.log('✅ Link token created successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ link_token: response.data.link_token }),
    };
  } catch (err) {
    console.error("❌ PLAID ERROR:", err.response?.data || err.message || err);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Unable to create link token' }),
    };
  }
};
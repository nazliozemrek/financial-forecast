import { plaidClient } from '../lib/plaidClient.js';
import { adminDb } from '../lib/firebaseAdmin.js';

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
    const { public_token, userId, institution } = body;

    if (!public_token || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('Body:', {
      public_token: public_token.substring(0, 20) + '...',
      userId,
      institution: institution?.name || 'Unknown',
      institution_id: institution?.institution_id || 'Unknown'
    });

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    console.log('✅ Got access token:', accessToken.substring(0, 20) + '...');
    console.log('✅ Item ID:', itemId);

    // Save to Firebase - using the new structure
    const docRef = adminDb.collection('plaid_tokens').doc(userId);
    await docRef.set({
      accessToken,
      itemId,
      institution: institution || {},
      createdAt: new Date(),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        accessToken,
        itemId,
      }),
    };
  } catch (err) {
    console.error('Plaid API Error:', err.response?.data);
    
    if (err.response?.status === 400) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid public token' }),
      };
    } else if (err.response?.status === 401) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Plaid authentication failed' }),
      };
    } else if (err.response?.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to exchange token' }),
      };
    }
  }
};
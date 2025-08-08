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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { uid } = body;
    
    if (!uid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing UID' }),
      };
    }

    console.log('🔄 Unlinking bank for user:', uid.substring(0, 10) + '...');

    // Fetch access token from Firestore
    const docRef = adminDb.collection('plaid_tokens').doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log('❌ No access token found for user:', uid.substring(0, 10) + '...');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Access token not found for this user.' }),
      };
    }

    const accessToken = doc.data()?.accessToken;
    if (!accessToken) {
      console.log('❌ Access token missing in document for user:', uid.substring(0, 10) + '...');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Access token is missing in the document.' }),
      };
    }

    console.log('🔄 Removing item from Plaid...');
    
    // Remove item from Plaid
    await plaidClient.itemRemove({ access_token: accessToken });
    console.log('✅ Successfully removed item from Plaid');

    // Delete access token from Firestore
    await docRef.delete();
    console.log('✅ Successfully deleted access token from Firestore');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Bank account unlinked successfully',
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('❌ Failed to unlink bank:', error);
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid access token' }),
      };
    } else if (error.response?.status === 404) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Item not found in Plaid' }),
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to unlink bank account' }),
      };
    }
  }
};

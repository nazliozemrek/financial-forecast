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

    // Try to find access token in different possible locations
    let accessToken = null;
    let docRef = null;

    // First, try the new structure (plaid_tokens collection)
    const plaidTokensRef = adminDb.collection('plaid_tokens').doc(uid);
    const plaidTokensDoc = await plaidTokensRef.get();
    
    if (plaidTokensDoc.exists) {
      const data = plaidTokensDoc.data();
      accessToken = data.accessToken;
      docRef = plaidTokensRef;
      console.log('✅ Found access token in plaid_tokens collection');
    } else {
      // Try the old structure (users/bankAccounts collection)
      const bankAccountsRef = adminDb.collection('users').doc(uid).collection('bankAccounts');
      const bankAccountsSnapshot = await bankAccountsRef.get();
      
      if (!bankAccountsSnapshot.empty) {
        const firstBank = bankAccountsSnapshot.docs[0];
        const data = firstBank.data();
        accessToken = data.accessToken;
        docRef = firstBank.ref;
        console.log('✅ Found access token in users/bankAccounts collection');
      }
    }

    if (!accessToken) {
      console.log('❌ No access token found for user:', uid.substring(0, 10) + '...');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Access token not found for this user.' }),
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

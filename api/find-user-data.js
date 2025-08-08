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
    const body = JSON.parse(event.body);
    const { uid } = body;
    
    if (!uid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing UID' }),
      };
    }

    console.log('🔍 Searching for user data:', uid.substring(0, 10) + '...');

    // Search in plaid_tokens collection
    const plaidTokensRef = adminDb.collection('plaid_tokens').doc(uid);
    const plaidTokensDoc = await plaidTokensRef.get();
    
    let plaidTokensData = null;
    if (plaidTokensDoc.exists) {
      plaidTokensData = plaidTokensDoc.data();
    }

    // Search in users/bankAccounts collection
    const bankAccountsRef = adminDb.collection('users').doc(uid).collection('bankAccounts');
    const bankAccountsSnapshot = await bankAccountsRef.get();
    
    let bankAccountsData = [];
    if (!bankAccountsSnapshot.empty) {
      bankAccountsData = bankAccountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    // Search in users collection
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    let userData = null;
    if (userDoc.exists) {
      userData = userDoc.data();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        uid: uid.substring(0, 10) + '...',
        plaidTokens: {
          exists: plaidTokensDoc.exists,
          hasAccessToken: !!plaidTokensData?.accessToken,
          data: plaidTokensData ? {
            hasAccessToken: !!plaidTokensData.accessToken,
            hasItemId: !!plaidTokensData.itemId,
            hasInstitution: !!plaidTokensData.institution,
            createdAt: plaidTokensData.createdAt
          } : null
        },
        bankAccounts: {
          count: bankAccountsData.length,
          data: bankAccountsData.map(account => ({
            id: account.id,
            hasAccessToken: !!account.accessToken,
            hasInstitution: !!account.institution,
            createdAt: account.createdAt
          }))
        },
        user: {
          exists: userDoc.exists,
          data: userData ? {
            hasDisplayName: !!userData.displayName,
            hasEmail: !!userData.email,
            createdAt: userData.createdAt
          } : null
        },
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('❌ Find user data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

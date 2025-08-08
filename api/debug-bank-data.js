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
    console.log('🔄 Debug bank data endpoint called');
    
    const body = JSON.parse(event.body);
    const { uid } = body;
    
    if (!uid) {
      console.log('❌ No UID provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing UID',
          debug: 'No UID in request body'
        }),
      };
    }

    console.log('🔍 Searching for bank data for UID:', uid.substring(0, 10) + '...');

    // Check plaid_tokens collection
    const plaidTokensRef = adminDb.collection('plaid_tokens').doc(uid);
    const plaidTokensDoc = await plaidTokensRef.get();
    
    let plaidTokensData = null;
    if (plaidTokensDoc.exists) {
      plaidTokensData = plaidTokensDoc.data();
      console.log('✅ Found data in plaid_tokens collection');
    } else {
      console.log('❌ No data in plaid_tokens collection');
    }

    // Check users/bankAccounts collection
    const bankAccountsRef = adminDb.collection('users').doc(uid).collection('bankAccounts');
    const bankAccountsSnapshot = await bankAccountsRef.get();
    
    let bankAccountsData = [];
    if (!bankAccountsSnapshot.empty) {
      bankAccountsData = bankAccountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Found', bankAccountsData.length, 'bank accounts in users/bankAccounts collection');
    } else {
      console.log('❌ No data in users/bankAccounts collection');
    }

    // Check users collection
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    let userData = null;
    if (userDoc.exists) {
      userData = userDoc.data();
      console.log('✅ Found user data in users collection');
    } else {
      console.log('❌ No data in users collection');
    }

    // Simulate the frontend bank data structure
    const bankConnections = [];
    
    if (plaidTokensData?.accessToken) {
      bankConnections.push({
        id: 'plaid_tokens',
        accessToken: plaidTokensData.accessToken,
        institution: plaidTokensData.institution || {},
        createdAt: plaidTokensData.createdAt
      });
    }

    bankAccountsData.forEach(account => {
      if (account.accessToken) {
        bankConnections.push({
          id: account.id,
          accessToken: account.accessToken,
          institution: account.institution || {},
          createdAt: account.createdAt
        });
      }
    });

    console.log('📊 Total bank connections found:', bankConnections.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        uid: uid.substring(0, 10) + '...',
        bankConnections,
        debug: {
          plaidTokensExists: plaidTokensDoc.exists,
          bankAccountsCount: bankAccountsData.length,
          userExists: userDoc.exists,
          totalConnections: bankConnections.length,
          hasAccessTokens: bankConnections.filter(b => b.accessToken).length
        }
      }),
    };
  } catch (error) {
    console.error('❌ Debug bank data error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        debug: {
          message: error.message,
          stack: error.stack
        }
      }),
    };
  }
};

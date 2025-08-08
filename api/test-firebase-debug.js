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
    
    console.log('🔄 Testing Firebase connection for user:', uid?.substring(0, 10) + '...');

    // Test 1: Check if Firebase Admin is working
    console.log('✅ Firebase Admin initialized successfully');

    // Test 2: Check environment variable
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    console.log('✅ Service account available:', hasServiceAccount);

    // Test 3: Try to access Firestore
    const testDoc = adminDb.collection('test').doc('debug');
    await testDoc.set({ timestamp: new Date().toISOString() });
    console.log('✅ Successfully wrote to Firestore');

    // Test 4: Check for user data in different collections
    let foundData = null;
    let dataLocation = null;

    // Check plaid_tokens collection
    const plaidTokensRef = adminDb.collection('plaid_tokens').doc(uid);
    const plaidTokensDoc = await plaidTokensRef.get();
    
    if (plaidTokensDoc.exists) {
      foundData = plaidTokensDoc.data();
      dataLocation = 'plaid_tokens';
      console.log('✅ Found data in plaid_tokens collection');
    } else {
      // Check users/bankAccounts collection
      const bankAccountsRef = adminDb.collection('users').doc(uid).collection('bankAccounts');
      const bankAccountsSnapshot = await bankAccountsRef.get();
      
      if (!bankAccountsSnapshot.empty) {
        foundData = bankAccountsSnapshot.docs[0].data();
        dataLocation = 'users/bankAccounts';
        console.log('✅ Found data in users/bankAccounts collection');
      } else {
        console.log('❌ No data found in either collection');
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        firebaseWorking: true,
        hasServiceAccount,
        dataFound: !!foundData,
        dataLocation,
        accessToken: foundData?.accessToken ? 'present' : 'missing',
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('❌ Firebase debug error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        firebaseWorking: false,
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

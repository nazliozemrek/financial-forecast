import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = JSON.parse(
  readFileSync(new URL('./serviceAccountKey.json', import.meta.url))
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

// Plaid setup
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { public_token, userId, institution } = req.body;

  console.log('🔥 /exchange_public_token hit!');
  console.log('Body:', req.body);

  try {
    // Exchange public token for access token
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;
    const item_id = response.data.item_id;

    console.log('✅ Got access token (will not be stored)');

    const resolvedUserId = userId || 'debugUser';
    if (!userId) {
      console.warn('⚠️ No userId provided (received: undefined) — using fallback \'debugUser\'');
    }

    // 🔒 SECURITY: Only store non-sensitive institution data
    let fullInstitution = {
      name: institution?.name || 'Unknown',
      institution_id: institution?.institution_id || '',
      logo: null,
    };

    if (institution?.institution_id) {
      try {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institution.institution_id,
          country_codes: ['US'],
        });
        
        // ✅ Safe to store: Public institution metadata
        fullInstitution = {
          name: instResponse.data.institution.name,
          institution_id: instResponse.data.institution.institution_id,
          logo: instResponse.data.institution.logo || null,
          primary_color: instResponse.data.institution.primary_color,
          url: instResponse.data.institution.url,
          routing_numbers: instResponse.data.institution.routing_numbers,
          oauth: instResponse.data.institution.oauth,
          products: instResponse.data.institution.products,
          country_codes: instResponse.data.institution.country_codes,
          payment_channel: instResponse.data.institution.payment_channel,
        };
        
        console.log('✅ Got full institution info (public data only)');
      } catch (instErr) {
        console.warn('Could not fetch full institution info:', instErr.message);
      }
    }

    // 🔒 SECURITY: Store only non-sensitive data in Firestore
    const userRef = db
      .collection('users')
      .doc(resolvedUserId)
      .collection('bankAccounts')
      .doc(item_id);

    const bankConnectionData = {
      // ✅ Safe to store: Connection metadata
      item_id,
      institution: fullInstitution,
      connectedAt: Timestamp.now(),
      lastSyncAt: Timestamp.now(),
      status: 'active',
      // ❌ NOT stored: access_token, credentials, account numbers
      // ❌ NOT stored: raw transaction descriptions
      // ❌ NOT stored: personal financial data
    };

    await userRef.set(bankConnectionData);

    console.log(`✅ Saved bank connection securely to /users/${resolvedUserId}/bankAccounts/${item_id}`);
    console.log('🔒 Security: No sensitive data stored in database');

    // 🔒 SECURITY: Return access token only for immediate use, don't store it
    res.status(200).json({ 
      access_token, // For immediate transaction fetching only
      item_id, 
      institution: fullInstitution,
      security: 'Access token not stored - use immediately for transactions',
      message: 'Bank connected securely - no sensitive data stored'
    });
  } catch (error) {
    console.error('❌ Exchange failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
}
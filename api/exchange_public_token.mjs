import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { Router } from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

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

// Exchange and write to Firestore
router.post('/exchange_public_token', async (req, res) => {
  const { public_token, userId } = req.body;

  console.log('🔥 /exchange_public_token hit!');
  console.log('Body:', req.body);

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;
    const item_id = response.data.item_id;

    console.log('✅ Got access token:', access_token);

    const resolvedUserId = userId || 'debugUser';
    if (!userId) {
      console.warn('⚠️ No userId provided (received: undefined) — using fallback \'debugUser\', saving to Firestore');
    }

    const userRef = db.collection('users')
      .doc(resolvedUserId)
      .collection('bankAccounts')
      .doc(item_id);

    await userRef.set({
      access_token,
      item_id,
      institution: req.body.institution,
      connectedAt: Timestamp.now(),
    });

    console.log(`✅ Saved access token to /users/${resolvedUserId}/bankAccounts/${item_id}`);

    res.json({ access_token });
  } catch (error) {
    console.error('❌ Exchange failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

export default router;
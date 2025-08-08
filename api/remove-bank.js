import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';
import { adminDb } from '../backend/firebaseAdmin.js';

dotenv.config();

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

  try {
    const { userId, bankId } = req.body;

    if (!userId || !bankId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🗑️ Removing bank:', {
      bankId: bankId.substring(0, 10) + '...', // Log partial ID for security
      userId: userId.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

    // First, get the bank account data to retrieve the access token
    const bankAccountRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('bankAccounts')
      .doc(bankId);

    const bankAccountDoc = await bankAccountRef.get();

    if (!bankAccountDoc.exists) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    const bankData = bankAccountDoc.data();
    const accessToken = bankData.accessToken;

    if (!accessToken) {
      console.warn('⚠️ No access token found for bank account');
    } else {
      try {
        // Step 1: Call Plaid's /item/remove endpoint to properly deauthorize the Item
        console.log('🔄 Calling Plaid /item/remove endpoint...');
        await plaidClient.itemRemove({
          access_token: accessToken,
        });
        console.log('✅ Successfully deauthorized Item with Plaid');
      } catch (plaidError) {
        console.error('❌ Error calling Plaid /item/remove:', plaidError);
        // Continue with local deletion even if Plaid call fails
        // This ensures we don't leave orphaned data in our database
      }
    }

    // Step 2: Delete from our database
    await bankAccountRef.delete();
    console.log('✅ Bank account deleted from Firebase:', bankAccountRef.path);

    res.status(200).json({
      success: true,
      message: 'Bank removed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error removing bank:', err);

    // Categorize errors based on Plaid handbook
    if (err.code === 'permission-denied') {
      res.status(403).json({ error: 'Permission denied' });
    } else if (err.code === 'not-found') {
      res.status(404).json({ error: 'Bank account not found' });
    } else {
      res.status(500).json({ error: 'Failed to remove bank' });
    }
  }
}

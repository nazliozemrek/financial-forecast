import { adminDb } from '../backend/firebaseAdmin.mjs';
import crypto from 'crypto';

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

  const { userId, access_token, institution } = req.body;

  if (!userId || !access_token || !institution) {
    return res.status(400).json({ error: 'Missing userId, access_token, or institution' });
  }

  try {
    const ref = adminDb.collection('users').doc(userId).collection('bankAccounts').doc(institution.institution_id);
    const doc = await ref.get();
    if (doc.exists) {
      return res.status(409).json({ error: 'Bank already connected' });
    }

    // 🔒 SECURITY: Don't store sensitive data in Firestore
    // Instead, store only non-sensitive information and use secure token handling
    const bankInfo = {
      // ✅ Safe to store: Institution metadata (public info)
      institution: {
        institution_id: institution.institution_id,
        name: institution.name,
        logo: institution.logo,
        primary_color: institution.primary_color,
        url: institution.url,
        routing_numbers: institution.routing_numbers,
        oauth: institution.oauth,
        products: institution.products,
        country_codes: institution.country_codes,
        payment_channel: institution.payment_channel,
      },
      // ✅ Safe to store: Connection metadata
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      status: 'active',
      // ❌ NOT stored: access_token, credentials, account numbers
      // ❌ NOT stored: raw transaction descriptions
      // ❌ NOT stored: personal financial data
    };

    await ref.set(bankInfo);

    console.log(`✅ Saved bank info for ${institution.name} (no sensitive data stored)`);
    res.status(200).json({ 
      success: true,
      message: 'Bank connected securely - no sensitive data stored',
      institution: bankInfo.institution
    });
  } catch (err) {
    console.error('❌ Failed to save bank info:', err);
    res.status(500).json({ error: 'Failed to save bank info' });
  }
}
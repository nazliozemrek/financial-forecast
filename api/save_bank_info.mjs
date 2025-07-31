import express from 'express';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../api/serviceAccountKey.json' assert { type: "json" };

const router = express.Router();

// 🔐 Firebase Admin Init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = getFirestore();

// 🔖 Save Plaid institution data
router.post('/save_bank_info', async (req, res) => {
  const { userId, access_token, institution } = req.body;

  if (!userId || !access_token || !institution) {
    return res.status(400).json({ error: 'Missing userId, access_token, or institution' });
  }

  try {
    const ref = db.collection('users').doc(userId).collection('bankAccounts').doc(institution.institution_id);
    await ref.set({
      access_token,
      institution,
      connectedAt: new Date(),
    });

    console.log(`✅ Saved bank info for ${institution.name}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to save bank info:', err);
    res.status(500).json({ error: 'Failed to save bank info' });
  }
});

export default router;
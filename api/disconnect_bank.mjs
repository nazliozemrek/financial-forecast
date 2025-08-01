// api/disconnect_bank.mjs
import express from 'express';
import { adminDb } from '../backend/firebaseAdmin.mjs';

const router = express.Router();

router.delete('/disconnect_bank', async (req, res) => {
  const { uid, bankId } = req.body;

  if (!uid || !bankId) {
    return res.status(400).json({ error: 'Missing uid or bankId' });
  }

  try {
    const docRef = adminDb.doc(`users/${uid}/bankAccounts/${bankId}`);
    console.log(`📍 Deleting doc at: users/${uid}/bankAccounts/${bankId}`);
    await docRef.delete();
    res.status(200).json({ message: 'Bank account disconnected' });
  } catch (error) {
    console.error('🔥 Error disconnecting bank:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
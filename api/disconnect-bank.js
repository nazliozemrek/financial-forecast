// api/disconnect_bank.mjs
import { adminDb } from '../backend/firebaseAdmin.mjs';

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

  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, bankId } = req.body || {};

  if (!uid || !bankId) {
    return res.status(400).json({ error: 'Missing uid or bankId' });
  }

  const basePath = `users/${uid}/bankAccounts`;

  try {
    let deletedCount = 0;
    const collectionRef = adminDb.collection(basePath);

    // Case A: bankId looks like an institution id (ins_XXXX)
    if (typeof bankId === 'string' && bankId.startsWith('ins_')) {
      console.log(`🔎 Querying docs by institution_id=${bankId} under ${basePath}`);
      const snap = await collectionRef.where('institution.institution_id', '==', bankId).get();
      const batch = adminDb.batch();
      snap.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount += 1;
      });
      if (deletedCount > 0) {
        await batch.commit();
        console.log(`🗑️ Deleted ${deletedCount} doc(s) for institution ${bankId}`);
        return res.status(200).json({ message: 'Bank disconnected', deletedCount });
      }
      console.log('ℹ️ No docs matched institution query; falling back to id delete');
    }

    // Case B: bankId is a document id
    const docRef = collectionRef.doc(bankId);
    const existing = await docRef.get();
    if (existing.exists) {
      console.log(`📍 Deleting doc by id at: ${basePath}/${bankId}`);
      const institutionId = existing.data()?.institution?.institution_id;
      await docRef.delete();
      deletedCount += 1;

      // Best-effort: also delete any sibling docs for same institution
      if (institutionId) {
        const siblings = await collectionRef
          .where('institution.institution_id', '==', institutionId)
          .get();
        const batch = adminDb.batch();
        siblings.forEach((doc) => {
          if (doc.id !== bankId) {
            batch.delete(doc.ref);
            deletedCount += 1;
          }
        });
        if (deletedCount > 1) {
          await batch.commit();
        }
      }
      console.log(`🗑️ Deleted ${deletedCount} doc(s) for bankId ${bankId}`);
      return res.status(200).json({ message: 'Bank disconnected', deletedCount });
    }

    // If we reach here, nothing was deleted
    console.log('⚠️ No matching documents found to delete');
    return res.status(404).json({ error: 'Bank record not found' });
  } catch (error) {
    console.error('🔥 Error disconnecting bank:', error?.stack || error?.message || error);
    res.status(500).json({ error: 'Failed to disconnect bank' });
  }
}
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../api/serviceAccountKey.json');

// ✅ Only initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDb = getFirestore();

module.exports = { adminDb };

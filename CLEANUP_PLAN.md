# API Cleanup Plan

## Files to KEEP (Essential):
- `api/create-link-token.js` - ✅ Working, essential for bank connection
- `api/exchange-public-token.js` - ✅ Essential for saving bank tokens
- `api/unlink-bank.js` - ✅ New improved disconnect endpoint
- `api/transactions.js` - ✅ Essential for fetching transactions
- `lib/plaidClient.js` - ✅ Centralized Plaid client
- `lib/firebaseAdmin.js` - ✅ Centralized Firebase Admin

## Files to DELETE (Duplicates/Test files):
- `api/remove-bank.js` - ❌ Old version, replaced by unlink-bank.js
- `api/remove-bank-simple.js` - ❌ Temporary test file
- `api/test-simple.js` - ❌ Test file
- `api/test-api.js` - ❌ Test file
- `api/test-env.js` - ❌ Test file
- `api/test-env-simple.js` - ❌ Test file
- `api/test-firebase.js` - ❌ Test file
- `api/unlink-bank-test.js` - ❌ Test file
- `api/index.js` - ❌ Not needed
- `api/recurring.js` - ❌ Not being used
- `api/save-bank-info.js` - ❌ Not being used
- `api/fetch-institution-info.js` - ❌ Not being used
- `api/serviceAccountKey.json` - ❌ Should use environment variables
- `backend/firebaseAdmin.js` - ❌ Duplicate of lib/firebaseAdmin.js
- `backend/plaidClient.mjs` - ❌ Duplicate of lib/plaidClient.js
- `backend/getAccounts.mjs` - ❌ Not being used
- `backend/index.mjs` - ❌ Not being used

## Result:
- Keep only 6 essential files
- Delete 16 unnecessary files
- Much cleaner, faster deployment

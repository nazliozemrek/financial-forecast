// backend/getAccounts.mjs
import { plaidClient } from './plaidClient.mjs'; // adjust path if needed

export async function getAccountsHandler(req, res) {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: 'Missing access token' });
  }

  try {
    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const itemResponse = await plaidClient.itemGet({ access_token });

    res.status(200).json({
      accounts: accountsResponse.data.accounts,
      item: itemResponse.data.item,
    });
  } catch (err) {
    console.error('❌ Error fetching accounts:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
}
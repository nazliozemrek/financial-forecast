import { plaidClient } from '../backend/plaidClient.mjs';

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

  const { institution_id } = req.body;

  try {
    const response = await plaidClient.institutionsGetById({
      institution_id,
      country_codes: ['US'],
      options: { include_optional_metadata: true },
    });

    const institution = response.data.institution;

    res.status(200).json({ institution });
  } catch (error) {
    console.error('❌ Failed to fetch institution info:', error);
    res.status(500).json({ error: 'Failed to fetch institution info' });
  }
}
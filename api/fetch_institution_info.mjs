import express from 'express';
import {plaidClient} from '../backend/plaidClient.mjs';

const router = express.Router();

router.post('/fetch_institution_info', async (req, res) => {
  const { institution_id } = req.body;

  try {
    const response = await plaidClient.institutionsGetById({
      institution_id,
      country_codes: ['US'],
      options: { include_optional_metadata: true },
    });

    const institution = response.data.institution;

    res.json({ institution });
  } catch (error) {
    console.error('❌ Failed to fetch institution info:', error);
    res.status(500).json({ error: 'Failed to fetch institution info' });
  }
});

export default router;
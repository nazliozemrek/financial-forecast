import express from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';


console.log("🧠 create_link_token.mjs loaded");
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });



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

const createLinkTokenRouter = express.Router();

createLinkTokenRouter.post('/create-link-token', async (req, res) => {
  try {
    const userId = 'demo-user';
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Finans App',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });

    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error("PLAID ERROR:",err.response?.data || err.message || err);
    res.status(500).json({ error: 'Unable to create link token' });
  }
});

export default createLinkTokenRouter;
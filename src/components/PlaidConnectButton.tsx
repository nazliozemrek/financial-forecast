import React from 'react';
import toast from 'react-hot-toast';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidConnectButtonProps {
  linkToken: string;
  setAccessToken: (token: string) => void;
  onTransactionsFetched?: (transactions: any[]) => void;
}

const PlaidConnectButton = ({ linkToken, setAccessToken, onTransactionsFetched }: PlaidConnectButtonProps) => {
  if (!linkToken) return null;
  const config = {
    token: linkToken,
    onSuccess: async (public_token: string) => {
      try {
        // Step 1: Exchange public_token for access_token
        const res = await fetch('http://localhost:3001/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });

        const data = await res.json();
        const access_token = data.access_token;

        if (!access_token) {
          toast.error('No access token received');
          return;
        }

        localStorage.setItem('access_token', access_token);
        setAccessToken(access_token);
        toast.success('✅ Bank account connected!');
        console.log('🎫 Access Token:', access_token);

        // Step 2: Retry fetch transactions (up to 5 times)
        let transactions: any[] = [];
        let retries = 0;

        while (retries < 5) {
          const txRes = await fetch('http://localhost:3001/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token }),
          });

          const txData = await txRes.json();

          if (txData?.error_code === 'PRODUCT_NOT_READY') {
            console.warn(`⌛ PRODUCT_NOT_READY, retrying... (${retries + 1}/5)`);
            await new Promise(r => setTimeout(r, 3000)); // wait 3 seconds
            retries++;
            continue;
          }

          console.log('Full transactions response:',txData);
          if (!Array.isArray(txData.transactions)) {
            toast.error('Failed to fetch valid transactions');
            console.error('❌ Invalid transaction data:', txData);
            return;
          }

          transactions = txData.transactions;
          break;
        }

        if (transactions.length > 0) {
          toast.success(`💰 Fetched ${transactions.length} transactions!`);
          if (onTransactionsFetched) onTransactionsFetched(transactions);
        } else {
          toast.error('No transactions retrieved.');
        }

      } catch (err) {
        console.error('❌ Error connecting Plaid:', err);
        toast.error('Failed to connect bank.');
      }
    },

    onExit: (err: any, metadata: any) => {
      console.log('User exited Plaid Link', err, metadata);
    },
  };

  
  const { open, ready } = usePlaidLink(config);

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 hover:shadow-lg hover:scale-105 transition-all shadow-md"
    >
      {ready ? 'Connect Bank' : 'Loading...'}
    </button>
  );
};

export default PlaidConnectButton;
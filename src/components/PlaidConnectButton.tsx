import React from 'react';
import toast from 'react-hot-toast';
import { usePlaidLink } from 'react-plaid-link';

interface Props {
  linkToken: string;
}

const PlaidConnectButton: React.FC<Props> = ({ linkToken }) => {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        const res = await fetch('http://localhost:3001/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });

        const data = await res.json();

        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          toast.success('✅ Bank account connected!');
          console.log('🎫 Access Token:', data.access_token);
        } else {
          throw new Error('No access token received');
        }
      } catch (err) {
        console.error(err);
        toast.error('❌ Failed to connect bank account.');
      }
    },
  });

  return (
    <button
      onClick={() => ready && open()}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Connect Bank
    </button>
  );
};

export default PlaidConnectButton;
// components/PlaidConnectButton.tsx
import React from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../../hooks/useAuth'; // ✅ make sure this path is valid
import axios from 'axios';

const PlaidConnectButton = ({
  linkToken,
}: {
  linkToken: string;
}) => {
  const auth = useAuth(); // avoids destructuring error if null
  const userId = auth?.uid;

const onSuccess = async (public_token: string, metadata: any) => {
  console.log('🎯 onSuccess metadata:', metadata);

  try {
    const res = await axios.post('/api/exchange_public_token', {
      public_token,
      userId,
      institution: metadata.institution || {}, // send what Plaid gave you
    });

    console.log('✅ Bank linked & token saved:', res.data);
  } catch (error) {
    console.error('❌ Failed to link bank:', error);
  }
};

  const { open, ready, error, exit } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  if (error) {
    console.error('❌ Plaid Link error:', error);
  }

  return (
    <button
      onClick={() => {
        if (ready) open();
      }}
      disabled={!ready}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Connect Bank
    </button>
  );
};

export default PlaidConnectButton;
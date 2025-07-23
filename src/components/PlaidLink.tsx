// components/PlaidLink.tsx
import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

const PlaidLink = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Get the link_token from your server
  useEffect(() => {
    fetch('http://localhost:3001/api/create-link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'demo-user' })
    })
      .then(res => res.json())
      .then(data => setLinkToken(data.link_token))
      .catch(err => console.error('Failed to get link token', err));
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess: (public_token, metadata) => {
      console.log('✅ Success!', public_token, metadata);
      // send public_token to your backend to exchange for access_token
    },
    onExit: (err, metadata) => {
      console.log('❌ Exit', err, metadata);
    },
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg mt-4"
    >
      Connect Bank Account
    </button>
  );
};

export default PlaidLink;
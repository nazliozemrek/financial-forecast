// components/PlaidLinkButton.tsx
import { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

export function PlaidLinkButton({ onSuccess }: { onSuccess: (publicToken: string) => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    // Fetch link_token from backend
    const createLinkToken = async () => {
      const res = await fetch('http://localhost:3001/api/create_link_token', {
        method: 'POST',
      });
      const data = await res.json();
      setLinkToken(data.link_token);
    };

    createLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: (public_token) => {
      onSuccess(public_token); // Handle exchange on success
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready || !linkToken}>
      Connect a bank
    </button>
  );
}
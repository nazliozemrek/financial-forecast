// components/PlaidLinkButton.tsx
import { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useAuth } from '../../hooks/useAuth';

export function PlaidLinkButton({ onSuccess }: { onSuccess: (publicToken: string) => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const  currentUser  = useAuth()
;
  useEffect(() => {
    console.log("🧪 currentUser inside PlaidLinkButton:", currentUser);
    const createLinkToken = async () => {
      if (!currentUser || !currentUser.uid) {
        console.warn("🛑 useAuth returned no user or no uid yet:", currentUser);
        return;
      }

      try {
        const res = await fetch('/api/create_link_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.uid }), // ✅ send real user ID
        });

        const data = await res.json();
        if (data.link_token) {
          setLinkToken(data.link_token);
        } else {
          console.error('No link token received:', data);
        }
      } catch (error) {
        console.error('Error creating link token:', error);
      }
    };

    createLinkToken();
  }, [currentUser]);
 
  console.log("🧠 Setting up Plaid Link with token:", linkToken, "and userId:", currentUser?.uid);

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: async (public_token) => {
      console.log("🔁 Sending public_token and userId to backend", {
        public_token,
        userId: currentUser?.uid,
      });
      if (!currentUser?.uid) {
        console.warn("❌ No user ID found, skipping token exchange");
        return;
      }
      try {
        const res = await fetch('http://localhost:3001/api/exchange_public_token',{
          method:'POST',
          headers:{ 'Content-Type':'application/json'},
          body: JSON.stringify({
            public_token,
            userId: currentUser.uid,
          }),
        });
        const data = await res.json();
        console.log('Exchange response:',data);
        if(onSuccess) onSuccess(public_token);
      } catch (err) {
        console.error('Exchange token error',err);
      }
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready || !linkToken}>
      Connect a bank
    </button>
  );
}
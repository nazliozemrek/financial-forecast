import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

export function usePlaid() {
  const user = useAuth();
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const res = await fetch('/.netlify/functions/create-link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.uid || 'demo-user' }),
        });

        const data = await res.json();
        if (data.link_token) {
          setLinkToken(data.link_token);
        } else {
          throw new Error('No link_token returned');
        }
      } catch (err) {
        toast.error('Failed to fetch Plaid link token');
      }
    };

    if (user && !linkToken) {
      fetchLinkToken();
    }
  }, [user, linkToken]);

  const fetchTransactions = async (accessToken: string) => {
    try {
              const res = await fetch("/.netlify/functions/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      const data = await res.json();
      if (Array.isArray(data.transactions)) {
        toast.success(`Fetched ${data.fetchedCount} transactions securely`);
        return data.transactions;
      }
      return [];
    } catch (err) {
      toast.error("Failed to fetch transactions");
      return [];
    }
  };

  return {
    linkToken,
    fetchTransactions,
  };
}
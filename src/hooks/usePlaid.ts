import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';

export function usePlaid(user: User | null) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);

  const fetchAccessToken = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const res = await fetch(`/api/get_access_token?uid=${user.uid}`);
      const data = await res.json();

      if (data.access_token) {
        setAccessToken(data.access_token); // update local state
      }
    } catch (err) {
      console.error('❌ Failed to fetch access token:', err);
    }
  };

  // Fetch recurring transactions from Plaid
  const fetchRecurringTransactions = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/plaid/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });
      const data = await res.json();
      console.log('Plaid recurring transactions response:', data);
      setRecurringTransactions(data.recurring || []);
    } catch (err) {
      console.error('❌ Failed to fetch recurring transactions:', err);
      setRecurringTransactions([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccessToken();
    }
  }, [user]);

  useEffect(() => {
    if (accessToken) {
      fetchRecurringTransactions();
    }
  }, [accessToken]);

  return { accessToken, setAccessToken, recurringTransactions, fetchRecurringTransactions };
}
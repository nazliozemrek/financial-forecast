// hooks/useFinancialForecastApp.ts
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useAuth } from './useAuth';
import { useBanks } from './useBanks';
import { toast } from 'react-hot-toast';
import { detectRecurringTransactions } from '../utils/detectRecurringTransactions';
import { expandRecurringTransactions } from '../utils/expandRecurringTransactions';
import type { EventItem, BalanceEntry, SavedScenario } from '../types';

export function useFinancialForecastApp() {
  const user = useAuth();
  const { banks, loading: banksLoading, refetch } = useBanks();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankConnections, setBankConnections] = useState<
    { accessToken: string; institution?: { name: string; institution_id?: string } }[]
  >([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const fetchTransactions = async () => {
    if (!user) {
      toast.error('User not loaded!');
      return;
    }

    try {
      const bankAccountsRef = collection(db, `users/${user.uid}/bankAccounts`);
      const bankSnapshot = await getDocs(bankAccountsRef);
      const accessTokens: string[] = [];
      bankSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.access_token) accessTokens.push(data.access_token);
      });

      if (accessTokens.length === 0) {
        toast.error('No bank accounts connected!');
        return;
      }

      const allTransactions: any[] = [];

      for (const token of accessTokens) {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token }),
        });

        const data = await res.json();
        if (Array.isArray(data.transactions)) {
          allTransactions.push(...data.transactions);
        }
      }

      setTransactions(allTransactions);
      toast.success(`Fetched ${allTransactions.length} transactions!`);
      console.log("✅ setTransactions called with:", allTransactions);

      const recurring = detectRecurringTransactions(allTransactions);

      const recurringWithIds = recurring.map((item) => ({
          ...item,
          id:`${item.title}-${item.amount}-${item.frequency}`.replace(/\s+/g,''),
          recurring:true,
      }));
      const expandedRecurringEvents = expandRecurringTransactions(recurringWithIds);

      setEvents(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const uniqueNewEvents = expandedRecurringEvents.filter(e => !existingIds.has(e.id));
        const nonRecurring = prev.filter(e => !e.recurring);
        return [...nonRecurring, ...uniqueNewEvents];
      });

    } catch (err) {
      console.error("❌ Failed to fetch transactions", err);
      toast.error("Failed to fetch transactions");
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const res = await fetch('/api/create-link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.uid || 'demo-user' }),
        });

        const data = await res.json();
        if (data.link_token) {
          setLinkToken(data.link_token);
          console.log('✅ Link Token fetched:', data.link_token);
        } else {
          throw new Error('No link_token returned');
        }
      } catch (err) {
        console.error('❌ Failed to fetch Plaid link token', err);
        toast.error('Failed to fetch Plaid link token');
      }
    };

    if (user && !linkToken) {
      fetchLinkToken();
    }
  }, [user, linkToken]);

  return {
    user,
    loading,
    transactions,
    events,
    setEvents,
    bankConnections,
    setBankConnections,
    linkToken,
    setLinkToken,
    refetchBanks: refetch,
    fetchTransactions
  };
}

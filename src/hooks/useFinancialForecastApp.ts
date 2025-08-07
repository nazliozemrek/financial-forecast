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
  const { banks, loading: banksLoading } = useBanks();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankConnections, setBankConnections] = useState<
    { accessToken: string; institution?: { name: string; institution_id?: string } }[]
  >([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);

  // Load saved scenarios from Firebase
  const loadSavedScenarios = async () => {
    if (!user) return;
    
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      
      const scenariosSnapshot = await getDocs(collection(db, 'users', user.uid, 'savedScenarios'));
      const scenarios = scenariosSnapshot.docs.map(doc => doc.data() as SavedScenario);
      
      console.log('📋 Loaded saved scenarios from Firebase:', scenarios);
      setSavedScenarios(scenarios);
    } catch (error) {
      console.error('❌ Error loading saved scenarios:', error);
    }
  };

  // Load saved scenarios when user is available
  useEffect(() => {
    if (user) {
      console.log('🔄 Loading saved scenarios for user:', user.uid);
      loadSavedScenarios();
    } else {
      console.log('⚠️ No user available for loading scenarios');
    }
  }, [user]);

  // Sync bankConnections with banks from useBanks hook
  useEffect(() => {
    if (banks.length > 0) {
      const connections = banks.map(bank => ({
        accessToken: bank.access_token,
        institution: bank.institution
      }));
      setBankConnections(connections);
      console.log("🔄 Bank connections synced:", connections);
    } else {
      setBankConnections([]);
    }
  }, [banks]);

  // Set loading to false when user is loaded (or after timeout if no user)
  useEffect(() => {
    console.log("🔍 User state changed:", user ? `User ID: ${user.uid}` : "No user");
    if (user !== null) {
      // User is loaded (either authenticated or not)
      setLoading(false);
      console.log("✅ Loading set to false - user loaded");
    } else {
      // Still loading user state, wait a bit longer
      const timer = setTimeout(() => {
        setLoading(false);
        console.log("⏰ Loading set to false - timeout reached");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Update allEvents when events or transactions change
  useEffect(() => {
    // Combine custom events with bank transactions
    const bankEvents: EventItem[] = transactions.map((tx, idx) => {
      const amount = Number(tx.amount);
      const isIncome = amount > 0;
      
      return {
        id: 1000000 + idx, // Use high ID range for bank events
        title: tx.name || 'Bank Transaction',
        amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
        date: tx.date,
        type: isIncome ? 'income' as const : 'expense' as const,
        frequency: 'once' as const,
        startDate: tx.date,
        enabled: true,
        isPlaid: true,
        generated: true,
        recurring: false,
        source: 'Bank Transaction',
        sourceIcon: '🏦'
      };
    });

    const merged = [...events, ...bankEvents];
    setAllEvents(merged);
  }, [events, transactions]);

  const fetchTransactions = async () => {
    if (!user) {
      toast.error('User not loaded!');
      return;
    }

    if (bankConnections.length === 0) {
      console.log("⚠️ No bank connections available");
      return;
    }

    try {
      const allTransactions: any[] = [];

      for (const connection of bankConnections) {
        if (!connection.accessToken) continue;
        
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: connection.accessToken }),
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
    if (user && bankConnections.length > 0) {
      fetchTransactions();
    }
  }, [user, bankConnections]);

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

  useEffect(() => {
    // Load user-added events from localStorage on mount
    const saved = localStorage.getItem('userAddedEvents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      } catch (err) {
        console.error('Failed to parse saved events:', err);
      }
    }
  }, []);

  return {
    user,
    loading,
    transactions,
    events,
    setEvents,
    allEvents,
    setAllEvents,
    bankConnections,
    setBankConnections,
    linkToken,
    refetchBanks: () => {}, // Placeholder since useBanks doesn't provide refetch
    fetchTransactions,
    savedScenarios,
    setSavedScenarios,
  };
}

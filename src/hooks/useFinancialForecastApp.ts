// hooks/useFinancialForecastApp.ts
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
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

  // Load user events from Firebase
  const loadUserEvents = async () => {
    if (!user) return;
    
    try {
      const eventsSnapshot = await getDocs(collection(db, 'users', user.uid, 'events'));
      const userEvents = eventsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: parseInt(doc.id) // Convert string ID to number
      })) as EventItem[];
      
      setEvents(userEvents);
    } catch (error) {
      // Error loading user events
    }
  };

  // Save event to Firebase
  const saveEventToFirebase = async (event: EventItem) => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, 'users', user.uid, 'events', event.id.toString()), event);
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  // Delete event from Firebase
  const deleteEventFromFirebase = async (eventId: number) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'events', eventId.toString()));
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  // Load saved scenarios from Firebase
  const loadSavedScenarios = async () => {
    if (!user) return;
    
    try {
      const scenariosSnapshot = await getDocs(collection(db, 'users', user.uid, 'savedScenarios'));
      const scenarios = scenariosSnapshot.docs.map(doc => doc.data() as SavedScenario);
      
      setSavedScenarios(scenarios);
    } catch (error) {
      // Error loading saved scenarios
    }
  };

  // Load user events when user is available
  useEffect(() => {
    if (user) {
      loadUserEvents();
    } else {
      setEvents([]); // Clear events when no user
    }
  }, [user]);

  // Load saved scenarios when user is available
  useEffect(() => {
    if (user) {
      loadSavedScenarios();
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
    } else {
      setBankConnections([]);
    }
  }, [banks]);

  // Set loading to false when user is loaded (or after timeout if no user)
  useEffect(() => {
    if (user !== null) {
      // User is loaded (either authenticated or not)
      setLoading(false);
    } else {
      // Still loading user state, wait a bit longer
      const timer = setTimeout(() => {
        setLoading(false);
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

      const recurring = detectRecurringTransactions(allTransactions);

      const recurringWithIds = recurring.map((item) => ({
          ...item,
          id:`${item.title}-${item.amount}-${item.frequency}`.replace(/\s+/g,''),
          recurring:true,
          frequency: item.frequency as 'monthly' | 'weekly' | 'daily' | 'bi-weekly',
          startDate: item.startDate.toISOString().slice(0, 10)
      }));
      const expandedRecurringEvents = expandRecurringTransactions(recurringWithIds);

      setEvents(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const uniqueNewEvents = expandedRecurringEvents.filter(e => !existingIds.has(Number(e.id)));
        const nonRecurring = prev.filter(e => !e.recurring);
        return [...nonRecurring, ...uniqueNewEvents.map(e => ({
          ...e,
          id: Number(e.id.replace(/[^0-9]/g, '')) || Math.floor(Math.random() * 1000000)
        }))];
      });

      // Show both transaction and event counts
      const totalEvents = allTransactions.length + expandedRecurringEvents.length;
      if (expandedRecurringEvents.length > 0) {
        toast.success(`${allTransactions.length} transactions → ${totalEvents} events (including ${expandedRecurringEvents.length} recurring)`);
      }

    } catch (err) {
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

  // Enhanced setEvents function that saves to Firebase
  const setEventsWithFirebase = (newEvents: EventItem[] | ((prev: EventItem[]) => EventItem[])) => {
    setEvents(prev => {
      const updatedEvents = typeof newEvents === 'function' ? newEvents(prev) : newEvents;
      
      // Save new events to Firebase
      if (user) {
        updatedEvents.forEach(event => {
          if (!prev.find(e => e.id === event.id)) {
            // This is a new event, save it
            saveEventToFirebase(event);
          }
        });
      }
      
      return updatedEvents;
    });
  };

  // Enhanced delete event function
  const deleteEvent = async (eventId: number) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await deleteEventFromFirebase(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  return {
    user,
    loading,
    transactions,
    events,
    setEvents: setEventsWithFirebase,
    deleteEvent,
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

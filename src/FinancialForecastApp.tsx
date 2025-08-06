import React, { useState, useEffect, useMemo } from 'react';
import { useFinancialForecastApp } from './hooks/useFinancialForecastApp';
import Header from './components/layout/Header';
import CalendarGrid from './components/calendar/CalendarGrid';
import BalanceChart from './components/simulation/BalanceChart';
import { Modal } from './components/shared/Modal';
import type { BalanceEntry, EventItem } from './types';
import { Toaster, toast } from 'react-hot-toast';
import PlaidConnectButton from './components/plaid/PlaidConnectButton';
import HeaderButton from './components/layout/HeaderButton';
import ConfirmModal from './components/modals/ConfirmModal';
import SplashScreen from './components/layout/SplashScreen';
import ConnectedBanks from './components/plaid/ConnectedBanks';
import Login from './pages/Login';
import { PlugZap } from 'lucide-react';
import { generateCalendarDays } from './utils/calendarUtils';
import { expandRecurringTransactions } from './utils/expandRecurringTransactions';
import { dedupeEvents } from './utils/dedupeEvents';
import { addMonths} from 'date-fns';
import { usePlaid } from './hooks/usePlaid';
import { useBanks } from './hooks/useBanks';

const FinancialForecastApp = () => {
  const {
    user,
    loading,
    transactions,
    events,
    setEvents,
    bankConnections,
    setBankConnections,
    linkToken,
    refetchBanks,
    fetchTransactions
  } = useFinancialForecastApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarReady, setCalendarReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<BalanceEntry[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQuickSim, setShowQuickSim] = useState(false);
  const [simAnimatingDate, setSimAnimatingDate] = useState<Date | null>(null);
  const [isSimAnimating, setIsSimAnimating] = useState(false);
  const [simProgress, setSimProgress] = useState<BalanceEntry[]>([]);
  const [quickSimDate, setQuickSimDate] = useState('');
  const [initialBalance, setInitialBalance] = useState(1000);
  const [quickSimResult, setQuickSimResult] = useState<BalanceEntry | null>(null);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDateDetail, setSelectedDateDetail] = useState<BalanceEntry | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [simTargetDate, setSimTargetDate] = useState<Date | null>(null);
  const { accessToken, recurringTransactions, fetchRecurringTransactions } = usePlaid(user);
  const { banks } = useBanks();

  const parseLocalDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);


  useEffect(() => {
    if (accessToken && user && bankConnections.length > 0) {
      fetchTransactions();
      setTimeout(() => {
        setCurrentDate(new Date()); // force calendar re-render
      }, 500);
    }
  }, [accessToken, user, bankConnections]);

  useEffect(() => {
    // Auto-refresh transactions and recurring after connect/disconnect
    if (accessToken && user && bankConnections.length > 0) {
      fetchTransactions();
      fetchRecurringTransactions();
      setTimeout(() => {
        setCurrentDate(new Date());
      }, 500);
    }
  }, [accessToken, user, bankConnections]);

  useEffect(() => {
    // Auto-refresh calendar UI after new transactions are fetched
    if (transactions.length > 0) {
      setCurrentDate(new Date());
    }
  }, [transactions]);

  useEffect(() => {
    // Auto-refresh recurring transactions after connect/disconnect
    if (accessToken) {
      fetchRecurringTransactions();
    }
  }, [accessToken, bankConnections]);

  // Remove transactions from UI after disconnect
  useEffect(() => {
    if (bankConnections.length === 0) {
      setSimProgress([]);
      setCalendarDays([]);
      setAllEvents([]);
      setCalendarReady(false);
    }
  }, [bankConnections]);

  useEffect(() => {
    // Always fetch transactions and recurring transactions when banks change
    if (user && bankConnections.length > 0) {
      fetchTransactions();
      fetchRecurringTransactions();
      setTimeout(() => setCurrentDate(new Date()), 500);
    }
  }, [bankConnections, user]);

  // Fetch Plaid recurring transactions after bank connection
  useEffect(() => {
    if (accessToken && bankConnections.length > 0) {
      fetchRecurringTransactions();
    }
  }, [accessToken, bankConnections]);

  // Unified calendar update effect: handles transactions, recurringTransactions, events, and currentDate
  useEffect(() => {
    if (!transactions.length && !recurringTransactions.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    const expandedNormal = expandRecurringTransactions(transactions, 4);
    const expandedRecurring = recurringTransactions.map((tx, idx) => ({
      id: 900000 + idx,
      date: tx.first_date || tx.last_date || today.toISOString().slice(0, 10),
      title: tx.description || tx.name || 'Recurring Transaction',
      amount: Math.abs(tx.amount || 0),
      type: tx.amount && tx.amount > 0 ? 'income' : 'expense',
      enabled: true,
      generated: true,
    }));

    const allExpanded = [...expandedNormal, ...expandedRecurring];

    const filtered = allExpanded.filter(event => {
      const eventDate = parseLocalDate(event.date);
      if (!eventDate || isNaN(eventDate.getTime())) return false;
      return eventDate >= twoMonthsAgo;
    });

    const generated = generateCalendarDays(currentDate, filtered);
    setCalendarDays(generated);

    const merged = [...events, ...filtered];
    const deduped = dedupeEvents(merged);
    setAllEvents(deduped);

    console.log("🔥 Calendar and events updated after transactions and recurring");
  }, [transactions, recurringTransactions, currentDate, events]);

  // Set calendarReady to true when calendarDays is populated
  useEffect(() => {
    if (calendarDays.length > 0) {
      setCalendarReady(true);
    }
  }, [calendarDays]);

  const handleDisconnect = async () => {
    if (bankConnections.length === 0) {
      toast.error("No bank connections to disconnect.");
      return;
    }
    try {
      for (const { accessToken } of bankConnections) {
        await fetch('/api/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken }),
        });
      }
      setBankConnections([]);
      setShowDisconnectModal(false);
      toast.success('Disconnected all banks successfully');
      fetchTransactions();
      setTimeout(() => {
        setCurrentDate(new Date());
      }, 500);
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      toast.error('Failed to disconnect.');
    }
  };

  const handleToggleEvent = (id: number) => {
    setAllEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, enabled: !event.enabled } : event
      )
    );
  };

  const handleDeleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleQuickSimulate = async () => {
    console.log("⏱️ Simulate clicked!", { quickSimDate });

    const targetDate = new Date(quickSimDate);
    console.log("📆 Parsed targetDate:", targetDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      toast.error("Cannot simulate to a past date.");
      return;
    }

    setSimTargetDate(targetDate);
    setShowQuickSim(false);

    const generated = generateCalendarDays(currentDate, allEvents).filter(day =>
      new Date(day.date) >= today
    );
    const daysToSimulate = generated.filter(day => new Date(day.date) <= targetDate);

    if (skipAnimation) {
      let balance = initialBalance;
      const result: BalanceEntry[] = [];
      for (const day of daysToSimulate) {
        const dayEvents = day.events.filter(e => e.enabled !== false);
        const amount = dayEvents.reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -e.amount), 0);
        balance += amount;
        result.push({ ...day, balance, dayAmount: amount });
      }
      setSimProgress(result);
      setQuickSimResult(result[result.length - 1]);
      setSelectedDate(targetDate);
      return;
    }

    setSimAnimatingDate(null);
    setIsSimAnimating(true);
    let balance = initialBalance;
    const result: BalanceEntry[] = [];

    for (let i = 0; i < daysToSimulate.length; i++) {
      const day = daysToSimulate[i];
      const dayEvents = day.events.filter(e => e.enabled !== false);
      const amount = dayEvents.reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -e.amount), 0);
      balance += amount;
      const updatedDay = { ...day, balance, dayAmount: amount };
      result.push(updatedDay);
      setSimAnimatingDate(day.date);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setSimProgress(result);
    setQuickSimResult(result[result.length - 1]);
    setSelectedDate(targetDate);
    setIsSimAnimating(false);
    setSimAnimatingDate(null);
  };

  // Save scenario
  const handleSaveScenario = () => {
    if (!quickSimResult) return;
    const scenario: SavedScenario = {
      id: Date.now().toString(),
      name: `Scenario ${savedScenarios.length + 1}`,
      date: quickSimResult.date.toISOString(),
      balance: quickSimResult.balance,
      dayAmount: quickSimResult.dayAmount,
      events: quickSimResult.events,
    };
    setSavedScenarios(prev => [...prev, scenario]);
    toast.success('Scenario saved!');
  };

  // Discard scenario
  const handleDiscardScenario = () => {
    setQuickSimResult(null);
    setSimProgress([]);
    setSimTargetDate(null);
  };

  if (loading) return <SplashScreen />;
  if (!user) return <Login />;

  // Filter out duplicate banks before showing PlaidConnectButton
  const isBankConnected = (institutionId: string) =>
    banks.some(bank => bank.institution?.institution_id === institutionId);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-[#1a1a1a] via-[#111827] to-[#0f172a]">
      <main className="w-full max-w-6xl px-4">
        <Toaster position="top-center" />
        <Header
          onAddEvent={() => setShowEventModal(true)}
          onQuickSim={() => setShowQuickSim(true)}
          currentDate={currentDate}
          onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          extraButtons={
            <div className="flex gap-3">
              {bankConnections.length === 0 ? (
                linkToken ? (
                  <PlaidConnectButton
                    linkToken={linkToken}
                    refetchBanks={refetchBanks}
                    onTransactionsFetched={() => {
                      fetchTransactions();
                      setTimeout(() => setCurrentDate(new Date()), 500);
                    }}
                    userId={user?.uid || 'demo-user'}
                    onSuccess={(metadata) => {
                      // Prevent duplicate bank connection
                      if (isBankConnected(metadata.institution.institution_id)) {
                        toast.error("Bank already connected!");
                        return;
                      }
                      toast.success("Bank connected!");
                      fetchTransactions();
                      setTimeout(() => {
                        setCurrentDate(new Date());
                      }, 500);
                    }}
                  />
                ) : (
                  <HeaderButton
                    label="Loading bank link..."
                    icon={PlugZap}
                    color="bg-gray-600"
                    disabled
                  />
                )
              ) : (
                <HeaderButton
                  label="Disconnect"
                  icon={PlugZap}
                  onClick={() => setShowDisconnectModal(true)}
                  color="bg-red-600"
                />
              )}
            </div>
          }
        />
        <ConnectedBanks userId={user?.uid || ''} refetchBanks={refetchBanks} />
        {calendarReady && (
          <CalendarGrid
            events={allEvents} // <-- use allEvents here!
            calendarDays={calendarDays}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            simAnimatingDate={simAnimatingDate}
            onDayClick={(day) => {
              setSelectedDateDetail(day);
              setShowDayModal(true);
            }}
            simTargetDate={simTargetDate}
          />
        )}
        {/* Simulation Graph */}
        <BalanceChart key={simProgress.length} data={simProgress} />
        
        <ConfirmModal
          isOpen={showDisconnectModal}
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnectModal(false)}
          message="Are you sure you want to disconnect your bank account?"
        />
        <Modal isOpen={showDayModal} onClose={() => setShowDayModal(false)}>
          <div className="p-4 text-white">
            <h3 className="text-lg font-bold mb-2">Details for {selectedDateDetail?.date.toLocaleDateString()}</h3>
            <p className="text-sm">Balance: ${selectedDateDetail?.balance}</p>
            {selectedDateDetail?.events?.length ? (
              <ul className="mt-2 space-y-1">
                {selectedDateDetail.events.map((event, index) => (
                  <li key={index} className="text-sm text-white/80 flex justify-between">
                    <span>{event.title}</span>
                    <span className={event.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {event.amount >= 0 ? '+' : '-'}${Math.abs(event.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">No events on this day.</p>
            )}
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default FinancialForecastApp;

// NOTE: Do NOT manually include Plaid's script in index.html or anywhere else.
// PlaidConnectButton should only be rendered ONCE per page.
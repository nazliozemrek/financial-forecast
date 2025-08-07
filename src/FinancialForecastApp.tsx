import React, { useState, useEffect, useMemo } from 'react';
import { useFinancialForecastApp } from './hooks/useFinancialForecastApp';
import Header from './components/layout/Header';
import CalendarGrid from './components/calendar/CalendarGrid';
import BalanceChart from './components/simulation/BalanceChart';
import { Modal } from './components/shared/Modal';
import type { BalanceEntry, EventItem } from './types';
import { Toaster, toast } from 'react-hot-toast';
import PlaidConnectButton from './components/plaid/PlaidConnectButton';
import { HeaderButton } from './components/layout/HeaderButton';
import ConfirmModal from './components/modals/ConfirmModal';
import SplashScreen from './components/layout/SplashScreen';
import ConnectedBanks from './components/plaid/ConnectedBanks';
import QuickSimModal from './components/modals/QuickSimModal';
import SavedScenarios from './components/simulation/SavedScenarios';
import Login from './pages/Login';
import { PlugZap, Plus, Building2, Save, Download, Target } from 'lucide-react';
import { generateCalendarDays, parseLocalDate } from './utils/calendarUtils';
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
    allEvents,
    setAllEvents,
    bankConnections,
    setBankConnections,
    linkToken,
    refetchBanks,
    fetchTransactions,
    savedScenarios,
    setSavedScenarios
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
  const { linkToken: plaidLinkToken } = usePlaid();
  const { banks } = useBanks();

  // Initialize recurringTransactions as empty array since usePlaid no longer provides it
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);

  // Persistent simulation state - won't be cleared when switching tabs
  const [persistentSimProgress, setPersistentSimProgress] = useState<BalanceEntry[]>([]);
  const [lastSimulationDate, setLastSimulationDate] = useState<string>('');
  const [lastInitialBalance, setLastInitialBalance] = useState<number>(1000);

  const [showConnectedBanks, setShowConnectedBanks] = useState(false);
  const [showPlaidConnect, setShowPlaidConnect] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);


  useEffect(() => {
    if (linkToken && user && bankConnections.length > 0) {
      fetchTransactions();
      setTimeout(() => {
        setCurrentDate(new Date()); // force calendar re-render
      }, 500);
    }
  }, [linkToken, user, bankConnections]);

  useEffect(() => {
    // Auto-refresh calendar UI after new transactions are fetched
    if (transactions.length > 0) {
      setCurrentDate(new Date());
    }
  }, [transactions]);

  // Monitor savedScenarios state changes
  useEffect(() => {
    // console.log('📋 savedScenarios state changed:', { count: savedScenarios.length, scenarios: savedScenarios });
  }, [savedScenarios]);

  // Remove transactions from UI after disconnect
  useEffect(() => {
    if (bankConnections.length === 0) {
      setSimProgress([]);
      setCalendarDays([]);
      setAllEvents([]);
      setCalendarReady(false);
    }
  }, [bankConnections]);

  // Unified calendar update effect: handles transactions, recurringTransactions, events, and currentDate
  useEffect(() => {
    if (!transactions.length && !recurringTransactions.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    // Convert Plaid transactions to EventItem format for display
    const transactionEvents: EventItem[] = transactions.map((tx, idx) => {
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

    const expandedRecurring: EventItem[] = recurringTransactions.map((tx, idx) => ({
      id: 900000 + idx,
      date: tx.first_date || tx.last_date || today.toISOString().slice(0, 10),
      title: tx.description || tx.name || 'Recurring Transaction',
      amount: Math.abs(tx.amount || 0),
      type: tx.amount && tx.amount > 0 ? 'income' : 'expense',
      frequency: 'once' as const,
      startDate: tx.first_date || tx.last_date || today.toISOString().slice(0, 10),
      enabled: true,
      generated: true,
      isPlaid: true,
      recurring: false,
      source: 'Recurring Transaction',
      sourceIcon: '🔄'
    }));

    const allEvents = [...transactionEvents, ...expandedRecurring];

    const filtered = allEvents.filter(event => {
      const eventDate = event.date ? parseLocalDate(event.date) : null;
      if (!eventDate || isNaN(eventDate.getTime())) return false;
      return eventDate >= twoMonthsAgo;
    });

    const generated = generateCalendarDays(currentDate, filtered);
    setCalendarDays(generated);

    const merged = [...events, ...filtered];
    const deduped = dedupeEvents(merged);
    setAllEvents(deduped);

    // console.log("🔥 Calendar and events updated after transactions and recurring");
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
    setAllEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleQuickSimulate = () => {
    setShowQuickSim(true);
  };

  // Actual simulation logic
  const runSimulation = async () => {
    if (!quickSimDate) {
      toast.error('Please select a target date');
      return;
    }

    const targetDate = parseLocalDate(quickSimDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      toast.error('Target date must be in the future');
      return;
    }

    setIsSimAnimating(true);
    setSimTargetDate(targetDate);

    const enabledEvents = allEvents.filter(event => event.enabled);
    const progress: BalanceEntry[] = [];
    let currentBalance = initialBalance;

    // Generate entries from today to target date
    const currentDate = new Date(today);
    while (currentDate <= targetDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const eventsForDay = enabledEvents.filter(event => {
        if (event.frequency === 'once') {
          return event.startDate === dateStr;
        }
        // Handle recurring events
        return event.recurring && event.startDate === dateStr;
      });

      const dayAmount = eventsForDay.reduce((sum, event) => sum + event.amount, 0);
      currentBalance += dayAmount;

      progress.push({
        date: new Date(currentDate),
        balance: currentBalance,
        dayAmount,
        events: eventsForDay,
        isCurrentMonth: currentDate.getMonth() === today.getMonth()
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Save to persistent state FIRST
    setPersistentSimProgress(progress);
    setLastSimulationDate(quickSimDate);
    setLastInitialBalance(initialBalance);
    
    // Then update temporary state for animation
    setSimProgress(progress);
    setQuickSimResult(progress[progress.length - 1]);

    // console.log('📊 Simulation completed:', { 
    //   progressLength: progress.length, 
    //   persistentLength: progress.length,
    //   finalBalance: currentBalance 
    // });

    if (skipAnimation) {
      setIsSimAnimating(false);
      setSimAnimatingDate(null);
    } else {
      // Animate through the progress
      for (let i = 0; i < progress.length; i++) {
        setSimAnimatingDate(progress[i].date);
        setSimProgress(progress.slice(0, i + 1));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setIsSimAnimating(false);
      setSimAnimatingDate(null);
    }
  };

  // Save scenario
  const handleSaveScenario = async () => {
    // console.log('💾 Save scenario clicked!', { quickSimResult, persistentSimProgress });
    
    if (!quickSimResult || !user) {
      // console.log('❌ No quickSimResult or user available');
      toast.error('No simulation result to save or user not logged in');
      return;
    }
    
    if (persistentSimProgress.length === 0) {
      // console.log('❌ No persistent simulation data available');
      toast.error('No simulation data to save');
      return;
    }
    
    const scenario = {
      id: Date.now().toString(),
      name: `Scenario ${savedScenarios.length + 1}`,
      date: quickSimResult.date.toISOString(),
      balance: quickSimResult.balance,
      dayAmount: quickSimResult.dayAmount,
      events: quickSimResult.events,
      chartData: persistentSimProgress,
      initialBalance: initialBalance,
      targetDate: quickSimDate,
      createdAt: new Date().toISOString(),
    };
    
    try {
      // console.log('📊 Saving scenario to Firebase:', scenario);
      
      // Save to Firebase
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      await setDoc(doc(db, 'users', user.uid, 'savedScenarios', scenario.id), scenario);
      
      // Update local state
      setSavedScenarios(prev => {
        const newScenarios = [...prev, scenario];
        // console.log('💾 Updated savedScenarios:', { prevCount: prev.length, newCount: newScenarios.length });
        return newScenarios;
      });
      
      toast.success('Scenario saved with chart data!');
      
      // Close the modal after saving
      setShowQuickSim(false);
    } catch (error) {
      console.error('❌ Error saving scenario:', error);
      toast.error('Failed to save scenario. Please try again.');
    }
  };

  // Discard scenario
  const handleDiscardScenario = () => {
    setQuickSimResult(null);
    setSimProgress([]);
    setSimTargetDate(null);
  };

  // Test function to add a scenario manually (for debugging)
  const addTestScenario = () => {
    const testScenario = {
      id: Date.now().toString(),
      name: 'Test Scenario',
      date: new Date().toISOString(),
      balance: 1000,
      dayAmount: 100,
      events: [],
      chartData: [],
      initialBalance: 900,
      targetDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    
    // console.log('🧪 Adding test scenario:', testScenario);
    setSavedScenarios(prev => [...prev, testScenario]);
    toast.success('Test scenario added!');
  };

  if (loading) return <SplashScreen />;
  if (!user) return <Login />;

  // Filter out duplicate banks before showing PlaidConnectButton
  const isBankConnected = (institutionId: string) =>
    banks.some(bank => bank.institution?.institution_id === institutionId);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#0a0a0a]">
      {/* Header */}
      <Header
        currentDate={currentDate}
        onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
        onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
        onQuickSim={handleQuickSimulate}
        extraButtons={
          <div className="flex items-center space-x-1 md:space-x-2">
            {linkToken ? (
              <PlaidConnectButton
                linkToken={linkToken}
                user={user}
                onBankConnected={() => {
                  toast.success("Bank connected! Fetching transactions...");
                }}
              />
            ) : (
              <HeaderButton
                label="Connect Bank"
                icon={Plus}
                color="bg-white text-black hover:bg-gray-100"
                onClick={() => setShowPlaidConnect(true)}
              />
            )}
            {bankConnections.length > 0 && (
              <HeaderButton
                label={`Banks (${bankConnections.length})`}
                icon={Building2}
                color={showConnectedBanks ? "bg-[#007a33] text-white" : "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]"}
                onClick={() => setShowConnectedBanks(!showConnectedBanks)}
              />
            )}
            <HeaderButton
              label="Quick Simulate"
              icon={Target}
              color="bg-[#007a33] hover:bg-[#008a43] text-white"
              onClick={handleQuickSimulate}
            />
          </div>
        }
      />

      <main className="w-full max-w-6xl px-4">
        <Toaster position="top-center" />
        
        {/* Connected Banks Section - Only show when toggled */}
        {showConnectedBanks && bankConnections.length > 0 && (
          <div className="mb-6">
            <ConnectedBanks 
              bankConnections={bankConnections}
              onDisconnect={handleDisconnect}
            />
          </div>
        )}

        {/* Calendar Grid */}
        {calendarReady && (
          <CalendarGrid
            events={allEvents}
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

        {/* Balance Chart - Only show when there's simulation data */}
        {persistentSimProgress && persistentSimProgress.length > 0 && (
          <div className="mt-6">
            <BalanceChart data={persistentSimProgress} />
          </div>
        )}

        {/* Quick Sim Modal */}
        {showQuickSim && (
          <QuickSimModal
            quickSimDate={quickSimDate}
            setQuickSimDate={setQuickSimDate}
            initialBalance={initialBalance}
            setInitialBalance={setInitialBalance}
            quickSimResult={quickSimResult}
            skipAnimation={skipAnimation}
            setSkipAnimation={setSkipAnimation}
            onSimulate={runSimulation}
            onClose={() => setShowQuickSim(false)}
            events={allEvents}
            onToggleEvent={handleToggleEvent}
            onSaveScenario={handleSaveScenario}
          />
        )}

        {/* Plaid Connect Modal */}
        {showPlaidConnect && linkToken && (
          <Modal isOpen={showPlaidConnect} onClose={() => setShowPlaidConnect(false)}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Connect Bank Account</h3>
              <PlaidConnectButton
                linkToken={linkToken}
                user={user}
                onBankConnected={() => {
                  toast.success("Bank connected! Fetching transactions...");
                  setShowPlaidConnect(false);
                }}
              />
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
};

export default FinancialForecastApp;

// NOTE: Do NOT manually include Plaid's script in index.html or anywhere else.
// PlaidConnectButton should only be rendered ONCE per page.
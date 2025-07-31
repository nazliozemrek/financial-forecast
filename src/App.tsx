import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import EventModal from './components/EventModal';
import QuickSimModal from './components/QuickSimModal';
import EventSummary from './components/EventSummary';
import BalanceChart from './components/BalanceChart';
import { Modal } from './components/Modal';
import type { EventItem, BalanceEntry,SavedScenario } from './types';
import { Toaster, toast } from 'react-hot-toast';
import PlaidConnectButton from './components/PlaidConnectButton';
import HeaderButton from './components/HeaderButton';
import ConfirmModal from './components/ConfirmModal';
import SplashScreen from './components/SplashScreen';
import { Banknote, Download } from 'lucide-react';
import { PlugZap } from 'lucide-react';
import { detectRecurringTransactions } from './utils/detectRecurringTransactions';
import SavedScenarios from './components/SavedScenarios';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import ConnectedBanks from './components/ConnectedBanks';


const FinancialForecastApp = () => {

  const user = useAuth();
  const [loading,setLoading]=useState(true);

    useEffect(() => {
    const timer = setTimeout(() => setLoading(false),2500 );
    return () => clearTimeout(timer);
  },[]);


 

  const currentUser = { uid:'demo-user'};
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  // Remove accessToken state (migrated to bankConnections)
  // const [accessToken, setAccessToken] = useState<string | null>(null);
  const [bankConnections, setBankConnections] = useState<{ accessToken: string; institution?: { name: string; institution_id?: string } }[]>([]);
  
  // New: hasRealData is true if there are any bank connections or simProgress
  const hasRealData = bankConnections.length > 0 || simProgress.length > 0;
  
  



  







useEffect(() => {
  if (!user) return; // wait for user
  const fetchLinkToken = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid || 'demo-user' })
      });
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (err) {
      console.error('Failed to fetch link token', err);
    }
  };
  fetchLinkToken();
}, [user]);

// Remove old effect for single access token
const exchangePublicToken = async (public_token: string) => {
  if (!user) {
    console.warn("⚠️ No Firebase user found!");
    return;
  }
  try {
    const res = await fetch('/api/exchange_public_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_token,
        userId: user.uid,
      }),
    });
    const data = await res.json();
    console.log("✅ Access token saved:", data.access_token);
    setBankConnections(prev => [
      ...prev,
      {
        accessToken: data.access_token,
        institution: {
          name: data.institution?.name || 'Unknown',
          institution_id: data.institution?.institution_id
        }
      }
    ]);
  } catch (err) {
    console.error("❌ Failed to exchange token:", err);
  }
};


  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, title: 'Salary', amount: 3000, type: 'income', frequency: 'monthly', startDate: new Date(2025, 0, 1), dayOfMonth: 1, enabled: true },
    { id: 2, title: 'Rent', amount: -1200, type: 'expense', frequency: 'monthly', startDate: new Date(2025, 0, 1), dayOfMonth: 1, enabled: true },
    { id: 3, title: 'Groceries', amount: -150, type: 'expense', frequency: 'weekly', startDate: new Date(2025, 0, 6), dayOfWeek: 1, enabled: true },
    { id: 4, title: 'Coffee', amount: -5, type: 'expense', frequency: 'daily', startDate: new Date(2025, 0, 1), enabled: true }
  ]);

  const [savedScenarios, setSavedScenarios] = useState(() => {
    const saved = localStorage.getItem('simScenarios');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!simAnimatingDate) return;
    const simMonth = simAnimatingDate.getMonth();
    const simYear = simAnimatingDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    if (simMonth !== currentMonth || simYear !== currentYear) {
      setCurrentDate(new Date(simYear, simMonth, 1));
    }
  }, [simAnimatingDate]);

  const shouldEventOccur = (event: EventItem, date: Date): boolean => {
    const eventStart = new Date(event.startDate);
    if (date < eventStart || !event.enabled) return false;
    switch (event.frequency) {
      case 'once': return date.toDateString() === eventStart.toDateString();
      case 'daily': return true;
      case 'weekly': return date.getDay() === event.dayOfWeek;
      case 'monthly': return date.getDate() === event.dayOfMonth;
      default: return false;
    }
  };

  const calculateDailyBalances = (startDate: Date, endDate: Date): Record<string, Omit<BalanceEntry, 'date' | 'isCurrentMonth'>> => {
    const balances: Record<string, Omit<BalanceEntry, 'date' | 'isCurrentMonth'>> = {};
    let currentBalance = initialBalance;
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const dateStr = currentDay.toISOString().split('T')[0];
      const dayEvents = events.filter(e => shouldEventOccur(e, currentDay));
      const dayAmount = dayEvents.reduce((sum, e) => sum + e.amount, 0);
      currentBalance += dayAmount;
      balances[dateStr] = { balance: currentBalance, dayAmount, events: dayEvents };
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return balances;
  };

  const handleDayClick = (day: BalanceEntry) => {
    setSelectedDate(day.date);
    setSelectedDateDetail(day);
    setShowDayModal(true);
  };

  const handleQuickSim = () => {
    if (!quickSimDate) {
      toast.error("Please select a target date first.");
      return;
    }

    const [year, month, day] = quickSimDate.split('-').map(Number);
    const simDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    simDate.setHours(0, 0, 0, 0);

    if(simDate < today) { 
      toast.error("Target date cannot be in the past.");
      return;
    }

    const balances = calculateDailyBalances(today, simDate);
    const simDates: BalanceEntry[] = [];
    const tempDay = new Date(today);
    while (tempDay <= simDate) {
      const key = tempDay.toISOString().split('T')[0];
      if (balances[key]) {
        simDates.push({ date: new Date(tempDay), isCurrentMonth: true, ...balances[key] });
      }
      tempDay.setDate(tempDay.getDate() + 1);
    }

    if (simDates.length === 0) return;

    setShowQuickSim(false);
    setIsSimAnimating(true);
    setSimProgress([]);
    setQuickSimResult(null);
    setSimAnimatingDate(simDates[0].date);

    if (skipAnimation) {
      setSimProgress(simDates);
      setSimAnimatingDate(simDates[simDates.length - 1].date);
      setQuickSimResult(simDates[simDates.length - 1]);
      setIsSimAnimating(false);
      toast.success("Simulation complete.");
      return;
    }

    let i = 0;
    const animateNext = () => {
      if (i >= simDates.length) {
        const last = simDates[simDates.length - 1];
        setSimAnimatingDate(last.date);
        setTimeout(() => {
          setIsSimAnimating(false);
          setQuickSimResult(last);
        }, 300);
        return;
      }
      const current = simDates[i];
      setSimProgress(prev => [...prev, current]);
      setSimAnimatingDate(current.date);
      i++;
      setTimeout(animateNext, 400);
    };
    animateNext();
  };

// New: Fetch all bank accounts and all their transactions
const fetchTransactions = async () => {
  if (!user) {
    toast.error('User not loaded!');
    return;
  }
  try {
    // Fetch all bank accounts for the user
    const bankAccountsRef = collection(db, `users/${user.uid}/bankAccounts`);
    const bankSnapshot = await getDocs(bankAccountsRef);
    const accessTokens: string[] = [];
    bankSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.accessToken) accessTokens.push(data.accessToken);
    });

    if (accessTokens.length === 0) {
      toast.error('No bank accounts connected!');
      return;
    }

    // Fetch and merge transactions from all tokens
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

    // Optionally: detect recurring transactions from all merged transactions
    const recurring = detectRecurringTransactions(allTransactions);
    console.log('Detected Recurring Transactions:', recurring);
    const newRecurringEvents = recurring.map((r, index) => ({
      id: Date.now() + index,
      type: 'expense',
      enabled: true,
      ...r
    }));
    setEvents(prev => [...prev, ...newRecurringEvents]);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to fetch transactions');
  }
};

  const handleSaveScenario = () => {
    if (!quickSimResult) return;
    const name = prompt("Name this scenario:");
    if (!name) return;
    const newScenario = {
      id: crypto.randomUUID(),
      name,
      date: quickSimResult.date,
      balance: quickSimResult.balance,
      dayAmount: quickSimResult.dayAmount,
      events: quickSimResult.events
    };
    const updated = [...savedScenarios, newScenario];
    setSavedScenarios(updated);
    localStorage.setItem('simScenarios', JSON.stringify(updated));
    toast.success(`Scenario "${name}" saved!`);
  };

  const handleDeleteScenario = (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    const storageKey = `simScenarios-${currentUser.uid}`
    localStorage.setItem('simScenarios', JSON.stringify(updated));
    toast.success("Scenario deleted.");
  };

  const generateCalendarDays = (): BalanceEntry[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - last.getDay()));

    const balances = calculateDailyBalances(start, end);

    const eventMap = events.reduce((acc,event) => {
      const dateStr = event.startDate;
      if(!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(event);
      return acc;
    }, {} as Record<string,typeof events>);



    const days: BalanceEntry[] = [];
    const temp = new Date(start);
    while (temp <= end) {
      const key = temp.toISOString().split('T')[0];
      days.push({
        date: new Date(temp),
        isCurrentMonth: temp.getMonth() === month,
        ...(balances[key] || { balance: initialBalance, dayAmount: 0, events: [] })
      });
      temp.setDate(temp.getDate() + 1);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleAddEvent = (eventData: EventItem) => {
  const newItem: EventItem = {
    ...eventData,
    id: Date.now(),
    amount: parseFloat(eventData.amount.toString()) * (eventData.type === 'expense' ? -1 : 1),
    startDate: selectedDate,
    enabled: true  // <-- important
  };
  setEvents(prev => [...prev, newItem]);
  setShowEventModal(false);
};

const mapTransactionsToEvents = (transactions: any[]): EventItem[] => {
  return transactions.map((tx,index) => ({
    id: Date.now() + index,
    title: tx.name || 'Transaction',
    amount: tx.amount * -1,
    type : tx.amount > 0 ? 'income' as const : 'expense' as const,
    frequency: 'once',
    startDate: new Date(tx.date),
    isPlaid: true,
  }));
};
const handleDisconnect = async () => {
  // Disconnect all bank accounts (or you can prompt for which to disconnect)
  if (bankConnections.length === 0) {
    toast.error("No bank connections to disconnect.");
    return;
  }
  try {
    // Disconnect each bank connection
    for (const { accessToken } of bankConnections) {
      await fetch('http://localhost:3001/api/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });
    }
    setBankConnections([]);
    setShowDisconnectModal(false);
    toast.success('Disconnected all banks successfully');
  } catch (error) {
    console.error('❌ Error disconnecting:', error);
    toast.error('Failed to disconnect.');
  }
};

  // Handler for Plaid Connect
  const handleConnectBank = () => {
    const connectButton = document.querySelector<HTMLButtonElement>('button[data-plaid-link]');
    if (connectButton) {
      connectButton.click();
    } else {
      toast.error("Plaid Connect button not ready.");
    }
  };

  return (
    <>
      {loading ? (
        <SplashScreen />
      ) : !user ? (
        <Login />
      ) : (
        <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-[#1a1a1a] via-[#111827] to-[#0f172a]">
          <main className="w-full max-w-6xl px-4">
            <Toaster position="top-center" />
            <div className="safe-top">
              <div className="animate-fade-in duration-700 delay-150 pt-4 pb-28 max-w-[100%] sm:max-w-6xl mx-auto ">
                <Header
                  onAddEvent={() => setShowEventModal(true)}
                  onQuickSim={() => setShowQuickSim(true)}
                  currentDate={currentDate}
                  onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  extraButtons={
                    <div className="flex gap-3">
                      {linkToken && bankConnections.length === 0 ? (
                        <PlaidConnectButton
                          linkToken={linkToken}
                          // Remove setAccessToken, now using setBankConnections
                          onTransactionsFetched={(txs) => {
                            setTransactions(txs);
                            const recurring = detectRecurringTransactions(txs);
                            const newRecurringEvents = recurring.map((r,index) => ({
                              id:Date.now() + index,
                              type:'expense',
                              enabled: true,
                              ...r
                            }));
                            setEvents(prev => [...prev,...newRecurringEvents]);
                          }}
                          userId={user?.uid || 'demo-user'}
                          onSuccess={(token: string) => {
                            if (user?.uid) {
                              exchangePublicToken(token);
                            } else {
                              toast.error("User not loaded yet");
                            }
                          }}
                        />
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
                <ConnectedBanks userId={user?.uid || ''} />

          {quickSimDate && (
            <p className="text-white text-sm mb-4">
              🎯 <strong>Target Date Selected:</strong> {quickSimDate}
            </p>
          )}

          <div className='animate-fade-in'>
            {bankConnections.length > 0 && (
              <div className="text-white text-sm mt-4 mb-6">
                <h3 className="font-semibold mb-2">🔗 Connected Banks:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {bankConnections.map((bank, index) => (
                    <li key={index}>
                      {bank.institution?.name || 'Unnamed Bank'} - Token ending in ...{bank.accessToken.slice(-4)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasRealData ? (
              <>
                <CalendarGrid
                  calendarDays={calendarDays}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  simAnimatingDate={simAnimatingDate}
                  onDayClick={handleDayClick}
                />
                {simProgress.length > 0 && (
                  <BalanceChart data={simProgress} />
                )}
              </>
            ) : (
              <div className="text-white/60 text-center mt-10">
                Connect your Bank or run a Quick Sim to start visualizing your forecast.
              </div>
            )}
          </div>

          {hasRealData && (
            <EventSummary 
              events={events}
              onEdit={(event) => {
                setSelectedDate(new Date(event.startDate));
                setShowEventModal(true);
              }}
              onDelete={(id) => {
                setEvents(prev  => prev.filter(e => e.id !== id));
                toast.success('Event deleted successfully.');
              }}
              onToggleRecurring={(id) => {
                setEvents(prev => 
                  prev.map(e =>
                    e.id === id ? { ...e, recurring: !e.recurring } : e
                  )
                );
              }}
            />
          )}

          {transactions.length > 0 && (
            <div className="mt-6 text-white">
              <h3 className="text-lg font-bold mb-2">Recent Transactions</h3>
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {transactions.map((tx, i) => (
                  <li key={tx.transaction_id || i} className="bg-white/10 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{tx.name}</p>
                      <p className="text-sm text-white/70">
                        {tx.date} — {tx.personal_finance_category?.primary || 'Uncategorized'}
                      </p>
                    </div>
                    <span className={tx.amount < 0 ? "text-green-400" : "text-red-400"}>
                      ${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {quickSimResult && !isSimAnimating && (
            <div className="mt-6 bg-white/10 border border-white/20 p-4 rounded-xl text-white">
              <h3 className="text-lg font-bold mb-2">📊 Simulation Result</h3>
              {simProgress.length > 1 && <BalanceChart data={simProgress} />}
              <p><strong>Date:</strong> {quickSimResult.date.toLocaleDateString()}</p>
              <p>
                <strong>Balance:</strong>{" "}
                <span className={quickSimResult.balance >= 0 ? "text-green-400" : "text-red-400"}>
                  ${quickSimResult.balance.toFixed(2)}
                </span>
              </p>
              <p>
                <strong>Change on that day:</strong>{" "}
                <span className={quickSimResult.dayAmount >= 0 ? "text-green-400" : "text-red-400"}>
                  ${quickSimResult.dayAmount.toFixed(2)}
                </span>
              </p>
              <button
                onClick={handleSaveScenario}
                className="mt-4 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                💾 Save Scenario
              </button>
            </div>
          )}

          {showEventModal && (
            <EventModal
              onAdd={handleAddEvent}
              onClose={() => setShowEventModal(false)}
            />
          )}

          {showQuickSim && (
            <QuickSimModal
              quickSimDate={quickSimDate}
              setQuickSimDate={setQuickSimDate}
              initialBalance={initialBalance}
              setInitialBalance={setInitialBalance}
              quickSimResult={quickSimResult}
              onSimulate={handleQuickSim}
              onClose={() => {
                setShowQuickSim(false);
                setQuickSimResult(null);
                setQuickSimDate('');
              }}
              skipAnimation={skipAnimation}
              setSkipAnimation={setSkipAnimation}
              events={events}
              onToggleEvent={(id) =>
                setEvents((prev) =>
                  prev.map((event) =>
                    event.id === id ? { ...event, enabled: !event.enabled } : event
                  )
                )
              }
            />
          )}

          {currentUser && savedScenarios.length > 0 && (
            <SavedScenarios
              scenarios={savedScenarios}
              onLoad={(events) => setEvents(events)}
              onDelete={handleDeleteScenario}
            />
          )}

          {showDayModal && selectedDateDetail && (
            <Modal
              day={selectedDateDetail}
              onClose={() => setShowDayModal(false)}
            />
          )}
        </div>
        <ConfirmModal
          isOpen={showDisconnectModal}
          onConfirm={handleDisconnect}
          onCancel={() => setShowDisconnectModal(false)}
          message="Are you sure you want to disconnect your bank account?"
        />
      </div>
      </main>
    </div>
  )}

</>

  );
};

export default FinancialForecastApp;

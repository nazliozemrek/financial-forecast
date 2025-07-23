import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import EventModal from './components/EventModal';
import QuickSimModal from './components/QuickSimModal';
import EventSummary from './components/EventSummary';
import BalanceChart from './components/BalanceChart';
import { Modal } from './components/Modal';
import type { EventItem, BalanceEntry } from './types';
import { Toaster, toast } from 'react-hot-toast';
import { usePlaidLink } from 'react-plaid-link';
import PlaidConnectButton from './components/PlaidConnectButton';
import HeaderButton from './components/HeaderButton';
import { Banknote , Download } from 'lucide-react';

const FinancialForecastApp = () => {
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
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
  const fetchLinkToken = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user' })
      });
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (err) {
      console.error('Failed to fetch link token', err);
    }
  };
  fetchLinkToken();
}, []);

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

  const fetchTransactions = async () => {
  const access_token = localStorage.getItem('access_token');
  if (!access_token) {
    toast.error('No access token found!');
    return;
  }

  try {
    const res = await fetch('http://localhost:3001/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token }),
    });

    const transactions = await res.json();
    setTransactions(transactions);
    toast.success(`Fetched ${transactions.length} transactions`);
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
      id: Date.now(),
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

  const handleDeleteScenario = (id: number) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
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


  return (
    <>
      {/* {linkToken && (
        <PlaidConnectButton linkToken={linkToken} />
      )}
      <button
        onClick={fetchTransactions}
        className="mb-4 px-4 py-2 ml-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
      >
        Fetch Transactions
      </button> */}

      <Toaster position="top-center" />
      <div className="min-h-screen font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-6xl mx-auto p-6">
          <Header
            onAddEvent={() => setShowEventModal(true)}
            onQuickSim={() => setShowQuickSim(true)}
            currentDate={currentDate}
            onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            extraButtons={
              <div className="flex gap-3">
                {linkToken &&( 
                  <HeaderButton
                    label="Connect Bank"
                    icon={Banknote}
                    onClick={() => {}}
                    color="bg-blue-600" 
                  />
                )}
                <HeaderButton
                  label="Fetch Transactions"
                  icon={Download}
                  onClick={fetchTransactions}
                  color="bg-yellow-500"
                />
              </div>
            }
          />
          {quickSimDate && (
            <p className="text-white text-sm mb-4">
              🎯 <strong>Target Date Selected:</strong> {quickSimDate}
            </p>
          )}

          <CalendarGrid
            calendarDays={calendarDays}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            simAnimatingDate={simAnimatingDate}
            onDayClick={handleDayClick}
          />
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
              onAdd ={handleAddEvent}
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

          <EventSummary 
            events={events}
            onEdit={(event) => {
              setSelectedDate(new Date(event,startDate));
              setShowEventModal(true);
            }}
            onDelete={(id) => {
              setEvents(prev  => prev.filter(e => e.id !== id));
              toast.success('Event deleted successfully.');
            }}

            onToggleRecurring={(id) => {
              setEvents(prev => 
                prev.map(e =>
                  e.id === id ? { ...e, recurring: e.recurring === false ? true : false} : e
                )
              );
            }}
            />

          {savedScenarios.length > 0 && (
            <div className="mt-6 text-white">
              <h3 className="text-lg font-bold mb-2">💼 Saved Scenarios</h3>
              <ul className="space-y-2">
                {savedScenarios.map((s) => (
                  <li key={s.id} className="bg-white/10 p-3 rounded-xl flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-white/70">{new Date(s.date).toLocaleDateString()} — ${s.balance.toFixed(2)}</p>
                      {s.events?.length > 0 && (
                        <ul className="text-xs mt-1 list-disc ml-4">
                          {s.events.map((e: any, i: number) => (
                            <li key={i}>{e.title}: ${e.amount.toFixed(2)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteScenario(s.id)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      🗑 Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showDayModal && selectedDateDetail && (
            <Modal
              day={selectedDateDetail}
              onClose={() => setShowDayModal(false)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FinancialForecastApp;

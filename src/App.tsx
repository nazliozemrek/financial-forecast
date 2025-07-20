import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import EventModal from './components/EventModal';
import QuickSimModal from './components/QuickSimModal';
import EventSummary from './components/EventSummary';
import BalanceChart from './components/BalanceChart';
import type { EventItem, BalanceEntry } from './types';

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
  const [savedScenarios, setSavedScenarios] = useState(() => {
    const saved = localStorage.getItem('simScenarios');
    return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, title: 'Salary', amount: 3000, type: 'income', frequency: 'monthly', startDate: new Date(2025, 0, 1), dayOfMonth: 1, enabled: true },
    { id: 2, title: 'Rent', amount: -1200, type: 'expense', frequency: 'monthly', startDate: new Date(2025, 0, 1), dayOfMonth: 1, enabled: true },
    { id: 3, title: 'Groceries', amount: -150, type: 'expense', frequency: 'weekly', startDate: new Date(2025, 0, 6), dayOfWeek: 1, enabled: true },
    { id: 4, title: 'Coffee', amount: -5, type: 'expense', frequency: 'daily', startDate: new Date(2025, 0, 1), enabled: true }
  ]);

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
    if (date < eventStart || event.enabled === false) return false;
    switch (event.frequency) {
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

  const handleQuickSim = () => {
    if (!quickSimDate) return;
    const [year, month, day] = quickSimDate.split('-').map(Number);
    const simDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    simDate.setHours(0, 0, 0, 0);

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

  const handleAddEvent = (eventData: EventItem) => {
    const newItem: EventItem = {
      ...eventData,
      id: Date.now(),
      amount: parseFloat(eventData.amount.toString()) * (eventData.type === 'expense' ? -1 : 1),
      startDate: selectedDate
    };
    setEvents([...events, newItem]);
    setShowEventModal(false);
  };

  const handleDeleteScenario = (id: number) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('simScenarios', JSON.stringify(updated));
  };

  const handleSaveScenario = () => {
    const name = prompt("Name this scenario:");
    if (!name || !quickSimResult) return;

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
  };

  const handleToggleEvent = (id: number) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === id ? { ...event, enabled: !event.enabled } : event
      )
    );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto p-6">
        <Header
          onAddEvent={() => setShowEventModal(true)}
          onQuickSim={() => setShowQuickSim(true)}
          currentDate={currentDate}
          onPrevMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          onNextMonth={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
        />

        <CalendarGrid
          calendarDays={calendarDays}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          simAnimatingDate={simAnimatingDate}
        />

        {quickSimResult && !isSimAnimating && (
          <div className="mt-6 bg-white/10 border border-white/20 p-4 rounded-xl text-white">
            <h3 className="text-lg font-bold mb-2">📊 Simulation Result</h3>
            {simProgress.length > 1 && <BalanceChart data={simProgress} />}
            <p><strong>Date:</strong> {quickSimResult.date.toLocaleDateString()}</p>
            <p><strong>Balance:</strong> ${quickSimResult.balance.toFixed(2)}</p>
            <p><strong>Change:</strong> ${quickSimResult.dayAmount.toFixed(2)}</p>
            <button onClick={handleSaveScenario} className="mt-4 bg-green-600 px-4 py-2 rounded-lg">💾 Save Scenario</button>
          </div>
        )}

        {showEventModal && (
          <EventModal onAdd={handleAddEvent} onClose={() => setShowEventModal(false)} />
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
            onToggleEvent={handleToggleEvent}
          />
        )}

        <EventSummary events={events} />

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
                  <button onClick={() => handleDeleteScenario(s.id)} className="text-red-400 hover:text-red-600 text-sm">🗑 Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialForecastApp;

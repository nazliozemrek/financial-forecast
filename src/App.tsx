import React, { useState } from 'react';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import EventModal from './components/EventModal';
import QuickSimModal from './components/QuickSimModal';
import EventSummary from './components/EventSummary';
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

  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, title: 'Salary', amount: 3000, type: 'income', frequency: 'monthly', startDate: new Date(2025, 0, 1), dayOfMonth: 1 },
    { id: 2, title: 'Rent', amount: -1200, type: 'expense', frequency: 'monthly', startDate: new Date(2025, 0, 1), dayOfMonth: 1 },
    { id: 3, title: 'Groceries', amount: -150, type: 'expense', frequency: 'weekly', startDate: new Date(2025, 0, 6), dayOfWeek: 1 },
    { id: 4, title: 'Coffee', amount: -5, type: 'expense', frequency: 'daily', startDate: new Date(2025, 0, 1) }
  ]);

  const shouldEventOccur = (event: EventItem, date: Date): boolean => {
    const eventStart = new Date(event.startDate);
    if (date < eventStart) return false;
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
      balances[dateStr] = {
        balance: currentBalance,
        dayAmount,
        events: dayEvents
      };
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return balances;
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

  const handleQuickSim = () => {
    if (!quickSimDate) return;

    const [year, month, day] = quickSimDate.split('-').map(Number);
    const simDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    simDate.setHours(0, 0, 0, 0);

    console.log("📅 User selected target date:", simDate.toISOString().split("T")[0]);
    console.log("🔵 Today (sim start):", today.toISOString().split("T")[0]);

    const balances = calculateDailyBalances(today, simDate);
    const simDates: BalanceEntry[] = [];

    const tempDay = new Date(today);
    while (tempDay <= simDate) {
      const key = tempDay.toISOString().split('T')[0];
      if (balances[key]) {
        simDates.push({
          date: new Date(tempDay),
          isCurrentMonth: true,
          ...balances[key]
        });
      }
      tempDay.setDate(tempDay.getDate() + 1);
    }

    console.log("✅ SimDates Length:", simDates.length);
    console.log("📅 Dates in Sim:", simDates.map(d => d.date.toISOString().split('T')[0]));

    if (simDates.length === 0) return;

    setShowQuickSim(false);
    setIsSimAnimating(true);
    setSimProgress([]);
    setQuickSimResult(null);
    setSimAnimatingDate(simDates[0].date);

    let i = 0;
    const animateNext = () => {
      if (i >= simDates.length) {
        const last = simDates[simDates.length - 1];
        console.log("🟢 Animation complete. Final date:", last.date.toISOString().split("T")[0]);
        setSimAnimatingDate(last.date);
        setTimeout(() => {
          setIsSimAnimating(false);
          setQuickSimResult(last);
        }, 300);
        return;
      }
      const current = simDates[i];
      console.log("🟢 Animating:", current.date.toISOString().split("T")[0]);
      setSimProgress(prev => [...prev, current]);
      setSimAnimatingDate(current.date);
      i++;
      setTimeout(animateNext, 400);
    };

    animateNext();
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
        />

        {quickSimResult && !isSimAnimating && (
          <div className="mt-6 bg-white/10 border border-white/20 p-4 rounded-xl text-white">
            <h3 className="text-lg font-bold mb-2">📊 Simulation Result</h3>
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
            {quickSimResult.events.length > 0 && (
              <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-white/80">
                {quickSimResult.events.map((e, i) => (
                  <li key={i}>
                    {e.title} ({e.type}) {e.amount > 0 ? '+' : ''}${e.amount.toFixed(2)}
                  </li>
                ))}
              </ul>
            )}
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
          />
        )}

        <EventSummary events={events} />
      </div>
    </div>
  );
};

export default FinancialForecastApp;

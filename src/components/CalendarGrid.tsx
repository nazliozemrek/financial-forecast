import React from 'react';
import type { FC } from 'react';
import type { BalanceEntry } from '../types'; // Make sure this file exists and exports BalanceEntry

interface CalendarGridProps {
  calendarDays: BalanceEntry[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  simAnimatingDate: Date | null;
}

const CalendarGrid: FC<CalendarGridProps> = ({
  calendarDays,
  selectedDate,
  setSelectedDate,
  simAnimatingDate
}) => {
  const isSameDay = (d1: Date, d2: Date): boolean =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return isSameDay(date, today);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mt-4">
      <div className="grid grid-cols-7 gap-4 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-4 text-white/80 font-semibold text-sm uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4">
        {calendarDays.map((day, i) => (
          <div
            key={i}
            className={`relative p-4 min-h-28 rounded-xl transition-all cursor-pointer
              ${day.isCurrentMonth ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-white/5 hover:bg-white/10 border-white/10'}
              ${isToday(day.date) ? 'ring-2 ring-blue-500' : ''}
              ${isSameDay(day.date, selectedDate) ? 'border-2 border-green-400' : ''}
              ${isSameDay(day.date, simAnimatingDate ?? new Date(0)) ? 'ring-2 ring-yellow-400' : ''}
              border`}
            onClick={() => setSelectedDate(day.date)}
          >
            <div className="text-white font-semibold mb-2">{day.date.getDate()}</div>
            <div className={`text-sm font-bold px-2 py-1 rounded-lg ${day.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${day.balance.toFixed(0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;

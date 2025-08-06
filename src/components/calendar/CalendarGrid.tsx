import React from 'react';
import type { FC } from 'react';
import type { BalanceEntry,EventItem } from '../../types';
import { CalendarHeart, CalendarX } from 'lucide-react';

interface Props {
  calendarDays: BalanceEntry[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  simAnimatingDate: Date | null;
  onDayClick?: (day: BalanceEntry) => void;
  simTargetDate: Date | null;
  events:EventItem[];
}

const CalendarGrid: FC<Props> = ({
  calendarDays,
  selectedDate,
  setSelectedDate,
  simAnimatingDate,
  onDayClick,
  simTargetDate,
  events,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-7 gap-2 my-4 text-white">
      {calendarDays.map((day, index) => {
        const isToday = new Date(day.date).toDateString() === today.toDateString();
        const isSelected = new Date(day.date).toDateString() === selectedDate.toDateString();
        const isAnimating = simAnimatingDate && new Date(day.date).toDateString() === simAnimatingDate.toDateString();
        const isSimTarget = simTargetDate && new Date(day.date).toDateString() === simTargetDate.toDateString();
        const isPast = new Date(day.date) < today;
        const hasEvent = events.some(event => new Date(event.date).toDateString() === new Date(day.date).toDateString());
        const hasRecurring = day.events.some(e => e.recurring || e.generated);

        return (
          <div
            key={index}
            className={`p-2 rounded-lg text-sm cursor-pointer transition-all duration-150 shadow-md flex flex-col items-center border
              ${isAnimating ? 'bg-yellow-600 animate-pulse' :
                isSimTarget ? 'bg-blue-700' :
                isSelected ? 'bg-blue-500' :
                isPast ? 'bg-gray-700 text-gray-400 cursor-not-allowed' :
                'bg-gray-900 hover:bg-gray-800'}
            `}
            onClick={() => {
              if (!isPast) {
                setSelectedDate(new Date(day.date));
                if (onDayClick) onDayClick(day);
              }
            }}
          >
            <div>{new Date(day.date).getDate()}</div>
            <div className="flex items-center space-x-1 mt-1">
              {day.dayAmount > 0 && <CalendarHeart size={12} className="text-green-400" />}
              {day.dayAmount < 0 && <CalendarX size={12} className="text-red-400" />}
              {hasRecurring && <span className="text-yellow-400 text-xs">🔁</span>}
              <span className="text-xs">{day.dayAmount !== 0 ? `$${day.dayAmount.toFixed(2)}` : ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;
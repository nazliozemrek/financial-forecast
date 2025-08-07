import React from 'react';
import type { FC } from 'react';
import type { BalanceEntry, EventItem } from '../../types';
import { CalendarHeart, CalendarX, PlusCircle } from 'lucide-react';
import { parseLocalDate } from '../../utils/calendarUtils';

interface Props {
  calendarDays: BalanceEntry[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  simAnimatingDate: Date | null;
  onDayClick?: (day: BalanceEntry) => void;
  simTargetDate: Date | null;
  events: EventItem[];
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
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-sm font-semibold text-white bg-[#1a1a1a] border border-[#333] rounded-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayDate = typeof day.date === 'string' ? new Date(day.date) : day.date;
          const isToday = dayDate.toDateString() === today.toDateString();
          const isSelected = dayDate.toDateString() === selectedDate.toDateString();
          const isAnimating = simAnimatingDate && dayDate.toDateString() === simAnimatingDate.toDateString();
          const isSimTarget = simTargetDate && dayDate.toDateString() === simTargetDate.toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-[140px] p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                isAnimating 
                  ? 'bg-[#007a33]/20 border-[#007a33]/40 shadow-lg animate-pulse'
                  : isSimTarget
                  ? 'bg-[#007a33]/15 border-[#007a33]/30 shadow-lg'
                  : isSelected
                  ? 'bg-[#007a33]/10 border-[#007a33]/30 shadow-lg'
                  : day.isCurrentMonth
                    ? isToday
                      ? 'bg-[#007a33]/10 border-[#007a33]/20 shadow-md'
                      : 'bg-[#1a1a1a] border-[#333] hover:bg-[#2a2a2a]'
                    : 'bg-[#0f0f0f] border-[#333] text-gray-500'
              }`}
              onClick={() => {
                if (onDayClick) onDayClick(day);
                setSelectedDate(dayDate);
              }}
            >
              {/* Day Number */}
              <div className={`text-sm font-semibold mb-1 ${
                day.isCurrentMonth 
                  ? (isToday || isSelected || isSimTarget || isAnimating)
                    ? 'text-white' 
                    : 'text-white'
                  : 'text-gray-500'
              }`}>
                {dayDate.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {day.events.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`text-xs p-1 rounded border-l-2 ${
                      event.type === 'income'
                        ? 'bg-[#1a1a1a] border-[#007a33]/30 text-white'
                        : 'bg-[#1a1a1a] border-[#ff6b6b]/30 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] flex-shrink-0">{event.sourceIcon || '📊'}</span>
                      <span className="truncate font-medium text-[10px]">{event.title}</span>
                    </div>
                    <div className={`text-[10px] font-bold ${
                      event.type === 'income' ? 'text-[#007a33]' : 'text-[#ff6b6b]'
                    }`}>
                      {event.type === 'income' ? '+' : '-'}${Math.abs(event.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-[10px] text-gray-400 text-center">
                    +{day.events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;

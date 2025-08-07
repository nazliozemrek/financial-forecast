import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import type { BalanceEntry, EventItem } from '../types';

/**
 * Safely parse a date string in YYYY-MM-DD format to a Date object in local timezone
 * This prevents timezone conversion issues that can cause dates to shift by one day
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in local timezone to avoid UTC conversion issues
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Format a date to YYYY-MM-DD string in local timezone
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateCalendarDays(
  currentMonth: Date,
  events: EventItem[],
  baseBalance = 1000
): BalanceEntry[] {
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  let runningBalance = baseBalance;

  const daysWithData = days.map((day) => {
    const eventsForDay = events.filter((event) => {
      const eventDate = parseLocalDate((event.date || event.startDate).slice(0, 10));
      return isSameDay(eventDate, day);
    });

    const netDayAmount = eventsForDay.reduce(
      (sum, e) => sum + (e.type === 'expense' ? -e.amount : e.amount),
      0
    );

    runningBalance += netDayAmount;

    return {
      date: day,
      balance: parseFloat(runningBalance.toFixed(2)),
      dayAmount: parseFloat(netDayAmount.toFixed(2)),
      events: eventsForDay,
      isCurrentMonth: isSameMonth(day, currentMonth),
    };
  });

  return daysWithData;
}
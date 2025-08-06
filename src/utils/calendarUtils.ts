import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
} from 'date-fns';
import type { BalanceEntry, EventItem } from '../types';

export function generateCalendarDays(
  currentMonth: Date,
  events: EventItem[],
  baseBalance = 1000
): BalanceEntry[] {
  console.log("🎯 Events received by generateCalendarDays:", events); 
  console.log("generateCalendarDays triggered with", events.length, "events");

  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  let runningBalance = baseBalance;

  const daysWithData = days.map((day) => {
    const eventsForDay = events.filter((event) => {
      const eventDate = parseISO(event.date || event.startDate); // support both `date` and `startDate`
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

  console.log("📅 Calendar generated for days:", daysWithData);
  return daysWithData;
}
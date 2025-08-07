// src/utils/groupEventsByDay.ts
import type { EventItem } from '../types';

export type GroupedEvent = EventItem & { __count: number };

export function groupEventsByDay(events: EventItem[]): Record<string, GroupedEvent[]> {
  const grouped: Record<string, GroupedEvent[]> = {};

  for (const event of events) {
    const date = event.startDate || event.startDate;

    if (!grouped[date]) grouped[date] = [];

    const match = grouped[date].find(
      e =>
        e.title === event.title &&
        e.amount === event.amount &&
        e.type === event.type &&
        e.frequency === event.frequency
    );

    if (match) {
      match.__count += 1;
    } else {
      grouped[date].push({ ...event, __count: 1 });
    }
  }

  return grouped;
}
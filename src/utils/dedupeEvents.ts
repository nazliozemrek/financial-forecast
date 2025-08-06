import type { EventItem } from '../types';

export function dedupeEvents(events: EventItem[]): EventItem[] {
  const seen = new Set<string>();
  return events.filter(event => {
    const key = JSON.stringify({
      title: event.title,
      amount: event.amount,
      startDate: event.startDate,
      type: event.type,
    });

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
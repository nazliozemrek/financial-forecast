import type { EventItem } from '../types';

export function dedupeEvents(events: EventItem[]): EventItem[] {
  const seen = new Set<string>();
  const deduped: EventItem[] = [];
  
  events.forEach(event => {
    // Create a more specific key that includes source information
    const key = JSON.stringify({
      title: event.title,
      amount: event.amount,
      startDate: event.startDate,
      type: event.type,
      frequency: event.frequency,
      isPlaid: event.isPlaid,
      recurring: event.recurring,
      generated: event.generated,
    });

    if (!seen.has(key)) {
      seen.add(key);
      // Add source tag for better identification
      const taggedEvent = {
        ...event,
        source: getEventSource(event),
        sourceIcon: getEventSourceIcon(event),
      };
      deduped.push(taggedEvent);
    }
  });
  
  return deduped;
}

function getEventSource(event: EventItem): string {
  if (event.isPlaid && event.recurring) return 'Recurring Bank Transaction';
  if (event.isPlaid) return 'Bank Transaction';
  if (event.generated) return 'Generated Forecast';
  return 'User Added';
}

function getEventSourceIcon(event: EventItem): string {
  if (event.isPlaid && event.recurring) return '🔄';
  if (event.isPlaid) return '🏦';
  if (event.generated) return '📊';
  return '✏️';
}
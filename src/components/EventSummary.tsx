import type { EventItem } from '../types';
import { Repeat, Edit2, Trash2 } from 'lucide-react';

interface EventSummaryProps {
  event: EventItem;
  onToggleRecurring: (id: string) => void;
  onEdit: (event: EventItem) => void;
  onDelete: (id: string) => void;
}

export function EventSummary({ event, onToggleRecurring, onEdit, onDelete }: EventSummaryProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div>
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <p className="text-sm text-gray-500">{event.date}</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleRecurring(event.id)}
          className={`p-1 rounded-md border text-xs ${
            event.recurring
              ? 'border-green-400 text-green-400'
              : 'border-white/30 text-white/50'
          }`}
          title="Toggle recurring"
          aria-label="Toggle recurring"
        >
          <Repeat className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(event)}
          className="text-blue-400 hover:text-blue-500"
          title="Edit event"
          aria-label="Edit event"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(event.id)}
          className="text-red-400 hover:text-red-500"
          title="Delete event"
          aria-label="Delete event"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
import React from 'react';
import { Calendar,DollarSign, Edit2, Trash2, Repeat } from 'lucide-react';
import type { EventItem } from '../types';

interface EventSummaryProps {
  events: EventItem[];
  onEdit?: (event: EventItem) => void;
  onDelete?: (id: number) => void;
  onToggleRecurring?: (id: number) => void;
}

const EventSummary: React.FC<EventSummaryProps> = ({ events, onEdit, onDelete, onToggleRecurring }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mt-6">
      <Calendar className="w-8 h-8 text-white"/>
      <h3 className="text-xl font-bold text-white mb-4"> Active Events</h3>
      <div className="space-y-3">
        {events.map(event => (
          <div
            key={event.id}
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  event.amount >= 0
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="font-medium text-white">{event.title}</span>
                <span className="text-sm text-white/60 ml-2">({event.frequency})</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`font-bold text-lg ${
                  event.amount >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                ${Math.abs(event.amount).toFixed(2)}
              </span>

              {onToggleRecurring && (
                <button
                  onClick={() => onToggleRecurring(event.id)}
                  className={`p-1 rounded-md border text-xs ${
                    event.recurring
                      ? 'border-green-400 text-green-400'
                      : 'border-white/30 text-white/50'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(event)}
                  className="text-blue-400 hover:text-blue-500"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(event.id)}
                  className="text-red-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventSummary;

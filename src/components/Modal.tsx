import React from 'react';
import { X, Coffee, Home, ShoppingCart, DollarSign, CalendarClock } from 'lucide-react';
import type { BalanceEntry, EventItem } from '../types';

interface ModalProps {
  day: BalanceEntry;
  onClose: () => void;
}

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('coffee')) return <Coffee className="w-4 h-4" />;
  if (t.includes('rent') || t.includes('home')) return <Home className="w-4 h-4" />;
  if (t.includes('grocery') || t.includes('market')) return <ShoppingCart className="w-4 h-4" />;
  if (t.includes('salary') || t.includes('pay') || t.includes('income')) return <DollarSign className="w-4 h-4" />;
  return <CalendarClock className="w-4 h-4" />;
};

export const Modal = ({ day, onClose }: ModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-xl max-w-md w-full relative text-white shadow-2xl">
        <button onClick={onClose} className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all shadow-md">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">
          Events on {day.date.toLocaleDateString()}
        </h2>

        {day.events.length === 0 ? (
          <p className="text-sm text-white/70">No events on this day.</p>
        ) : (
          <ul className="space-y-2">
            {day.events.map((event: EventItem, idx: number) => (
              <li key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIcon(event.title)}
                  <span>{event.title}</span>
                </div>
                <span className={event.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ${Math.abs(event.amount).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

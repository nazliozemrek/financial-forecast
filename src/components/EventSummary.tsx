import React from 'react';
import { DollarSign } from 'lucide-react';

const EventSummary = ({ events }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mt-6">
      <h3 className="text-xl font-bold text-white mb-4">Active Events</h3>
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${event.amount >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="font-medium text-white">{event.title}</span>
                <span className="text-sm text-white/60 ml-2">({event.frequency})</span>
              </div>
            </div>
            <span className={`font-bold text-lg ${event.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${Math.abs(event.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventSummary;

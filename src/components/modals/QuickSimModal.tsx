import React from 'react';
import type { BalanceEntry, EventItem } from '../../types';

interface QuickSimModalProps {
  quickSimDate: string;
  setQuickSimDate: (date: string) => void;
  initialBalance: number;
  setInitialBalance: (value: number) => void;
  quickSimResult: BalanceEntry | null;
  skipAnimation: boolean;
  setSkipAnimation: (value: boolean) => void;
  onSimulate: () => void;
  onClose: () => void;
  events: EventItem[];
  onToggleEvent: (id: number) => void;
}

const QuickSimModal: React.FC<QuickSimModalProps> = ({
  quickSimDate,
  setQuickSimDate,
  initialBalance,
  setInitialBalance,
  quickSimResult,
  skipAnimation,
  setSkipAnimation,
  onSimulate,
  onClose,
  events,
  onToggleEvent,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md text-white space-y-5">
        <h3 className="text-xl font-bold">Quick Balance Simulation</h3>

        <div>
          <label className="text-sm">Target Date</label>
          <input
            type="date"
            value={quickSimDate}
            onChange={(e) => setQuickSimDate(e.target.value)}
            className="w-full mt-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white"
          />
        </div>

        <div>
          <label className="text-sm text-white mb-1 block">Initial Balance</label>
          <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
              <input
                type="text"
                inputMode="numeric"
                className="pl-6 pr-3 py-2 w-full bg-white/10 border border-white/30 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
                
                
              />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="skipAnimation"
            checked={skipAnimation}
            onChange={(e) => setSkipAnimation(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="skipAnimation">Skip animation and show results instantly</label>
        </div>

        <div className="text-sm">
          <p className="font-semibold mb-2">Toggle Events:</p>
          <ul className="space-y-2 max-h-40 overflow-auto pr-2">
            {events.map((event) => (
              <li
                key={event.id}
                onClick={() => onToggleEvent(event.id)}
                className={`cursor-pointer px-3 py-2 rounded-xl border text-sm flex justify-between items-center ${
                  event.enabled
                    ? 'bg-green-500/20 hover:bg-green-500/30'
                    : 'bg-red-500/10 hover:bg-red-500/20 text-white/60'
                }`}
              >
                <span>{event.title}</span>
                <span>{event.enabled ? '✅' : '🚫'}</span>
              </li>
            ))}
          </ul>
        </div>

        {quickSimResult && (
          <div className="bg-white/10 p-4 rounded-xl text-sm text-white space-y-2 border border-white/20">
            <p><strong>Date:</strong> {new Date(quickSimResult.date).toLocaleDateString()}</p>
            <p className={quickSimResult.balance >= 0 ? 'text-green-400' : 'text-red-400'}>
              <strong>Projected Balance:</strong> ${quickSimResult.balance.toFixed(2)}
            </p>
            {quickSimResult.dayAmount !== 0 && (
              <p className={quickSimResult.dayAmount > 0 ? 'text-green-400' : 'text-red-400'}>
                <strong>Day Change:</strong> ${quickSimResult.dayAmount.toFixed(2)}
              </p>
            )}
            {quickSimResult.events?.length > 0 && (
              <ul className="list-disc ml-5">
                {quickSimResult.events.map((e, idx) => (
                  <li key={idx}>{e.title} (${e.amount.toFixed(2)})</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={onSimulate}
            className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all shadow-md"
          >
            Simulate
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickSimModal;

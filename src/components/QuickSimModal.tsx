import React from 'react';
import type { BalanceEntry } from '../types';

interface QuickSimModalProps {
  quickSimDate: string;
  setQuickSimDate: (date: string) => void;
  initialBalance: number;
  setInitialBalance: (value: number) => void;
  quickSimResult: BalanceEntry | null;
  skipAnimation: boolean;
  setSkipAnimation?: (value: boolean) => void;
  onSimulate: () => void;
  onClose: () => void;
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
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-6">Quick Balance Simulation</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="simDate" className="text-white text-sm">Target Date</label>
            <input
              id="simDate"
              type="date"
              value={quickSimDate}
              onChange={(e) => setQuickSimDate(e.target.value)}
              title="Target date for simulation"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
            />
          </div>

          <div>
            <label htmlFor="startBalance" className="text-white text-sm">Initial Balance</label>
            <input
              id="startBalance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
              title="Starting balance"
              placeholder="e.g. 1000"
              step="0.01"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
            />
          </div>

          {quickSimResult && (
            <div className="bg-white/10 p-4 rounded-xl text-sm text-white space-y-2">
              {quickSimResult.error ? (
                <p className="text-red-400">{quickSimResult.error}</p>
              ) : (
                <>
                  <p><strong>Date:</strong> {new Date(quickSimResult.date).toLocaleDateString()}</p>
                  <p className={`${quickSimResult.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <strong>Projected Balance:</strong> ${quickSimResult.balance.toFixed(2)}
                  </p>
                  {quickSimResult.dayAmount !== 0 && (
                    <p className={`${quickSimResult.dayAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <strong>Day Change:</strong> ${quickSimResult.dayAmount.toFixed(2)}
                    </p>
                  )}
                  {quickSimResult.events?.length > 0 && (
                    <ul className="list-disc ml-5">
                      {quickSimResult.events.map((e: any, idx: number) => (
                        <li key={idx}>{e.title} (${e.amount.toFixed(2)})</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>
          <div>
              <label className="inline-flex items-center space-x-2 text-white text-sm mt-2">
                <input
                  type="checkbox"
                  id="skipAnimation"
                  checked={skipAnimation}
                  onChange={(e) => setSkipAnimation?.(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-500"
                />
                <span>Skip animation and show results instantly</span>
              </label>
            </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onSimulate}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Simulate
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickSimModal;

import type { FC } from 'react';
import type { BalanceEntry } from '../types';

interface SimTimelineProps {
  progress: BalanceEntry[];
}

const SimTimeline: FC<SimTimelineProps> = ({ progress }) => {
  if (!progress || progress.length === 0) return null;

  return (
    <div className="mt-6 bg-white/5 border border-white/20 rounded-xl p-4 text-white">
      <h3 className="text-lg font-bold mb-2">📈 Simulation Timeline</h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 text-xs text-center">
        {progress.map((entry, i) => (
          <div
            key={i}
            className={`rounded p-2 ${
              entry.balance >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'
            }`}
            title={`$${entry.balance.toFixed(2)}`}
          >
            {new Date(entry.date).getDate()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimTimeline;

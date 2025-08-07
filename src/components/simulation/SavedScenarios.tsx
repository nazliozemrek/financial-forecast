import React from 'react';
import type { SavedScenario } from '../../types';
import BalanceChart from './BalanceChart';
import { Save, Trash2 } from 'lucide-react';

interface SavedScenariosProps {
  scenarios: SavedScenario[];
  onDeleteScenario: (id: string) => void;
}

const SavedScenarios: React.FC<SavedScenariosProps> = ({ scenarios, onDeleteScenario }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Save className="w-6 h-6 mr-2" />
          Saved Scenarios ({scenarios.length})
        </h3>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] border border-[#333] rounded-xl">
          <div className="text-6xl mb-4">📊</div>
          <h4 className="text-lg font-semibold text-white mb-2">No Saved Scenarios</h4>
          <p className="text-gray-300">Run a simulation and save it to see your financial forecasts here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1 truncate">{scenario.name}</h4>
                  <p className="text-sm text-gray-300">
                    Created: {new Date(scenario.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteScenario(scenario.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 ml-2 flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3">
                  <p className="text-sm text-gray-300 mb-1">Initial Balance</p>
                  <p className="text-lg font-bold text-white">${scenario.initialBalance.toFixed(2)}</p>
                </div>
                <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3">
                  <p className="text-sm text-gray-300 mb-1">Target Date</p>
                  <p className="text-lg font-bold text-white">{new Date(scenario.targetDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3 sm:col-span-2 lg:col-span-1">
                  <p className="text-sm text-gray-300 mb-1">Final Balance</p>
                  <p className="text-lg font-bold text-white">
                    ${scenario.chartData[scenario.chartData.length - 1]?.balance.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              <div className="h-48 md:h-64 overflow-hidden">
                <div className="w-full h-full">
                  <BalanceChart
                    compact={true}
                    data={scenario.chartData.map(entry => {
                      let convertedDate;
                      if (entry.date instanceof Date) {
                        convertedDate = entry.date;
                      } else if (typeof entry.date === 'string') {
                        convertedDate = new Date(entry.date);
                      } else if (entry.date && typeof entry.date === 'object' && 'toDate' in entry.date) {
                        // Handle Firestore Timestamp
                        convertedDate = (entry.date as any).toDate();
                      } else {
                        convertedDate = new Date();
                      }
                      return {
                        ...entry,
                        date: convertedDate
                      };
                    })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedScenarios;
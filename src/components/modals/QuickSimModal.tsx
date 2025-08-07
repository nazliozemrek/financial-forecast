import React, { useState, useEffect } from 'react';
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
  onSaveScenario?: () => void;
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
  onSaveScenario,
  events,
  onToggleEvent,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleSimulate = async () => {
    if (skipAnimation) {
      // Skip animation and show results instantly
      onSimulate();
      setShowResults(true);
      return;
    }

    // Start visual simulation process
    setIsSimulating(true);
    setSimulationProgress(0);
    setShowResults(false);

    // Simulate progress over 3 seconds
    const duration = 3000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps) * 100;
      setSimulationProgress(progress);

      if (currentStep >= steps) {
        clearInterval(progressInterval);
        // Run actual simulation
        onSimulate();
        setShowResults(true);
        setIsSimulating(false);
      }
    }, interval);
  };

  const handleClose = () => {
    setIsSimulating(false);
    setSimulationProgress(0);
    setShowResults(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md text-white space-y-5">
        <h3 className="text-xl font-bold">Quick Balance Simulation</h3>

        {!isSimulating && !showResults && (
          <>
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
                    className={`cursor-pointer px-3 py-2 rounded-xl border text-sm flex justify-between items-center transition-all duration-200 ${
                      event.enabled
                        ? 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-white/60 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs">{event.sourceIcon || '📊'}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-xs text-gray-400">{event.source || 'Event'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${event.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {event.type === 'income' ? '+' : '-'}${Math.abs(event.amount)}
                      </span>
                      <span>{event.enabled ? '✅' : '🚫'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Simulation Progress */}
        {isSimulating && (
          <div className="text-center space-y-4">
            <div className="text-2xl mb-4">🎯</div>
            <h4 className="text-lg font-semibold">Running Simulation...</h4>
            <p className="text-sm text-gray-300">Calculating your financial forecast</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${simulationProgress}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-gray-300">
              {Math.round(simulationProgress)}% Complete
            </div>

            {/* Animated dots */}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && quickSimResult && (
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-6 rounded-xl text-white space-y-4 border border-white/20 shadow-xl">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white mb-1">Simulation Results</h3>
              <p className="text-sm text-gray-300">Target Date: {new Date(quickSimResult.date).toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold mb-1">
                  <span className={quickSimResult.balance >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${quickSimResult.balance.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-300">Projected Balance</div>
              </div>
              
              <div className="bg-white/10 p-4 rounded-lg text-center">
                <div className="text-lg font-bold mb-1">
                  <span className={quickSimResult.dayAmount > 0 ? 'text-green-400' : 'text-red-400'}>
                    {quickSimResult.dayAmount > 0 ? '+' : ''}${quickSimResult.dayAmount.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-300">Day Change</div>
              </div>
            </div>

            {quickSimResult.events?.length > 0 && (
              <div className="bg-white/10 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm">Events on Target Date:</h4>
                <div className="space-y-1">
                  {quickSimResult.events.map((e, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="flex items-center space-x-2">
                        <span className="text-xs">{e.sourceIcon || '📊'}</span>
                        <span>{e.title}</span>
                      </span>
                      <span className={`font-bold ${e.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {e.type === 'income' ? '+' : '-'}${Math.abs(e.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {onSaveScenario && (
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    onSaveScenario();
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
                >
                  💾 Save This Scenario
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {!isSimulating && !showResults && (
            <button
              onClick={handleSimulate}
              className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all shadow-md"
            >
              Simulate
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all shadow-md"
          >
            {showResults ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickSimModal;

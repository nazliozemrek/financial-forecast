import React, { useState } from 'react';
import { useFinancialForecastApp } from '../hooks/useFinancialForecastApp';
import { useBanks } from '../hooks/useBanks';
import { Trash2, Edit, Eye, TrendingUp, Calendar, Filter, Search, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { EventItem } from '../types';
import SavedScenarios from '../components/simulation/SavedScenarios';

const ActiveEventsTab: React.FC = () => {
  const { events, setEvents, allEvents, savedScenarios, setSavedScenarios, user } = useFinancialForecastApp();
  const { banks } = useBanks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'custom' | 'bank'>('all');
  const [activeTab, setActiveTab] = useState<'events' | 'scenarios'>('events');

  // Filter events based on search and filters
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesSource = filterSource === 'all' || 
      (filterSource === 'custom' && !event.isPlaid) ||
      (filterSource === 'bank' && event.isPlaid);
    
    return matchesSearch && matchesType && matchesSource;
  });

  const totalIncome = allEvents
    .filter(e => e.type === 'income' && e.enabled)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  
  const totalExpenses = allEvents
    .filter(e => e.type === 'expense' && e.enabled)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const netFlow = totalIncome - totalExpenses;
  const netBalance = totalIncome - totalExpenses;
  const customEvents = allEvents.filter(e => !e.isPlaid);
  const bankEvents = allEvents.filter(e => e.isPlaid);
  const recurringEvents = allEvents.filter(e => e.frequency !== 'once');

  // Calculate top income and expense sources
  const topIncomeSources = allEvents
    .filter(event => event.type === 'income')
    .reduce((acc, event) => {
      const existing = acc.find(item => item.name === event.title);
      if (existing) {
        existing.amount += event.amount;
      } else {
        acc.push({ name: event.title, amount: event.amount });
      }
      return acc;
    }, [] as { name: string; amount: number }[])
    .sort((a, b) => b.amount - a.amount);

  const topExpenseSources = allEvents
    .filter(event => event.type === 'expense')
    .reduce((acc, event) => {
      const existing = acc.find(item => item.name === event.title);
      if (existing) {
        existing.amount += Math.abs(event.amount);
      } else {
        acc.push({ name: event.title, amount: Math.abs(event.amount) });
      }
      return acc;
    }, [] as { name: string; amount: number }[])
    .sort((a, b) => b.amount - a.amount);

  const handleDeleteEvent = (eventId: number) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleToggleEvent = (eventId: number) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId ? { ...e, enabled: !e.enabled } : e
    ));
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      // Delete from Firebase
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      
      // Get user from the existing hook call at the top of the component
      if (!user) {
        console.error('❌ No user available for deletion');
        toast.error('User not authenticated');
        return;
      }
      
      await deleteDoc(doc(db, 'users', user.uid, 'savedScenarios', scenarioId));
      console.log('🗑️ Deleted scenario from Firebase:', scenarioId);
      
      // Update local state
      setSavedScenarios(prev => prev.filter(s => s.id !== scenarioId));
      toast.success('Scenario deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting scenario:', error);
      toast.error('Failed to delete scenario');
    }
  };

  const handleExportEvents = () => {
    const exportData = {
      events: allEvents,
      summary: {
        totalIncome,
        totalExpenses,
        netFlow,
        customEvents: customEvents.length,
        bankEvents: bankEvents.length,
        recurringEvents: recurringEvents.length
      },
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-events-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Events exported successfully!');
  };

  const handleGenerateReport = () => {
    const report = `
Financial Events Report
Generated: ${new Date().toLocaleDateString()}

SUMMARY:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Flow: $${netFlow.toFixed(2)}

EVENT BREAKDOWN:
- Custom Events: ${customEvents.length}
- Bank Events: ${bankEvents.length}
- Recurring Events: ${recurringEvents.length}

DETAILED EVENTS:
${allEvents.map(event => `- ${event.title}: ${event.type === 'income' ? '+' : '-'}${Math.abs(event.amount).toFixed(2)} (${event.source || 'Custom'})`).join('\n')}
    `;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report generated successfully!');
  };

  return (
    <div className="space-y-6 p-4">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-white">${totalIncome.toFixed(2)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-white">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="text-3xl">💸</div>
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Net Balance</p>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-[#007a33]' : 'text-red-400'}`}>
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'events'
              ? 'bg-[#007a33] text-white shadow-lg'
              : 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] border border-[#333]'
          }`}
        >
          Events & Analysis
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'scenarios'
              ? 'bg-[#007a33] text-white shadow-lg'
              : 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] border border-[#333]'
          }`}
        >
          Saved Scenarios
        </button>
      </div>

      {activeTab === 'events' ? (
        <>
          {/* Event Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3">
              <p className="text-sm text-gray-300 mb-1">Custom Events</p>
              <p className="text-lg font-bold text-white">{customEvents.length}</p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3">
              <p className="text-sm text-gray-300 mb-1">Bank Transactions</p>
              <p className="text-lg font-bold text-white">{bankEvents.length}</p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#333] rounded-lg p-3">
              <p className="text-sm text-gray-300 mb-1">Recurring Events</p>
              <p className="text-lg font-bold text-white">{recurringEvents.length}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#007a33]"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#007a33]"
            >
              <option value="all">All Events</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
              <option value="custom">Custom Events</option>
              <option value="bank">Bank Transactions</option>
              <option value="recurring">Recurring Events</option>
            </select>
          </div>

          {/* Event List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">All Events ({filteredEvents.length})</h3>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 bg-[#1a1a1a] border border-[#333] rounded-lg">
                <p className="text-gray-300">No events found matching your criteria</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{event.sourceIcon || '📊'}</span>
                      <div>
                        <h4 className="font-semibold text-white">{event.title}</h4>
                        <p className="text-sm text-gray-300">
                          {new Date(event.date).toLocaleDateString()} • {event.source || 'Custom Event'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${event.type === 'income' ? 'text-[#007a33]' : 'text-red-400'}`}>
                        {event.type === 'income' ? '+' : '-'}${Math.abs(event.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{event.frequency}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Event Analysis */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Event Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Top Income Sources</h4>
                <div className="space-y-2">
                  {topIncomeSources.slice(0, 5).map((source, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-white">{source.name}</span>
                      <span className="text-[#007a33] font-semibold">${source.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Top Expense Categories</h4>
                <div className="space-y-2">
                  {topExpenseSources.slice(0, 5).map((source, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-white">{source.name}</span>
                      <span className="text-red-400 font-semibold">${source.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportEvents}
              className="px-4 py-2 bg-[#007a33] text-white rounded-lg hover:bg-[#008a43] transition-all duration-200 shadow-md"
            >
              Export Events
            </button>
            <button
              onClick={handleGenerateReport}
              className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-all duration-200 shadow-md border border-[#333]"
            >
              Generate Report
            </button>
          </div>
        </>
      ) : (
        <SavedScenarios scenarios={savedScenarios} onDeleteScenario={handleDeleteScenario} />
      )}
    </div>
  );
};

export default ActiveEventsTab;
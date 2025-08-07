import React, { useState } from 'react';
import { useFinancialForecastApp } from '../hooks/useFinancialForecastApp';
import { useBanks } from '../hooks/useBanks';
import { Plus, TrendingUp, Calendar, Target, Zap, PlusCircle, Eye, Trash2 } from 'lucide-react';
import type { EventItem } from '../types';

const AddEventTab: React.FC = () => {
  const { events, setEvents, deleteEvent } = useFinancialForecastApp();
  const { banks } = useBanks();
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventAmount, setEventAmount] = useState(0);
  const [eventType, setEventType] = useState<'income' | 'expense'>('expense');
  const [eventDate, setEventDate] = useState('');
  const [eventFrequency, setEventFrequency] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'bi-weekly'>('once');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || eventAmount <= 0) return;

    const newEvent: EventItem = {
      id: Date.now(),
      title: eventTitle,
      amount: eventType === 'income' ? eventAmount : -eventAmount,
      type: eventType,
      frequency: eventFrequency,
      startDate: eventDate,
      date: eventDate, // Add the missing date property
      enabled: true,
      isPlaid: false,
      generated: false,
      recurring: eventFrequency !== 'once',
      source: 'Custom Event',
      sourceIcon: '📊'
    };

    setEvents(prev => [...prev, newEvent]);
    setEventTitle('');
    setEventAmount(0);
    setEventType('expense');
    setEventDate('');
    setEventFrequency('once');
    setShowEventForm(false);
  };

  const handleToggleEvent = (id: number) => {
    setEvents(prev => prev.map(event =>
      event.id === id ? { ...event, enabled: !event.enabled } : event
    ));
  };

  const handleDeleteEvent = async (id: number) => {
    await deleteEvent(id);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Quick Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Total Events</p>
              <p className="text-2xl font-bold text-white">{events.length}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Active Events</p>
              <p className="text-2xl font-bold text-white">{events.filter(e => e.enabled).length}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">Recurring Events</p>
              <p className="text-2xl font-bold text-white">{events.filter(e => e.frequency !== 'once' && e.recurring).length}</p>
            </div>
            <div className="text-3xl">🔄</div>
          </div>
        </div>
      </div>

      {/* Add Custom Event Button */}
      <div className="text-center">
        <button
          onClick={() => setShowEventForm(true)}
          className="px-8 py-4 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg text-lg font-semibold"
        >
          <PlusCircle className="inline w-6 h-6 mr-2" />
          Add Custom Event
        </button>
      </div>

      {/* Event Form */}
      {showEventForm && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Event</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Event Title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="px-4 py-2 bg-[#0f0f0f] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#007a33]"
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={eventAmount}
                onChange={(e) => setEventAmount(parseFloat(e.target.value))}
                className="px-4 py-2 bg-[#0f0f0f] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#007a33]"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as 'income' | 'expense')}
                className="px-4 py-2 bg-[#0f0f0f] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#007a33]"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="px-4 py-2 bg-[#0f0f0f] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#007a33]"
                required
              />
              <select
                value={eventFrequency}
                onChange={(e) => setEventFrequency(e.target.value as any)}
                className="px-4 py-2 bg-[#0f0f0f] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#007a33]"
              >
                <option value="once">One-Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-6 py-2 bg-[#007a33] text-white rounded-lg hover:bg-[#008a43] transition-all duration-200"
              >
                Add Event
              </button>
              <button
                type="button"
                onClick={() => setShowEventForm(false)}
                className="px-6 py-2 bg-[#0f0f0f] border border-[#333] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Events List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Your Custom Events ({events.length})</h3>
        {events.length === 0 ? (
          <div className="text-center py-8 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <p className="text-gray-300">No custom events yet. Add your first event above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
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
                        {new Date(event.startDate).toLocaleDateString()} • {event.frequency === 'once' ? 'one-time' : event.frequency}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${event.type === 'income' ? 'text-[#007a33]' : 'text-red-400'}`}>
                      {event.type === 'income' ? '+' : '-'}${Math.abs(event.amount).toFixed(2)}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleToggleEvent(event.id)}
                        className={`p-1 rounded ${event.enabled ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title={event.enabled ? 'Disable' : 'Enable'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1 rounded text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank Connection Promotion */}
      {banks.length === 0 && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">🏦</div>
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your Bank</h3>
          <p className="text-gray-300 mb-4">
            Link your bank accounts to automatically import transactions and get more accurate forecasts
          </p>
          <button
            onClick={() => {/* Add bank connection logic */}}
            className="px-6 py-3 bg-[#007a33] text-white rounded-lg hover:bg-[#008a43] transition-all duration-200 shadow-md"
          >
            Connect Bank Account
          </button>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💡 Tips for Better Forecasting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-gray-300"><strong>•</strong> Add recurring expenses like rent, utilities, and subscriptions</p>
            <p className="text-gray-300"><strong>•</strong> Include regular income sources like salary and freelance work</p>
            <p className="text-gray-300"><strong>•</strong> Don't forget seasonal expenses like holidays and birthdays</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300"><strong>•</strong> Use descriptive titles to easily identify your events</p>
            <p className="text-gray-300"><strong>•</strong> Connect your bank for automatic transaction import</p>
            <p className="text-gray-300"><strong>•</strong> Review and update your events regularly for accuracy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEventTab;
import React, { useState } from 'react';
import type { EventItem } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventItem) => void;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [frequency, setFrequency] = useState<'Monthly' | 'Weekly'>('Monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title || !amount) return;
    onSave({
      id: Date.now(),
      title,
      amount: Number(amount),
      type: type.toLowerCase() as 'income' | 'expense',
      frequency: frequency.toLowerCase() as 'monthly' | 'weekly',
      dayOfMonth: Number(dayOfMonth),
      enabled: true,
      startDate: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-full max-w-md text-white space-y-4 border border-white/20">
        <h3 className="text-xl font-bold">Add Event</h3>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          title="Event Title"
          aria-label="Event Title"
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          step="0.01"
          title="Amount"
          aria-label="Amount"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'Income' | 'Expense')}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          title="Event Type"
          aria-label="Event Type"
        >
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as 'Monthly' | 'Weekly')}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          title="Event Frequency"
          aria-label="Event Frequency"
        >
          <option value="Monthly">Monthly</option>
          <option value="Weekly">Weekly</option>
        </select>

        <select
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          title="Day of the Month"
          aria-label="Day of the Month"
        >
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              {i + 1}
            </option>
          ))}
        </select>

        <div className="flex justify-between pt-4">
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
            title="Add Event"
            aria-label="Add Event"
          >
            Add
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10"
            title="Cancel"
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
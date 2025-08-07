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
  const [frequency, setFrequency] = useState<'Monthly' | 'Weekly' | 'One-Time'>('Monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [eventDate, setEventDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title || !amount) return;
    let localDate = eventDate;
    if (frequency === 'One-Time' && eventDate) {
      // Fix timezone issue: create date in local timezone
      const [year, month, day] = eventDate.split('-').map(Number);
      localDate = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }
    onSave({
      id: Date.now(),
      title,
      amount: Number(amount),
      type: type.toLowerCase() as 'income' | 'expense',
      frequency: frequency === 'One-Time' ? 'once' : frequency.toLowerCase() as 'monthly' | 'weekly',
      dayOfMonth: frequency !== 'One-Time' ? Number(dayOfMonth) : undefined,
      date: frequency === 'One-Time' ? localDate : '',
      enabled: true,
      startDate: frequency === 'One-Time' ? localDate : '',
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
          title="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
        />

        <input
          type="number"
          placeholder="Amount"
          title="Event Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'Income' | 'Expense')}
          title="Event Type"
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
        >
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as 'Monthly' | 'Weekly' | 'One-Time')}
          title="Event Frequency"
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
        >
          <option value="Monthly">Monthly</option>
          <option value="Weekly">Weekly</option>
          <option value="One-Time">One-Time</option>
        </select>

        {frequency === 'One-Time' && (
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          />
        )}

        {frequency !== 'One-Time' && (
          <select
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
          >
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                {i + 1}
              </option>
            ))}
          </select>
        )}

        <div className="flex justify-between pt-4">
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Add
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
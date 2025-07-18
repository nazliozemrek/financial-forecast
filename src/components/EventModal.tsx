import React, { useState } from 'react';

interface EventModalProps {
  onAdd: (data: any) => void;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ onAdd, onClose }) => {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    frequency: 'monthly',
    dayOfWeek: 0,
    dayOfMonth: 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Add Event</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="text-white text-sm">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
            />
          </div>

          <div>
            <label htmlFor="amount" className="text-white text-sm">Amount</label>
            <input
              id="amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="type" className="text-white text-sm">Type</label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              title="Event Type"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label htmlFor="frequency" className="text-white text-sm">Frequency</label>
            <select
              id="frequency"
              name="frequency"
              value={form.frequency}
              onChange={handleChange}
              title="Event Frequency"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {form.frequency === 'weekly' && (
            <div>
              <label htmlFor="dayOfWeek" className="text-white text-sm">Day of the Week</label>
              <select
                id="dayOfWeek"
                name="dayOfWeek"
                value={form.dayOfWeek}
                onChange={handleChange}
                title="Day of the Week"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
              >
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
          )}

          {form.frequency === 'monthly' && (
            <div>
              <label htmlFor="dayOfMonth" className="text-white text-sm">Day of the Month</label>
              <select
                id="dayOfMonth"
                name="dayOfMonth"
                value={form.dayOfMonth}
                onChange={handleChange}
                title="Day of the Month"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            Add
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;

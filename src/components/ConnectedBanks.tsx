// components/ConnectedBanks.tsx
import React from 'react';
import { useBanks } from '../hooks/useBanks';

const ConnectedBanks = () => {
  const { banks, loading } = useBanks();

  if (loading) return <p className="text-gray-400">Loading bank accounts...</p>;
  if (!banks.length) return <p>No connected banks yet.</p>;

  return (
    <div className="mt-4">
      <h2 className="text-lg font-bold mb-2">Connected Banks</h2>
      <ul className="space-y-2">
        {banks.map((bank) => (
          <li key={bank.id} className="p-3 border border-gray-300 rounded bg-white text-black">
            <p><strong>Institution:</strong> {bank.institution?.name || 'Unknown'}</p>
            <p><strong>Item ID:</strong> {bank.item_id}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectedBanks;
// components/ConnectedBanks.tsx
import React from 'react';
import { useBanks } from '../hooks/useBanks';
import { useAuth } from '../hooks/useAuth';

const ConnectedBanks = () => {
  const { banks, loading, refetch } = useBanks();
  const currentUser  = useAuth();

  if (loading) return <p className="text-gray-400">Loading bank accounts...</p>;
  if (!banks.length) return <p>No connected banks yet.</p>;

  // Avoid showing duplicates by filtering unique institutions
  const uniqueInstitutions = Array.from(new Map(banks.map(bank => [bank.institution?.institution_id, bank])).values());

 const handleDisconnect = async (bankId: string) => {
  try {
    const uid = currentUser?.uid;
    if (!uid) return;

    await fetch(`/api/disconnect_bank`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, bankId }),
    });

    refetch(); // ✅ Only refetch after successful fetch
  } catch (err) {
    console.error('Failed to disconnect bank:', err);
  }
};
 

  return (
    <div className="mt-4">
      <h2 className="text-lg font-bold mb-2">Connected Banks</h2>
      <ul className="space-y-2">
        {uniqueInstitutions.map((bank) => (
          <li
            key={bank.id}
            className="p-3 border border-gray-300 rounded bg-white text-black flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              {bank.institution?.logo ? (
                <img
                  src={`data:image/png;base64,${bank.institution.logo}`}
                  alt={bank.institution.name || 'Bank logo'}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 flex items-center justify-center text-xs">🏦</div>
              )}
              <span>{bank.institution?.name || 'Unknown Institution'}</span>
            </div>
            <button
              onClick={() => handleDisconnect(bank.id)}
              className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Disconnect
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectedBanks;
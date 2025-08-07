// components/ConnectedBanks.tsx
import React from 'react';
import { useBanks } from '../../hooks/useBanks';
import { useAuth } from '../../hooks/useAuth';
import { fetchRecurringTransactions } from '../../utils/fetchRecurring';
import { useEffect, useState } from 'react';

interface ConnectedBanksProps {
  refetchBanks: () => void;
}

const ConnectedBanks: React.FC<ConnectedBanksProps> = ({ refetchBanks }) => {
  const { banks, loading } = useBanks();
  const currentUser = useAuth();

  const [recurringEvents, setRecurringEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecurring = async () => {
      const uid = currentUser?.uid;
      if (!uid) return;

      try {
        const res = await fetch('/api/get_access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid }),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('❌ Invalid JSON response:', text);
          return;
        }
        if (data.accessToken) {
          const events = await fetchRecurringTransactions(data.accessToken);
          setRecurringEvents(events);
        }
      } catch (err) {
        console.error('Error fetching recurring transactions:', err);
      }
    };

    fetchRecurring();
  }, [currentUser]);

  if (loading) return <p className="text-gray-400">Loading bank accounts...</p>;
  if (!banks.length) return <p>No connected banks yet.</p>;

  // Avoid showing duplicates by filtering unique institutions
  const uniqueInstitutions = Array.from(new Map(banks.map(bank => [bank.institution?.institution_id, bank])).values());

  const handleDisconnect = async (bankId: string) => {
    try {
      const uid = currentUser?.uid;
      if (!uid) return;

      await fetch('/api/disconnect_bank', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, bankId }),
      });

      refetchBanks();
    } catch (err) {
      console.error('Failed to disconnect bank:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="mr-2">🏦</span>
          Connected Banks ({uniqueInstitutions.length})
        </h3>
      </div>

      {uniqueInstitutions.length === 0 ? (
        <div className="text-center py-8 text-gray-300 bg-[#1a1a1a] border border-[#333] rounded-xl">
          <div className="text-4xl mb-2">🏦</div>
          <p>No banks connected yet</p>
          <p className="text-sm opacity-75">Connect your first bank to start forecasting</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uniqueInstitutions.map((bank) => (
            <div
              key={bank.id}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#007a33] rounded-lg flex items-center justify-center shadow-md">
                    {bank.institution?.logo ? (
                      <img
                        src={`data:image/png;base64,${bank.institution.logo}`}
                        alt={bank.institution.name || 'Bank logo'}
                        className="w-8 h-8 rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className="text-white font-bold text-lg hidden">
                      {bank.institution?.name?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{bank.institution?.name || 'Unknown Bank'}</h4>
                    <p className="text-sm text-gray-300">Connected</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(bank.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectedBanks;
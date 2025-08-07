// components/PlaidConnectButton.tsx
import React from 'react';
import { usePlaidLink } from 'react-plaid-link';
import type { User } from 'firebase/auth';
import axios from 'axios';
import { useBanks } from '../../hooks/useBanks';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';

const PlaidConnectButton = ({
  linkToken,
  onBankConnected,
  user,
}: {
  linkToken: string;
  onBankConnected?: () => void;
  user: User | null;
}) => {
  const userId = user?.uid;
  const { banks } = useBanks();

  const isBankAlreadyConnected = (institutionId: string) => {
    return banks.some(bank => bank.institution?.institution_id === institutionId);
  };

  const onSuccess = async (public_token: string, metadata: any) => {
    if (!userId) {
      alert('User not loaded. Please log in before connecting a bank.');
      return;
    }

    // Check if this bank is already connected
    const institutionId = metadata.institution?.institution_id;
    if (institutionId && isBankAlreadyConnected(institutionId)) {
      const bankName = metadata.institution?.name || 'This bank';
      toast.error(`${bankName} is already connected!`);
      return;
    }

    try {
      const res = await axios.post('/api/exchange_public_token', {
        public_token,
        userId,
        institution: metadata.institution || {},
      });

      toast.success(`Successfully connected ${metadata.institution?.name || 'bank'}!`);
      if (onBankConnected) onBankConnected(); // <-- trigger fetchTransactions/UI update
    } catch (error) {
      console.error('❌ Failed to link bank:', error);
      toast.error('Failed to connect bank. Please try again.');
    }
  };

  const { open, ready, error, exit } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  if (error) {
    console.error('❌ Plaid Link error:', error);
  }

  return (
    <button
      onClick={() => {
        if (ready && userId) open();
      }}
      disabled={!ready || !userId}
      title="Connect Bank"
      className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 shadow-md w-[50px] h-[50px] bg-white text-black hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      <Plus className="w-5 h-5" />
    </button>
  );
};

export default PlaidConnectButton;
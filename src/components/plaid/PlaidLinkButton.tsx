// components/PlaidLinkButton.tsx
import React from 'react';
import { usePlaidLink } from 'react-plaid-link';
import type { User } from 'firebase/auth';
import axios from 'axios';
import { useBanks } from '../../hooks/useBanks';
import { toast } from 'react-hot-toast';

const PlaidLinkButton = ({
  linkToken,
  onBankConnected,
  currentUser,
}: {
  linkToken: string;
  onBankConnected?: () => void;
  currentUser: User | null;
}) => {
  const userId = currentUser?.uid;
  const { banks } = useBanks();

  const isBankAlreadyConnected = (institutionId: string) => {
    return banks.some(bank => bank.institution?.institution_id === institutionId);
  };

  const onSuccess = async (public_token: string, metadata: any) => {
    if (!userId) {
      alert('User not loaded. Please log in before connecting a bank.');
      return;
    }

    const institutionId = metadata.institution?.institution_id;
    if (institutionId && isBankAlreadyConnected(institutionId)) {
      const bankName = metadata.institution?.name || 'This bank';
      toast.error(`${bankName} is already connected!`);
      return;
    }

    try {
      const res = await axios.post('/api/exchange-public-token', {
        public_token,
        userId,
        institution: metadata.institution || {},
      });

      toast.success(`Successfully connected ${metadata.institution?.name || 'bank'}!`);
      if (onBankConnected) onBankConnected();
    } catch (error) {
      toast.error('Failed to connect bank. Please try again.');
    }
  };

  const { open, ready, error, exit } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  if (error) {
    // Plaid Link error occurred
  }

  return (
    <button
      onClick={() => {
        if (ready && userId) open();
      }}
      disabled={!ready || !userId}
      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-md"
    >
      Connect Bank
    </button>
  );
};

export default PlaidLinkButton;
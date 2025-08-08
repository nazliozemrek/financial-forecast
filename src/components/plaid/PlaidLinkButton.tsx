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
      toast.error('User not loaded. Please log in before connecting a bank.');
      return;
    }

    const institutionId = metadata.institution?.institution_id;
    if (institutionId && isBankAlreadyConnected(institutionId)) {
      const bankName = metadata.institution?.name || 'This bank';
      toast.error(`${bankName} is already connected!`);
      return;
    }

    try {
      console.log('🔄 Connecting bank:', metadata.institution?.name);
      
              const res = await axios.post('/.netlify/functions/exchange-public-token', {
        public_token,
        userId,
        institution: metadata.institution || {},
      });

      if (res.data.success) {
        toast.success(`Successfully connected ${metadata.institution?.name || 'bank'}!`);
        if (onBankConnected) onBankConnected();
      } else {
        throw new Error('Failed to connect bank');
      }
    } catch (error) {
      console.error('❌ Bank connection error:', error);
      
      // Categorize errors based on Plaid handbook recommendations
      if (error.response?.status === 400) {
        toast.error('Invalid bank credentials. Please try again.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please check your Plaid configuration.');
      } else if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to connect bank. Please try again.');
      }
    }
  };

  const onExit = (err: any, metadata: any) => {
    if (err) {
      console.error('❌ Plaid Link exit with error:', err);
      
      // Categorize exit errors based on Plaid handbook
      if (err.error_code === 'INVALID_CREDENTIALS') {
        toast.error('Invalid bank credentials. Please check your username and password.');
      } else if (err.error_code === 'ITEM_LOGIN_REQUIRED') {
        toast.error('Bank login required. Please try again.');
      } else if (err.error_code === 'INSTITUTION_DOWN') {
        toast.error('Bank is temporarily unavailable. Please try again later.');
      } else if (err.error_code === 'USER_SETUP_REQUIRED') {
        toast.error('Additional setup required. Please contact your bank.');
      } else {
        toast.error('Bank connection was cancelled or failed.');
      }
    } else {
      console.log('ℹ️ Plaid Link exited normally');
    }
  };

  const onEvent = (eventName: string, metadata: any) => {
    console.log('📊 Plaid Link event:', eventName, metadata);
  };

  const { open, ready, error, exit } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
    onEvent,
  });

  if (error) {
    console.error('❌ Plaid Link error:', error);
    toast.error('Plaid Link error. Please try again.');
  }

  return (
    <button
      onClick={() => {
        if (ready && userId) {
          console.log('🚀 Opening Plaid Link...');
          open();
        } else {
          console.log('⚠️ Plaid Link not ready or user not logged in');
        }
      }}
      disabled={!ready || !userId}
      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Connect Bank
    </button>
  );
};

export default PlaidLinkButton;
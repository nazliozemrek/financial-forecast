import React from 'react';
import toast from 'react-hot-toast';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidConnectButtonProps {
  linkToken: string;
  setAccessToken:(token:string) => void;
}

const PlaidConnectButton = ({linkToken,setAccessToken} : PlaidConnectButtonProps) => {
  const config = {
    token: linkToken,
    onSuccess: async (public_token: string) => {
      try {
        const response = await fetch('http://localhost:3001/api/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });

        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          setAccessToken(data.access_token);
          toast.success('✅ Bank account connected!');
          console.log('🎫 Access Token:', data.access_token);
        }
       }  catch(error) {
          console.error('No access token received',error);
        }
      },
       onExit: (err : any , metadata:any) => {
        console.log('User exited Plaid Link',err,metadata);
      }
    };

    const { open , ready } = usePlaidLink(config);


  return (
    <button
      onClick= {() => open()}
      disabled = {!ready}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Connect Bank
    </button>
  );
};

export default PlaidConnectButton;
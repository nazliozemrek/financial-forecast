import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { db } from '../../firebase/config'; // adjust if your db init is elsewhere

export const useBanks = () => {
  const currentUser = useAuth();
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setBanks([]);
      setLoading(false);
      return;
    }

    console.log('🔄 useBanks: Loading banks for user:', currentUser.uid.substring(0, 10) + '...');

    // First, try to get data from plaid_tokens collection (new structure)
    const plaidTokensRef = doc(db, 'plaid_tokens', currentUser.uid);
    const unsubscribePlaidTokens = onSnapshot(plaidTokensRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('✅ useBanks: Found data in plaid_tokens collection');
        
        if (data?.accessToken) {
          setBanks([{
            id: 'plaid_tokens',
            access_token: data.accessToken,
            institution: data.institution || {},
            createdAt: data.createdAt
          }]);
          setLoading(false);
          return;
        }
      }

      // Fallback to old structure (users/{uid}/bankAccounts)
      console.log('🔄 useBanks: Checking old structure...');
      const bankRef = collection(db, 'users', currentUser.uid, 'bankAccounts');
      const unsubscribeBankAccounts = onSnapshot(bankRef, (snapshot) => {
        const bankList = snapshot.docs.map((doc) => ({
          id: doc.id,
          access_token: doc.data().accessToken,
          institution: doc.data().institution || {},
          createdAt: doc.data().createdAt,
          ...doc.data(),
        }));
        
        console.log('📊 useBanks: Found', bankList.length, 'banks in old structure');
        setBanks(bankList);
        setLoading(false);
      });

      return () => unsubscribeBankAccounts();
    });

    return () => unsubscribePlaidTokens();
  }, [currentUser?.uid]);

  return { banks, loading };
};
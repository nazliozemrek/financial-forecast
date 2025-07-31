import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useAuth } from './useAuth';

export const useBanks = () => {
  const currentUser  = useAuth(); // ✅ Destructure currentUser
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanks = async () => {
      if (!currentUser) return;
      const db = getFirestore();
      const bankRef = collection(db, 'users', currentUser.uid, 'bankAccounts'); // ✅ Use currentUser.uid
      const snapshot = await getDocs(bankRef);
      const bankList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBanks(bankList);
      setLoading(false);
    };

    fetchBanks();
  }, [currentUser]);

  return { banks, loading };
};
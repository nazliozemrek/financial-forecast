import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { db } from '../../firebase/config'; // adjust if your db init is elsewhere

export const useBanks = () => {
  const currentUser = useAuth();
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const bankRef = collection(db, 'users', currentUser.uid, 'bankAccounts');
    const unsubscribe = onSnapshot(bankRef, (snapshot) => {
      const bankList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBanks(bankList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { banks, loading };
};
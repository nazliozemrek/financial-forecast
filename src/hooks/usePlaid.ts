import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { toast } from 'react-hot-toast';

export function usePlaid(user: User | null) {
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔒 SECURITY: No longer storing access tokens in state
  // Tokens are used only for immediate API calls and then discarded

  // Fetch transactions using temporary access token
  const fetchTransactions = async (accessToken: string) => {
    if (!accessToken) {
      console.error('No access token provided');
      return [];
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          access_token: accessToken,
          userId: user?.uid 
        }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        console.log(`✅ Fetched ${data.fetchedCount} transactions securely`);
        return data.transactions || [];
      } else if (data.requiresReconnection) {
        console.warn('⚠️ Bank reconnection required');
        toast.error('Please reconnect your bank account');
        return [];
      } else {
        console.error('❌ Transaction fetch failed:', data.error);
        toast.error('Failed to fetch transactions');
        return [];
      }
    } catch (err) {
      console.error('❌ Failed to fetch transactions:', err);
      toast.error('Network error while fetching transactions');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recurring transactions using temporary access token
  const fetchRecurringTransactions = async (accessToken: string) => {
    if (!accessToken) return [];
    
    try {
      // For now, we'll derive recurring transactions from regular transactions
      // In a production environment, you might want to use Plaid's recurring transactions endpoint
      const transactions = await fetchTransactions(accessToken);
      
      // Simple heuristic to identify recurring transactions
      const recurring = transactions.filter(tx => {
        // Look for common recurring transaction patterns
        const name = tx.name.toLowerCase();
        const recurringKeywords = [
          'netflix', 'spotify', 'amazon prime', 'hulu', 'disney+', 'hbo',
          'rent', 'mortgage', 'insurance', 'subscription', 'membership',
          'gym', 'fitness', 'phone', 'internet', 'electricity', 'gas',
          'water', 'trash', 'cable', 'satellite', 'alarm', 'security'
        ];
        
        return recurringKeywords.some(keyword => name.includes(keyword));
      });

      setRecurringTransactions(recurring);
      return recurring;
    } catch (err) {
      console.error('❌ Failed to fetch recurring transactions:', err);
      setRecurringTransactions([]);
      return [];
    }
  };

  // 🔒 SECURITY: Clear any sensitive data when user changes
  useEffect(() => {
    if (!user) {
      setRecurringTransactions([]);
      setIsLoading(false);
    }
  }, [user]);

  return { 
    recurringTransactions, 
    fetchTransactions,
    fetchRecurringTransactions,
    isLoading 
  };
}
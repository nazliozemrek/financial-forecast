// src/utils/expandRecurringTransactions.ts
import { addDays, addWeeks, addMonths, format } from 'date-fns';

interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  startDate: string;
  recurring: boolean;
}

interface ExpandedEvent {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'once' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  startDate: string;
  date: string;
  enabled: boolean;
  isPlaid: boolean;
  generated: boolean;
  recurring: boolean;
  source: string;
  sourceIcon: string;
}

export function expandRecurringTransactions(transactions: RecurringTransaction[]): ExpandedEvent[] {
  const expanded: ExpandedEvent[] = [];
  const today = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1); // Expand for 1 year

  // Deduplicate transactions by title, amount, and frequency
  const uniqueTxns = transactions.filter((txn, index, self) => 
    index === self.findIndex(t => 
      t.title === txn.title && 
      t.amount === txn.amount && 
      t.frequency === txn.frequency
    )
  );

  uniqueTxns.forEach(transaction => {
    const startDate = new Date(transaction.startDate);
    let currentDate = new Date(startDate);

    // Skip if start date is in the future
    if (currentDate > today) {
      return;
    }

    // Generate events for the next year
    while (currentDate <= endDate) {
      const event: ExpandedEvent = {
        id: `${transaction.id}-${format(currentDate, 'yyyy-MM-dd')}`,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.amount > 0 ? 'income' : 'expense',
        frequency: transaction.frequency,
        startDate: format(currentDate, 'yyyy-MM-dd'),
        date: format(currentDate, 'yyyy-MM-dd'),
        enabled: true,
        isPlaid: true,
        generated: true,
        recurring: true,
        source: 'Recurring Transaction',
        sourceIcon: '🔄'
      };

      expanded.push(event);

      // Move to next occurrence based on frequency
      switch (transaction.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'bi-weekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }
  });

  return expanded;
}
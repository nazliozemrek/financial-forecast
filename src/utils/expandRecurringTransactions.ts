// src/utils/expandRecurringTransactions.ts
import type { EventItem } from '../types';
import { add, addMonths, format, getDate, lastDayOfMonth } from 'date-fns';
function dedupeTransactions(transactions: any[]) {
  const seen = new Set<string>();
  return transactions.filter(txn => {
    const name = (txn.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const key = `${name}-${Math.abs(Number(txn.amount))}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function guessIsExpense(name: string, amount: number): boolean {
  const expenseKeyWords = [
    'payment', 'withdrawal', 'debit', 'charge', 'fee', 'tax', 'bill', 'rent', 'mortgage',
    'insurance', 'subscription', 'service', 'purchase', 'expense','uber','kfc','mcdonalds','starbucks','netflix','spotify','apple music','transfer'
  ];
  return (
    amount < 0 ||
    expenseKeyWords.some(keyword => name.toLowerCase().includes(keyword))
  );
}

export function expandRecurringTransactions(transactions: any[], months = 2): EventItem[] {
  const uniqueTxns = dedupeTransactions(transactions);

  const expanded: EventItem[] = [];
  const today = new Date();
  console.log("Deduplicated transactions:", uniqueTxns);

  uniqueTxns.forEach((txn, index) => {
    if (!txn.date || !txn.name || txn.amount === undefined) return;
    const rawName = txn.name || '';
    const amount = Number(txn.amount);
    const isExpense = guessIsExpense(rawName, amount);
    const type: 'income' | 'expense' = isExpense ? 'expense' : 'income';
    const cleanAmount = Math.abs(amount);
    const originalDay = getDate(new Date(txn.date));

    for (let i = 0; i < months; i++) {
      const futureDate = addMonths(new Date(txn.date), i);
      const lastDay = getDate(lastDayOfMonth(futureDate));
      futureDate.setDate(Math.min(originalDay, lastDay)); // Handle month-end cases

    const isoDate = format(futureDate, 'yyyy-MM-dd');
    const event: EventItem = {
      id: index * 100 + i,
      title: rawName,
      amount: cleanAmount,
      type,
      frequency: 'monthly',
      dayOfMonth: futureDate.getDate(),
      startDate: isoDate,
      date: isoDate, // ✅ Add this line
      recurring: true,
      recurringInterval: 'monthly',
      isPlaid: true,
      enabled: true,
      generated: true,
    };
      console.log(`✅ Added recurring: ${event.title} → ${event.startDate}`);
      expanded.push(event);
    }
  });

  console.log('✅ Recurring transactions expanded:', expanded);
  return expanded;
}
import type { Transaction } from '../types'; // You’ll need to define or extend this type

export function detectRecurringTransactions(transactions: Transaction[]) {
  const recurringMap: Record<string, Transaction[]> = {};

  for (const tx of transactions) {
    if (!tx.name || !tx.amount || !tx.date) continue;

    const key = `${tx.name}-${Math.abs(tx.amount)}`; // normalize by name & amount
    if (!recurringMap[key]) recurringMap[key] = [];
    recurringMap[key].push(tx);
  }

  // Filter to only those with at least 3+ dates spaced ~monthly
  const recurringCandidates = Object.values(recurringMap).filter((group) => {
    if (group.length < 3) return false;

    const dates = group
      .map((t) => new Date(t.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const spanDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
    if (spanDays < 60) return false; // at least 2 months apart

    const intervals = dates.slice(1).map((d, i) =>
      (d.getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24)
    );

    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    const sample = group[0];
    if (Math.abs(sample.amount) < 10) return false; // ignore very small amounts
    
    const IGNORE_VENDORS = ['Starbucks', 'Amazon', 'Uber Eats',"McDonald's",'KFC']; // Add more as needed
    if (IGNORE_VENDORS.some(v => sample.name.toLowerCase().includes(v.toLowerCase())))  return false;


    return avg > 25 && avg < 35; // ~monthly
  });

  return recurringCandidates.map((group) => {
    const sample = group[0];
    return {
      title: sample.name,
      amount: -Math.abs(sample.amount),
      frequency: 'monthly',
      dayOfMonth: new Date(sample.date).getDate(),
      startDate: new Date(sample.date),
    };
  });
}
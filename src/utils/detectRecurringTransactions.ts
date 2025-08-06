import type { Transaction } from '../types';

export function detectRecurringTransactions(transactions: Transaction[]) {
  const recurringMap: Record<string, Transaction[]> = {};

  for (const tx of transactions) {
    if (!tx.name || !tx.amount || !tx.date) continue;

    const normalizedAmount = Math.round(Math.abs(tx.amount)); // Round to nearest dollar
    const key = `${tx.name.toLowerCase().trim()}-${normalizedAmount}`;
    if (!recurringMap[key]) recurringMap[key] = [];
    recurringMap[key].push(tx);
  }

  const recurringCandidates = Object.values(recurringMap).filter((group) => {
    if (group.length < 3) return false;

    const dates = group
      .map((t) => new Date(t.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const spanDays = (dates.at(-1)!.getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
    if (spanDays < 60) return false; // at least over 2 months

    const intervals = dates.slice(1).map((d, i) =>
      (d.getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24)
    );
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    const sample = group[0];
    if (Math.abs(sample.amount) < 10) return false;

    const IGNORE_VENDORS = ['Starbucks', 'Amazon', 'Uber Eats', "McDonald's", 'KFC'];
    if (IGNORE_VENDORS.some(v => sample.name.toLowerCase().includes(v.toLowerCase()))) return false;

    return avg > 25 && avg < 35;
  });

  return recurringCandidates.map((group) => {
    const sample = group[0];
    const isIncome = sample.amount > 0;
    return {
       title: sample.name,
       amount: isIncome ? Math.abs(sample.amount) : -Math.abs(sample.amount),
       type: isIncome ? 'income' : 'expense',
       frequency: 'monthly',
      dayOfMonth: new Date(sample.date).getDate(),
       startDate: new Date(sample.date),
    };
  });
}
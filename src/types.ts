// src/types.ts

export interface EventItem {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  disabled?: boolean
}

export interface BalanceEntry {
  date: Date;
  balance: number;
  dayAmount: number;
  events: EventItem[];
  isCurrentMonth: boolean;
}

// src/types.ts

export interface EventItem {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  startDate: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  disabled?: boolean;
  enabled?: boolean;
  isPlaid?: boolean;
}

export interface BalanceEntry {
  date: Date;
  balance: number;
  dayAmount: number;
  events: EventItem[];
  isCurrentMonth: boolean;
}

export interface Transaction {
  name: string;
  amount: number;
  date: string; // ISO date string
}
export interface SavedScenario {
  id:string;
  name:string;
  date:string;
  balance:number;
  dayAmount: number;
  events:EventItem[];
}
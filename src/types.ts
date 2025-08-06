// src/types.ts

export interface EventItem {
  id: number ;
  title: string;
  amount: number;
  date: string; // ISO date string
  type: 'income' | 'expense';
  frequency: 'monthly' | 'weekly' | 'daily' | 'once' | 'bi-weekly';
  startDate: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  disabled?: boolean;
  enabled?: boolean;
  isPlaid?: boolean;
  recurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  generated?: boolean; // Indicates if this event was generated from a recurring transaction
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

export interface RecurringEvent {
  title: string;
  amount: number;
  frequency: 'monthly';
  dayOfMonth: number;
  startDate: Date;
}
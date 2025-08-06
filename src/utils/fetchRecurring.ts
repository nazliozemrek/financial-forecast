// utils/fetchRecurring.ts

import axios from 'axios';

const fetchRecurringTransactions = async (accessToken: string): Promise<any[]> => {
  try {
    const response = await axios.post('/api/recurring', { accessToken });
    return response.data.recurring;
  } catch (error) {
    console.error('Failed to fetch recurring transactions:', error);
    return [];
  }
};

export { fetchRecurringTransactions };
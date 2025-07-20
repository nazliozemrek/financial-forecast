import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js';
import type { BalanceEntry } from '../types';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

interface BalanceChartProps {
  data: BalanceEntry[];
}

const BalanceChart: React.FC<BalanceChartProps> = ({ data }) => {
  const labels = data.map(entry =>
    new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  );

  const balances = data.map(entry => entry.balance);

  const safePoints = data.map(entry => 
    entry.balance >= 0 ? entry.balance : null
  );

  const dangerPoints = data.map(entry =>
    entry.balance < 0 ? entry.balance : null
  );

  const chartData = {
    labels: data.map(entry => entry.date.toLocaleDateString()),
    datasets: [
      {
        label: 'Balance Safe',
        data: safePoints,
        fill: true,
        borderColor: '#3b82f6', // Blue-400
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        pointBackgroundColor: '#3b82f6',
        tension: 0.3,
        pointRadius: 2
      },
      {
        label:"Danger Zone",
        data: dangerPoints,
        borderColor: 'rgba(220, 38, 38, 0.7)', // Red-600
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        pointBackgroundColor: 'rgba(220, 38, 38, 0.7)',
        pointBorderColor: 'rgba(220, 38, 38, 0.7)',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        fill: false,
        tension: 0.3,

      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display : false,
      },
      tooltip:{
        callbacks:{
          label:(context) => {
            const index = context.dataIndex;
            const entry = data[index];

            const lines =[
            `💰 Balance: $${entry.balance.toFixed(2)}`,
            `📉 Change: $${entry.dayAmount.toFixed(2)}`
            ];
            if ( entry.events && entry.events.length > 0) {
              lines.push('Events:');
              entry.events.forEach(event => {
                const sign =event.amount >= 0 ? '+' : '';
                lines.push(`• ${event.title} (${event.type}): ${sign}$${event.amount.toFixed(2)}`);
              });
            } else {
              lines.push('No events');
            }
            return lines;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  return (
    <div className="mt-6 bg-white/10 border border-white/20 p-4 rounded-xl">
      <h3 className="text-lg font-bold text-white mb-2">📈 Balance Over Time</h3>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default BalanceChart;

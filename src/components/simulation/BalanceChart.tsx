import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  ScatterController,
} from 'chart.js';
import type { BalanceEntry } from '../../types';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler, ScatterController);

interface BalanceChartProps {
  data?: BalanceEntry[];
}

const BalanceChart: React.FC<BalanceChartProps> = ({ data = [] }) => {
  // Prepare labels for x-axis (dates)
  const labels = data.map(entry =>
    new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  );

  // Prepare event markers for fetched transactions
  // Each event will be a scatter point on the chart
  const eventMarkers: { x: string; y: number; event: any }[] = [];
  data.forEach((entry, idx) => {
    if (entry.events && entry.events.length > 0) {
      entry.events.forEach(event => {
        eventMarkers.push({
          x: labels[idx],
          y: entry.balance,
          event,
        });
      });
    }
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Balance Safe',
        data: data.map(entry => entry.balance >= 0 ? entry.balance : null),
        fill: true,
        borderColor: '#3b82f6', // Blue-400
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        pointBackgroundColor: '#3b82f6',
        tension: 0.3,
        pointRadius: 2
      },
      {
        label:"Danger Zone",
        data: data.map(entry => entry.balance < 0 ? entry.balance : null),
        borderColor: 'rgba(220, 38, 38, 0.7)', // Red-600
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        pointBackgroundColor: 'rgba(220, 38, 38, 0.7)',
        pointBorderColor: 'rgba(220, 38, 38, 0.7)',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        fill: false,
        tension: 0.3,
      },
      // Add scatter dataset for event markers
      {
        type: 'scatter' as const,
        label: 'Fetched Transactions',
        data: eventMarkers.map(marker => ({ x: marker.x, y: marker.y })),
        backgroundColor: '#facc15', // yellow-400
        borderColor: '#facc15',
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
        // Custom tooltip for events
        parsing: false,
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
                lines.push(`• ${event.title} (${event.type}${event.recurring ? ', recurring' : ''}): ${sign}$${event.amount.toFixed(2)}`);
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
      x: {
        grid: {
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
          color: 'rgba(255,255,255,0.15)', // subtle grid lines for calendar
        },
        // ...existing code...
      },
      y: {
        beginAtZero: false,
        grid: {
          display: true,
          color: 'rgba(255,255,255,0.08)',
        }
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

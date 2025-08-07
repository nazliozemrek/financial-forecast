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
  compact?: boolean; // New prop to control styling for saved scenarios
}

const BalanceChart: React.FC<BalanceChartProps> = ({ data, compact = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-[#1a1a1a] border border-[#333] rounded-lg">
        <div className="text-center text-gray-300">
          <div className="text-4xl mb-2">📊</div>
          <p>No data available</p>
        </div>
      </div>
    );
  }
  
  // Prepare labels for x-axis (dates)
  const labels = data.map(entry => {
    let date;
    if (entry.date instanceof Date) {
      date = entry.date;
    } else if (typeof entry.date === 'string') {
      date = new Date(entry.date);
    } else {
      console.error('Invalid date format:', entry.date);
      return 'Invalid Date';
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date value:', entry.date);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

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
        label: 'Balance',
        data: data.map(entry => entry.balance),
        borderColor: '#007a33',
        backgroundColor: 'rgba(0, 122, 51, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#007a33',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#007a33',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 15, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#cccccc',
        borderColor: '#007a33',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Balance: $${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          }
        }
      }
    }
  };

  return (
    <>
      {compact ? (
        // Compact version for saved scenarios - no outer container
        <div className="h-full w-full">
          <Line data={chartData} options={options} />
        </div>
      ) : (
        // Full version for main forecast view
        <div className="mt-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/20 p-6 rounded-xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">📈</span>
              Balance Forecast
            </h3>
            {data.length > 0 && (
              <div className="text-sm text-gray-300">
                {data.length} days forecasted
              </div>
            )}
          </div>
          
          {data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p>Run a simulation to see your balance forecast</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <Line data={chartData} options={options} />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BalanceChart;

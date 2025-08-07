import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BalanceEntry {
  date: Date | string;
  balance: number;
  isCurrentMonth?: boolean;
}

interface BalanceChartProps {
  data?: BalanceEntry[];
  compact?: boolean;
  showDangerThresholds?: boolean;
  dangerThreshold?: number;
  warningThreshold?: number;
}

const BalanceChart: React.FC<BalanceChartProps> = ({ 
  data, 
  compact = false,
  showDangerThresholds = true,
  dangerThreshold = 500,
  warningThreshold = 1000
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    // Convert dates to Date objects if they're strings
    const processedEntries = data.map(entry => ({
      ...entry,
      date: typeof entry.date === 'string' ? new Date(entry.date) : entry.date
    }));

    // Sort by date
    processedEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

    let aggregatedData: { date: Date; balance: number; count: number }[] = [];

    if (viewMode === 'daily') {
      // Daily view - use data as is
      aggregatedData = processedEntries.map(entry => ({
        date: entry.date,
        balance: entry.balance,
        count: 1
      }));
    } else if (viewMode === 'weekly') {
      // Weekly aggregation
      const weeklyMap = new Map<string, { balance: number; count: number }>();
      
      processedEntries.forEach(entry => {
        const weekStart = new Date(entry.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (weeklyMap.has(weekKey)) {
          const existing = weeklyMap.get(weekKey)!;
          existing.balance += entry.balance;
          existing.count += 1;
        } else {
          weeklyMap.set(weekKey, { balance: entry.balance, count: 1 });
        }
      });

      aggregatedData = Array.from(weeklyMap.entries()).map(([weekKey, data]) => ({
        date: new Date(weekKey),
        balance: data.balance / data.count, // Average balance for the week
        count: data.count
      }));
    } else {
      // Monthly aggregation
      const monthlyMap = new Map<string, { balance: number; count: number }>();
      
      processedEntries.forEach(entry => {
        const monthKey = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyMap.has(monthKey)) {
          const existing = monthlyMap.get(monthKey)!;
          existing.balance += entry.balance;
          existing.count += 1;
        } else {
          monthlyMap.set(monthKey, { balance: entry.balance, count: 1 });
        }
      });

      aggregatedData = Array.from(monthlyMap.entries()).map(([monthKey, data]) => ({
        date: new Date(monthKey + '-01'),
        balance: data.balance / data.count, // Average balance for the month
        count: data.count
      }));
    }

    // Sort aggregated data by date
    aggregatedData.sort((a, b) => a.date.getTime() - b.date.getTime());

    const labels = aggregatedData.map(entry => {
      if (viewMode === 'daily') {
        return entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (viewMode === 'weekly') {
        return `Week of ${entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        return entry.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    });

    const balanceData = aggregatedData.map(entry => entry.balance);

    // Find peaks and dips for tooltips
    const peaks = [];
    const dips = [];
    
    for (let i = 1; i < balanceData.length - 1; i++) {
      if (balanceData[i] > balanceData[i - 1] && balanceData[i] > balanceData[i + 1]) {
        peaks.push({ index: i, value: balanceData[i], label: labels[i] });
      }
      if (balanceData[i] < balanceData[i - 1] && balanceData[i] < balanceData[i + 1]) {
        dips.push({ index: i, value: balanceData[i], label: labels[i] });
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Balance',
          data: balanceData,
          borderColor: '#007a33',
          backgroundColor: 'rgba(0, 122, 51, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: (context: any) => {
            const value = context.parsed.y;
            if (value < dangerThreshold) return '#ef4444'; // Red for danger
            if (value < warningThreshold) return '#f59e0b'; // Yellow for warning
            return '#007a33'; // Green for normal
          },
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: (context: any) => {
            const value = context.parsed.y;
            if (value < dangerThreshold || value < warningThreshold) return 6; // Larger points for warnings
            return 4;
          },
          pointHoverRadius: 8,
        },
        // Danger threshold line
        ...(showDangerThresholds ? [{
          label: 'Danger Threshold',
          data: new Array(labels.length).fill(dangerThreshold),
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0,
        }] : []),
        // Warning threshold line
        ...(showDangerThresholds ? [{
          label: 'Warning Threshold',
          data: new Array(labels.length).fill(warningThreshold),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0,
        }] : []),
      ],
      peaks,
      dips
    };
  }, [data, viewMode, showDangerThresholds, dangerThreshold, warningThreshold]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !compact,
        labels: {
          color: '#ffffff',
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex;
            const label = context[0].label;
            let title = label;
            
            // Add peak/dip indicators
            const peak = processedData.peaks?.find(p => p.index === dataIndex);
            const dip = processedData.dips?.find(d => d.index === dataIndex);
            
            if (peak) {
              title += ' 📈 (Peak)';
            } else if (dip) {
              title += ' 📉 (Dip)';
            }
            
            return title;
          },
          label: (context: any) => {
            const value = context.parsed.y;
            let label = `Balance: $${value.toFixed(2)}`;
            
            // Add threshold warnings
            if (value < dangerThreshold) {
              label += ' ⚠️ (Danger Zone)';
            } else if (value < warningThreshold) {
              label += ' ⚠️ (Warning Zone)';
            }
            
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
          callback: (value: any) => `$${value.toFixed(0)}`,
        },
        beginAtZero: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (compact) {
    return (
      <div className="h-full w-full">
        <Line data={processedData} options={options} />
      </div>
    );
  }

  return (
    <div className="mt-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/20 p-6 rounded-xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <span className="mr-2">📈</span>
          Balance Forecast
        </h3>
        {data && data.length > 0 && (
          <div className="flex items-center space-x-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#007a33]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div className="text-sm text-gray-300">
              {data.length} days forecasted
            </div>
          </div>
        )}
      </div>
      
      {!data || data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Run a simulation to see your balance forecast</p>
          </div>
        </div>
      ) : (
        <div className="h-80">
          <Line data={processedData} options={options} />
        </div>
      )}

      {/* Legend for thresholds */}
      {showDangerThresholds && data && data.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#007a33] rounded"></div>
            <span className="text-gray-300">Balance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#f59e0b] border border-[#f59e0b] border-dashed"></div>
            <span className="text-gray-300">Warning (${warningThreshold})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#ef4444] border border-[#ef4444] border-dashed"></div>
            <span className="text-gray-300">Danger (${dangerThreshold})</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceChart;

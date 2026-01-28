import React from 'react';
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

const WealthTrajectory = ({ snapshot }) => {
  if (!snapshot || !snapshot.labels || !snapshot.wealth) return null;

  const chartData = {
    labels: snapshot.labels,
    datasets: [
      {
        label: 'Wealth Index',
        data: snapshot.wealth,
        tension: 0.4,
        borderColor: '#087038',
        backgroundColor: 'rgba(8, 112, 56, 0.1)',
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#087038',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const minMaxPad = (values) => {
    const nums = values.map(Number).filter((v) => Number.isFinite(v));
    if (!nums.length) return { min: 0, max: 100 };
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const range = max - min || 1;
    return { min: min - range * 0.15, max: max + range * 0.15 };
  };

  const mm = minMaxPad(snapshot.wealth);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2d2d2d',
        padding: 10,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        borderColor: '#087038',
        borderWidth: 2,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: '#666666', font: { size: 10 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
      },
      y: {
        min: mm.min,
        max: mm.max,
        ticks: {
          color: '#666666',
          font: { size: 10 },
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-white to-lbg-green-pale rounded-2xl p-5 card-shadow border-2 border-lbg-green-subtle hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden flex-1 min-h-0">
      <div className="mb-4 pb-4 border-b-2 border-lbg-salem flex-shrink-0">
        <h2 className="text-lg font-bold text-lbg-grey-900 mb-1">Wealth Trajectory</h2>
        <div className="text-sm text-lbg-grey-600 font-medium">Index points over time</div>
      </div>
      <div className="flex-1 min-h-0">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default WealthTrajectory;

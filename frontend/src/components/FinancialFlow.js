import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatGBP } from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FinancialFlow = ({ snapshot }) => {
  if (!snapshot || !snapshot.flow) return null;

  const { labels, income, expense, savings, grain } = snapshot.flow;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: income,
        backgroundColor: '#087038',
        borderRadius: 8,
      },
      {
        label: 'Expense',
        data: expense,
        backgroundColor: '#0a8a4a',
        borderRadius: 8,
      },
      {
        label: 'Savings',
        data: savings,
        backgroundColor: '#0d9488',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#404040',
          font: { size: 11, weight: '600' },
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#2d2d2d',
        padding: 10,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        borderColor: '#087038',
        borderWidth: 2,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${formatGBP(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#666666', font: { size: 10 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
      },
      y: {
        ticks: {
          color: '#666666',
          font: { size: 10 },
          callback: (value) => formatGBP(value),
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
      },
    },
  };

  const title = grain === 'monthly'
    ? 'Flow (month-wise): Income vs Expense vs Savings'
    : 'Flow (year-wise): Income vs Expense vs Savings';

  return (
    <div className="bg-gradient-to-br from-white to-lbg-green-pale rounded-2xl p-5 card-shadow border-2 border-lbg-green-subtle hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden">
      <div className="mb-4 pb-4 border-b-2 border-lbg-salem flex-shrink-0">
        <h2 className="text-lg font-bold text-lbg-grey-900">{title}</h2>
      </div>
      <div className="flex-1 min-h-0">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default FinancialFlow;

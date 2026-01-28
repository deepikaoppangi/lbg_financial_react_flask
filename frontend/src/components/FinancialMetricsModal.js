import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatPercentage } from '../utils/formatters';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const FinancialMetricsModal = ({ snapshot, onClose }) => {
  if (!snapshot) return null;

  const salary = snapshot.salary_monthly || 0;
  const expenses = snapshot.monthly_expense_total || 0;
  const savings = snapshot.savings_est_monthly || 0;

  const savingsRate = salary > 0 ? Math.round((savings / salary) * 100) : 0;
  const expenseRatio = salary > 0 ? (expenses / salary) : 1;
  const efficiency = Math.max(0, Math.min(100, Math.round((1 - expenseRatio) * 100)));
  const goalProgress = Math.round((snapshot.resilience + snapshot.liquidity) / 2);
  const resilience = snapshot.resilience || 0;
  const liquidity = snapshot.liquidity || 0;

  const satisfactionData = {
    labels: ['Resilience', 'Liquidity', 'Savings Rate', 'Expense Control'],
    datasets: [
      {
        label: 'Financial Satisfaction',
        data: [resilience, liquidity, savingsRate, efficiency],
        backgroundColor: 'rgba(8, 112, 56, 0.2)',
        borderColor: '#087038',
        pointBackgroundColor: '#087038',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#0da85a',
        pointHoverBorderColor: '#ffffff',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const satisfactionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2d2d2d',
        padding: 12,
        titleFont: { size: 14, weight: '600' },
        bodyFont: { size: 13 },
        borderColor: '#087038',
        borderWidth: 2,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed.r}%`,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: '#666666',
          font: { size: 10 },
          backdropColor: 'transparent',
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        pointLabels: {
          color: '#404040',
          font: { size: 11, weight: '600' },
        },
      },
    },
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-65 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" 
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b-2 border-lbg-green-pale rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-lbg-grey-800">Financial Metrics Details</h2>
          <button className="text-3xl text-lbg-grey-600 hover:text-lbg-grey-800 hover:bg-lbg-grey-100 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:rotate-90" onClick={onClose}>&times;</button>
        </div>
        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-lbg-salem mb-5 pb-3 border-b-2 border-lbg-green-pale">Financial Engagement</h3>
            <div className="flex flex-col gap-5">
              {[
                { label: 'Savings Rate', value: savingsRate },
                { label: 'Spending Efficiency', value: efficiency },
                { label: 'Goal Progress', value: goalProgress },
              ].map((item, index) => (
                <div key={index} className="p-5 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border border-lbg-green-subtle hover:translate-x-1 transition-transform duration-300">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-semibold text-lbg-grey-800">{item.label}</span>
                    <span className="text-xl font-bold text-lbg-salem">{formatPercentage(item.value)}</span>
                  </div>
                  <div className="h-3.5 bg-lbg-grey-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-600"
                      style={{
                        width: `${Math.min(item.value, 100)}%`,
                        background: 'linear-gradient(90deg, #087038 0%, #0da85a 100%)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-lbg-salem mb-5 pb-3 border-b-2 border-lbg-green-pale">Financial Health</h3>
            <div className="flex flex-col gap-5">
              {[
                { label: 'Financial Resilience', value: resilience, desc: 'Your ability to handle unexpected expenses' },
                { label: 'Liquidity Score', value: liquidity, desc: 'Access to available funds' },
              ].map((item, index) => (
                <div key={index} className="p-5 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border border-lbg-green-subtle hover:translate-x-1 transition-transform duration-300">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-semibold text-lbg-grey-800">{item.label}</span>
                    <span className="text-xl font-bold text-lbg-salem">{formatPercentage(item.value)}</span>
                  </div>
                  <div className="h-3.5 bg-lbg-grey-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-600"
                      style={{
                        width: `${item.value}%`,
                        background: 'linear-gradient(90deg, #087038 0%, #0da85a 100%)',
                      }}
                    />
                  </div>
                  <div className="text-xs text-lbg-grey-600 italic">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-lbg-salem mb-5 pb-3 border-b-2 border-lbg-green-pale">Financial Satisfaction</h3>
            <div className="h-[350px]">
              <Radar data={satisfactionData} options={satisfactionOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialMetricsModal;

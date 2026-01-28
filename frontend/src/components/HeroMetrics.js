import React from 'react';
import { formatGBP, formatPercentage } from '../utils/formatters';

const HeroMetrics = ({ snapshot }) => {
  if (!snapshot) return null;

  const salary = snapshot.salary_monthly || 0;
  const savings = snapshot.savings_est_monthly || 0;
  const expenses = snapshot.monthly_expense_total || 0;
  
  const savingsRate = salary > 0 ? Math.round((savings / salary) * 100) : 0;
  const expenseRatio = salary > 0 ? (expenses / salary) : 1;
  const efficiency = Math.max(0, Math.min(100, Math.round((1 - expenseRatio) * 100)));
  const goalProgress = Math.round((snapshot.resilience + snapshot.liquidity) / 2);
  const wellnessScore = Math.round((savingsRate * 0.3 + efficiency * 0.3 + goalProgress * 0.4));

  const metrics = [
    {
      label: 'Monthly Income',
      value: formatGBP(salary),
      trend: 'Steady growth',
      icon: '↑',
      color: 'text-lbg-salem',
      bg: 'bg-gradient-to-br from-lbg-green-pale to-white',
    },
    {
      label: 'Estimated Savings',
      value: formatGBP(savings),
      trend: 'On track',
      icon: '✓',
      color: 'text-lbg-green-bright',
      bg: 'bg-gradient-to-br from-lbg-green-pale to-white',
    },
    {
      label: 'Monthly Expenses',
      value: formatGBP(expenses),
      trend: 'Well managed',
      icon: '→',
      color: 'text-[#d97706]',
      bg: 'bg-gradient-to-br from-lbg-green-pale to-white',
    },
    {
      label: 'Financial Wellbeing',
      value: formatPercentage(wellnessScore),
      trend: 'Excellent',
      icon: '★',
      color: 'text-[#2563eb]',
      bg: 'bg-gradient-to-br from-lbg-green-pale to-white',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`${metric.bg} rounded-2xl p-5 card-shadow border-2 border-lbg-green-subtle hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-lbg-salem"></div>
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold text-lbg-grey-600 uppercase tracking-wider">
              {metric.label}
            </div>
            <div className={`text-3xl font-bold ${metric.color} tracking-tight transition-transform duration-300 group-hover:scale-110`}>
              {metric.value}
            </div>
            <div className="flex items-center gap-2 text-xs text-lbg-grey-600 font-medium">
              <span className="text-base transition-transform duration-300 group-hover:scale-125">{metric.icon}</span>
              <span>{metric.trend}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeroMetrics;

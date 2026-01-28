import React, { useState } from 'react';
import { formatPercentage } from '../utils/formatters';
import FinancialMetricsModal from './FinancialMetricsModal';

const FinancialMetrics = ({ snapshot }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!snapshot) return null;

  const salary = snapshot.salary_monthly || 0;
  const expenses = snapshot.monthly_expense_total || 0;
  const savings = snapshot.savings_est_monthly || 0;

  const savingsRate = salary > 0 ? Math.round((savings / salary) * 100) : 0;
  const resilience = snapshot.resilience || 0;
  const liquidity = snapshot.liquidity || 0;

  return (
    <>
      <div
        className="bg-gradient-to-br from-white to-lbg-green-pale rounded-2xl p-5 card-shadow border-2 border-lbg-green-subtle hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full overflow-hidden group"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="mb-4 pb-4 border-b-2 border-lbg-salem flex-shrink-0">
          <h2 className="text-lg font-bold text-lbg-grey-900 mb-1">Financial Metrics</h2>
          <div className="text-sm text-lbg-grey-600 font-medium">
            Engagement, Health & Satisfaction
          </div>
        </div>
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border-2 border-lbg-green-subtle hover:from-lbg-green-subtle transition-all duration-300 hover:translate-x-2 hover:shadow-md">
            <span className="text-sm font-semibold text-lbg-grey-700">Savings Rate</span>
            <span className="text-xl font-bold text-lbg-salem">{formatPercentage(savingsRate)}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border-2 border-lbg-green-subtle hover:from-lbg-green-subtle transition-all duration-300 hover:translate-x-2 hover:shadow-md">
            <span className="text-sm font-semibold text-lbg-grey-700">Resilience</span>
            <span className="text-xl font-bold text-lbg-salem">{formatPercentage(resilience)}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border-2 border-lbg-green-subtle hover:from-lbg-green-subtle transition-all duration-300 hover:translate-x-2 hover:shadow-md">
            <span className="text-sm font-semibold text-lbg-grey-700">Liquidity</span>
            <span className="text-xl font-bold text-lbg-salem">{formatPercentage(liquidity)}</span>
          </div>
          <div className="text-xs text-lbg-salem text-center font-semibold mt-auto p-3 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border-2 border-dashed border-lbg-green-subtle group-hover:border-solid transition-all">
            Click to view detailed metrics →
          </div>
        </div>
      </div>
      {isModalOpen && (
        <FinancialMetricsModal
          snapshot={snapshot}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default FinancialMetrics;

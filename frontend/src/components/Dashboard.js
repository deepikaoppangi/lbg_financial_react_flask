import React from 'react';
import HeroMetrics from './HeroMetrics';
import ExpenseBreakdown from './ExpenseBreakdown';
import FinancialMetrics from './FinancialMetrics';
import FinancialFlow from './FinancialFlow';
import WealthTrajectory from './WealthTrajectory';
import InsightSummary from './InsightSummary';
import ScenarioPlanning from './ScenarioPlanning';

const Dashboard = ({ snapshot, period, currentProfile }) => {
  if (!snapshot) return null;

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Hero Metrics at Top */}
      <div className="animate-fade-in">
        <HeroMetrics snapshot={snapshot} />
      </div>

      {/* Three Column Grid Below */}
      <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Left Column */}
        <div className="col-span-4 flex flex-col gap-4 h-full overflow-hidden">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <ExpenseBreakdown snapshot={snapshot} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <FinancialMetrics snapshot={snapshot} />
          </div>
        </div>

        {/* Center Column */}
        <div className="col-span-4 flex flex-col gap-4 h-full overflow-hidden">
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <FinancialFlow snapshot={snapshot} />
          </div>
          <div className="flex-1 min-h-0 animate-scale-in" style={{ animationDelay: '0.25s' }}>
            <WealthTrajectory snapshot={snapshot} />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 flex flex-col gap-4 h-full overflow-hidden">
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <InsightSummary period={period} currentProfile={currentProfile} />
          </div>
          <div className="flex-1 min-h-0 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <ScenarioPlanning period={period} currentProfile={currentProfile} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

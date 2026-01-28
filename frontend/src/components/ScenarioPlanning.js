import React, { useState } from 'react';
import { fetchSimulation } from '../utils/api';
import { formatBulletPoints } from '../utils/formatters';
import SimulationModal from './SimulationModal';

const ScenarioPlanning = ({ period, currentProfile }) => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSimulate = async () => {
    if (!question.trim()) {
      setResult({
        heading: '',
        lines: ["Type a scenario question first (e.g. 'retire at 65')."],
        enabled: true,
      });
      setIsModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSimulation(period, question, currentProfile);
      setResult(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error running simulation:', error);
      setResult({
        heading: 'Error',
        lines: ['Failed to run simulation. Please try again.'],
        enabled: false,
      });
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSimulate();
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white to-lbg-green-pale rounded-2xl p-5 card-shadow border-2 border-lbg-green-subtle hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden flex-1 min-h-0">
        <div className="mb-4 pb-4 border-b-2 border-lbg-salem flex-shrink-0">
          <h2 className="text-lg font-bold text-lbg-grey-900 mb-1">Financial Scenario Planning</h2>
          <div className="text-sm text-lbg-grey-600 font-medium">Explore financial scenarios</div>
        </div>
        <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Try: 'I want to retire at 65'..."
            className="w-full px-4 py-3 border-2 border-lbg-grey-200 rounded-xl text-sm bg-white transition-all focus:outline-none focus:border-lbg-salem focus:ring-3 focus:ring-lbg-salem/20 text-lbg-grey-800"
          />
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-lbg-green-light to-lbg-salem text-white font-semibold text-sm rounded-xl transition-all duration-250 hover:from-lbg-salem hover:to-lbg-green-dark hover:-translate-y-1 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Planning...' : 'Plan Your Future'}
          </button>
        </div>
        {result && (
          <div className="p-4 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border-2 border-lbg-green-subtle mt-2 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="text-sm font-bold text-lbg-salem mb-2">
              {result.heading?.replace(/#\w+/g, '').trim() || 'Simulation Result'}
            </div>
            <div className="text-xs text-lbg-grey-700 line-clamp-2 mb-3 flex-1 overflow-hidden">
              {formatBulletPoints(result.lines?.slice(0, 2) || [])}
            </div>
            <button
              className="w-full px-3 py-2 bg-gradient-to-r from-lbg-green-light to-lbg-salem text-white font-semibold text-xs rounded-xl transition-all duration-250 hover:from-lbg-salem hover:to-lbg-green-dark hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              onClick={() => setIsModalOpen(true)}
            >
              Read More →
            </button>
          </div>
        )}
        {!result && (
          <div className="p-5 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border-2 border-lbg-green-subtle flex-1 flex items-center justify-center min-h-0">
            <p className="text-xs text-lbg-grey-600 italic text-center">
              Click "Plan Your Future" to explore financial scenarios
            </p>
          </div>
        )}
      </div>
      {isModalOpen && result && (
        <SimulationModal
          result={result}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default ScenarioPlanning;

import React, { useState } from 'react';
import { fetchSnapshot } from '../utils/api';
import { formatBulletPoints } from '../utils/formatters';
import InsightModal from './InsightModal';

const InsightSummary = ({ period, currentProfile }) => {
  const [question, setQuestion] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerate = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const data = await fetchSnapshot(period, question, currentProfile);
      setSummary(data.summary);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error generating insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white to-lbg-green-pale rounded-2xl p-5 card-shadow border-2 border-lbg-green-subtle hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden">
        <div className="mb-4 pb-4 border-b-2 border-lbg-salem flex-shrink-0">
          <h2 className="text-lg font-bold text-lbg-grey-900 mb-1">Financial Insight Summary</h2>
          <div className="text-sm text-lbg-grey-600 font-medium">AI-powered financial insights</div>
        </div>
        <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your finances..."
            className="w-full px-4 py-3 border-2 border-lbg-grey-200 rounded-xl text-sm bg-white transition-all focus:outline-none focus:border-lbg-salem focus:ring-3 focus:ring-lbg-salem/20 text-lbg-grey-800"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-lbg-salem to-lbg-green-light text-white font-semibold text-sm rounded-xl transition-all duration-250 hover:from-lbg-green-dark hover:to-lbg-salem hover:-translate-y-1 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Insight'}
          </button>
        </div>
        {summary && (
          <div className="p-4 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border-2 border-lbg-green-subtle mt-2 flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="text-sm font-bold text-lbg-salem mb-2">
              {summary.headline?.replace(/#\w+/g, '').trim() || 'Insight'}
            </div>
            <div className="text-xs text-lbg-grey-700 line-clamp-2 mb-3 flex-1 overflow-hidden">
              {formatBulletPoints(summary.bullets?.slice(0, 2) || [])}
            </div>
            <button
              className="w-full px-3 py-2 bg-gradient-to-r from-lbg-green-light to-lbg-salem text-white font-semibold text-xs rounded-xl transition-all duration-250 hover:from-lbg-salem hover:to-lbg-green-dark hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              onClick={() => setIsModalOpen(true)}
            >
              Read More →
            </button>
          </div>
        )}
        {!summary && (
          <div className="p-5 bg-gradient-to-r from-lbg-green-pale to-white rounded-xl border-2 border-lbg-green-subtle flex-1 flex items-center justify-center min-h-0">
            <p className="text-xs text-lbg-grey-600 italic text-center">
              Click "Generate Insight" to view AI-powered financial analysis
            </p>
          </div>
        )}
      </div>
      {isModalOpen && summary && (
        <InsightModal
          summary={summary}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default InsightSummary;

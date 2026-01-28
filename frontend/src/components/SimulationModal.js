import React from 'react';
import { formatBulletPoints } from '../utils/formatters';

const SimulationModal = ({ result, onClose }) => {
  if (!result) return null;

  const heading = result.heading?.replace(/#\w+/g, '').trim() || 'Simulation Result';

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
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b-2 border-lbg-green-pale rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-lbg-grey-800">Plan Your Future</h2>
          <button className="text-3xl text-lbg-grey-600 hover:text-lbg-grey-800 hover:bg-lbg-grey-100 w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:rotate-90" onClick={onClose}>&times;</button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-lbg-salem mb-4">{heading}</h3>
            <div className="text-sm text-lbg-grey-700 leading-relaxed space-y-3">
              {formatBulletPoints(result.lines || [])}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationModal;

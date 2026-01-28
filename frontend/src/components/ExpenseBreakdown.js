import React, { useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatGBP } from '../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpenseBreakdown = ({ snapshot }) => {
  const chartRef = useRef(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!snapshot || !snapshot.expenses) return null;

  const sortedExpenses = [...snapshot.expenses].sort((a, b) => b.monthly - a.monthly);
  const labels = sortedExpenses.map((e) => e.label);
  const data = sortedExpenses.map((e) => e.monthly);
  const percentages = sortedExpenses.map((e) => e.pct);

  // Intelligent green and black color scheme
  // Alternating between green shades and black/grey shades for visual contrast
  const expenseColors = [
    "#087038",      // Dark green (salem) - highest expense
    "#1a1a1a",      // Black - second highest
    "#0a8a4a",      // Medium green - third
    "#2d2d2d",      // Dark grey - fourth
    "#0da85a",      // Bright green - fifth
    "#404040",      // Medium grey - sixth
    "#c8e6d5",      // Light green - seventh
    "#666666",      // Grey - eighth
    "#e8f5ed",      // Pale green - ninth
    "#999999",      // Light grey - tenth
  ];

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: data.map((_, index) => expenseColors[index % expenseColors.length]),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 5,
        hoverBorderColor: '#087038',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onHover: (event, activeElements) => {
      if (event.native) {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    },
    onClick: (event, activeElements) => {
      if (activeElements.length > 0) {
        const index = activeElements[0].index;
        setSelectedSegment({
          label: labels[index],
          value: data[index],
          percentage: percentages[index],
          color: expenseColors[index % expenseColors.length],
        });
        setIsModalOpen(true);
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: '#404040',
          font: { size: 11, weight: '600' },
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => ({
                text: `${label}: ${formatGBP(data.datasets[0].data[i])} (${percentages[i]}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].borderColor,
                lineWidth: data.datasets[0].borderWidth,
                hidden: false,
                index: i,
              }));
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        titleFont: { size: 14, weight: '700' },
        bodyFont: { size: 13, weight: '500' },
        borderColor: '#087038',
        borderWidth: 3,
        cornerRadius: 10,
        titleColor: '#ffffff',
        bodyColor: '#e8f5ed',
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const pct = percentages[context.dataIndex] || 0;
            return `${label}: ${formatGBP(value)} (${pct}% of total)`;
          },
        },
      },
    },
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white to-lbg-green-pale rounded-2xl p-5 card-shadow border-2 border-lbg-green-subtle hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden">
        <div className="mb-4 pb-4 border-b-2 border-lbg-salem flex-shrink-0">
          <h2 className="text-lg font-bold text-lbg-grey-900 mb-1">Expense Breakdown</h2>
          <div className="text-sm text-lbg-grey-700 font-semibold">
            Total: <span className="text-lbg-salem font-bold">{formatGBP(snapshot.monthly_expense_total)}</span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Doughnut ref={chartRef} data={chartData} options={chartOptions} />
        </div>
        <div className="mt-3 pt-3 border-t border-lbg-green-subtle text-xs text-lbg-grey-600 text-center italic">
          Click on any segment to view details
        </div>
      </div>

      {/* Modal for selected segment */}
      {isModalOpen && selectedSegment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" 
          onClick={() => setIsModalOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-scale-in relative overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Header with segment color */}
            <div 
              className="h-2 w-full"
              style={{ backgroundColor: selectedSegment.color }}
            ></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-lbg-grey-900 mb-2">{selectedSegment.label}</h2>
                  <p className="text-sm text-lbg-grey-600">Expense Category Details</p>
                </div>
                <button 
                  className="text-3xl text-lbg-grey-600 hover:text-lbg-grey-900 hover:bg-lbg-grey-100 w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:rotate-90" 
                  onClick={() => setIsModalOpen(false)}
                >
                  &times;
                </button>
              </div>

              {/* Large pie chart showing only selected segment */}
              <div className="mb-6">
                <div className="h-64 flex items-center justify-center">
                  <Doughnut 
                    data={{
                      labels: [selectedSegment.label, 'Other'],
                      datasets: [{
                        data: [selectedSegment.value, snapshot.monthly_expense_total - selectedSegment.value],
                        backgroundColor: [
                          selectedSegment.color,
                          '#e0e0e0'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 4,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      cutout: '60%',
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          enabled: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="bg-gradient-to-r from-lbg-green-pale to-white rounded-xl p-6 border-2 border-lbg-green-subtle">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-semibold text-lbg-grey-600 mb-2">Monthly Amount</div>
                    <div className="text-3xl font-bold text-lbg-salem">{formatGBP(selectedSegment.value)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-lbg-grey-600 mb-2">Percentage of Total</div>
                    <div className="text-3xl font-bold text-lbg-grey-900">{selectedSegment.percentage}%</div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-lbg-green-subtle">
                  <div className="text-sm font-semibold text-lbg-grey-600 mb-2">Annual Projection</div>
                  <div className="text-2xl font-bold text-lbg-grey-900">{formatGBP(selectedSegment.value * 12)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpenseBreakdown;

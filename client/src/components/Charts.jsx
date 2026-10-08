import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function ScoreComparisonChart({ scoreBefore = 50, scoreAfter = 85 }) {
  const data = {
    labels: ['Before Remediation', 'After Remediation'],
    datasets: [
      {
        label: 'WCAG Accessibility Score (0 - 100)',
        data: [scoreBefore, scoreAfter],
        backgroundColor: [
          scoreBefore >= 80 ? 'rgba(16, 185, 129, 0.8)' : scoreBefore >= 50 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(239, 68, 68, 0.8)',
          'rgba(16, 185, 129, 0.85)'
        ],
        borderColor: [
          scoreBefore >= 80 ? '#10b981' : scoreBefore >= 50 ? '#f59e0b' : '#ef4444',
          '#059669'
        ],
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      x: {
        ticks: { color: '#94a3b8', font: { weight: 'bold' } },
        grid: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Score: ${ctx.parsed.y} / 100`
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Score Progression
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            +{Math.max(0, scoreAfter - scoreBefore)} pts
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Calculated according to axe-core standard deduction formula
        </p>
      </div>

      <div className="h-48 relative">
        <Bar data={data} options={options} />
      </div>

      {/* Accessible data table for screen readers and text access */}
      <table className="sr-only" aria-label="Score Comparison Data">
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Before Remediation</td>
            <td>{scoreBefore} out of 100</td>
          </tr>
          <tr>
            <td>After Remediation</td>
            <td>{scoreAfter} out of 100</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function SeverityChart({ counts = { critical: 0, serious: 0, moderate: 0, minor: 0 } }) {
  const critical = counts.critical || 0;
  const serious = counts.serious || 0;
  const moderate = counts.moderate || 0;
  const minor = counts.minor || 0;
  const total = critical + serious + moderate + minor;

  const data = {
    labels: ['Critical', 'Serious', 'Moderate', 'Minor'],
    datasets: [
      {
        data: [critical, serious, moderate, minor],
        backgroundColor: [
          '#ef4444', // Red (Critical)
          '#f97316', // Orange (Serious)
          '#eab308', // Yellow (Moderate)
          '#3b82f6'  // Blue (Minor)
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          color: '#94a3b8',
          font: { size: 11, weight: 'bold' }
        }
      }
    },
    cutout: '65%'
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Issues by Severity
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {total} Total
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Prioritized by barrier severity for people with disabilities
        </p>
      </div>

      <div className="h-48 relative flex items-center justify-center">
        {total === 0 ? (
          <div className="text-center text-xs text-slate-400">
            No accessibility violations detected!
          </div>
        ) : (
          <Doughnut data={data} options={options} />
        )}
      </div>

      {/* Accessible data table for screen readers and text access */}
      <table className="sr-only" aria-label="Violations by Severity Data">
        <thead>
          <tr>
            <th scope="col">Severity</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Critical</td>
            <td>{critical}</td>
          </tr>
          <tr>
            <td>Serious</td>
            <td>{serious}</td>
          </tr>
          <tr>
            <td>Moderate</td>
            <td>{moderate}</td>
          </tr>
          <tr>
            <td>Minor</td>
            <td>{minor}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

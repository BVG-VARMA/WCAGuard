import React from 'react';

export default function ScoreGauge({ score = 0, label = 'Accessibility Score', size = 160, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = '#DC2626'; // Red < 60
  let badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  let ratingText = 'Critical Violations';

  if (clampedScore >= 85) {
    color = '#15803D'; // Green >= 85
    badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    ratingText = 'Good Conformance';
  } else if (clampedScore >= 60) {
    color = '#B45309'; // Amber 60..84
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    ratingText = 'Moderate Conformance';
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-4"
      role="progressbar"
      aria-label={label}
      aria-valuenow={clampedScore}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-700"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {clampedScore}
          </span>
          <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
            out of 100
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>
          {ratingText}
        </span>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}

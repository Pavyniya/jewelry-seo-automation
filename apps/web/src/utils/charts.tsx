import React from 'react';

// Simple chart components for data visualization
// In a real implementation, you might use Chart.js, Recharts, or similar

interface ChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}

export const SimpleBarChart: React.FC<ChartProps> = ({
  data,
  labels = [],
  color = '#3b82f6',
  height = 200,
}) => {
  const maxValue = Math.max(...data, 1);
  const width = 100;
  const barWidth = width / data.length;

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full">
        {data.map((value, index) => (
          <div
            key={index}
            className="flex flex-col items-center"
            style={{ width: `${barWidth}%` }}
          >
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${(value / maxValue) * 100}%`,
                backgroundColor: color,
                minHeight: '4px',
              }}
            />
            {labels[index] && (
              <div className="text-xs text-gray-600 mt-1 text-center truncate w-full">
                {labels[index]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface LineChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}

export const SimpleLineChart: React.FC<LineChartProps> = ({
  data,
  labels = [],
  color = '#3b82f6',
  height = 200,
}) => {
  const maxValue = Math.max(...data, 1);
  const width = 100;
  const step = width / (data.length - 1);

  const points = data.map((value, index) => {
    const x = (index * step);
    const y = 100 - ((value / maxValue) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}

        {/* Data line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((value, index) => {
          const x = (index * step);
          const y = 100 - ((value / maxValue) * 100);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              className="hover:r-2 transition-all"
            />
          );
        })}
      </svg>

      {/* Labels */}
      <div className="flex justify-between mt-2">
        {labels.map((label, index) => (
          <div
            key={index}
            className="text-xs text-gray-600 text-center"
            style={{ width: `${100 / labels.length}%` }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 60,
  strokeWidth = 4,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-medium">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'increase',
  icon,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const changeIcon = changeType === 'increase' ? '↗' : '↘';
  const changeColor = changeType === 'increase' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
          {change !== undefined && (
            <div className={`text-sm mt-1 ${changeColor}`}>
              {changeIcon} {Math.abs(change)}%
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';

type RollingAverageChartProps = {
  data: { label: string; actual: number; average: number }[];
  height?: number;
  barColor?: string;
  lineColor?: string;
  className?: string;
};

export function RollingAverageChart({
  data,
  height = 120,
  barColor = 'var(--color-gray-200, #e5e7eb)',
  lineColor = 'var(--color-brand, #10b981)',
  className = '',
}: RollingAverageChartProps) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => Math.max(d.actual, d.average)));
  const range = maxVal || 1;
  const n = data.length;
  
  // Need to measure in percentages or viewBox coords. We'll use a fixed viewBox coordinate space.
  const width = 400;
  
  const barWidth = Math.max(10, (width / n) * 0.6);

  const linePoints = data.map((d, i) => {
    const x = (i / Math.max(1, n - 1)) * (width - barWidth) + barWidth / 2;
    const y = height - (d.average / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${linePoints.join(' L ')}`;

  return (
    <div className={`w-full relative ${className}`}>
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        {/* Bars */}
        {data.map((d, i) => {
          const x = (i / Math.max(1, n - 1)) * (width - barWidth);
          const barH = (d.actual / range) * height;
          const y = height - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={barColor}
              rx={2}
            />
          );
        })}

        {/* Rolling Average Line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Line Dots */}
        {data.map((d, i) => {
          const [cx, cy] = linePoints[i].split(',');
          return (
            <circle
              key={`dot-${i}`}
              cx={cx}
              cy={cy}
              r={4}
              fill="white"
              stroke={lineColor}
              strokeWidth={2}
            />
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-3 text-xs text-gray-400 font-medium">
        {data.map((d, i) => (
          <div key={i} className="text-center" style={{ width: `${100/n}%` }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

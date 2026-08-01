import React from 'react';

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'var(--color-brand)',
  strokeWidth = 2,
  className = '',
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  const paddedMin = min - (range * 0.1);
  const paddedMax = max + (range * 0.1);
  const paddedRange = paddedMax - paddedMin || 1; // avoid div by 0

  const n = data.length;
  
  const points = data.map((val, i) => {
    const x = (i / (n - 1)) * width;
    const y = height - ((val - paddedMin) / paddedRange) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      className={className}
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Area under the line */}
      <path
        d={`${pathD} L ${width},${height} L 0,${height} Z`}
        fill={color}
        opacity={0.1}
      />
      
      {/* End dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r={strokeWidth * 1.5}
          fill={color}
        />
      )}
    </svg>
  );
}

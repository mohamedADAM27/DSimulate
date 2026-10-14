/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - High-Precision SVG Engineering Line Chart
 */

import React, { useState } from 'react';

export interface SeriesData {
  name: string;
  color: string;
  dashArray?: string;
  points: { x: number; y: number }[];
}

interface EngineeringLineChartProps {
  title?: string;
  xAxisLabel: string;
  yAxisLabel: string;
  series: SeriesData[];
  thresholdLine?: { y: number; label: string; color: string };
  height?: number;
  className?: string;
  yDomain?: [number, number];
}

export const EngineeringLineChart: React.FC<EngineeringLineChartProps> = ({
  title,
  xAxisLabel,
  yAxisLabel,
  series,
  thresholdLine,
  height = 200,
  className = '',
  yDomain,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute domains
  const allPoints = series.flatMap(s => s.points);
  if (allPoints.length === 0) return null;

  const minX = Math.min(...allPoints.map(p => p.x));
  const maxX = Math.max(...allPoints.map(p => p.x));
  
  const rawMinY = Math.min(...allPoints.map(p => p.y));
  const rawMaxY = Math.max(...allPoints.map(p => p.y));

  const minY = yDomain ? yDomain[0] : Math.floor(rawMinY * 0.98);
  const maxY = yDomain ? yDomain[1] : Math.ceil(rawMaxY * 1.02);

  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const width = 500; // SVG viewBox coordinate space
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const scaleX = (x: number) => padding.left + ((x - minX) / Math.max(1, maxX - minX)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - ((y - minY) / Math.max(0.001, maxY - minY)) * chartHeight;

  // Grid tick marks
  const xTicks = 6;
  const yTicks = 5;
  const xStep = (maxX - minX) / (xTicks - 1);
  const yStep = (maxY - minY) / (yTicks - 1);

  return (
    <div className={`flex flex-col bg-white select-none ${className}`}>
      {title && (
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#20252A] pb-1 border-b border-[#E3E6E8] mb-1">
          <span>{title}</span>
          <div className="flex items-center gap-3 text-[10px] font-normal text-[#5E666D]">
            {series.map(s => (
              <span key={s.name} className="flex items-center gap-1">
                <span 
                  className="w-2.5 h-[2px] inline-block" 
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.name}</span>
              </span>
            ))}
            {thresholdLine && (
              <span className="flex items-center gap-1 text-[#C62828]">
                <span className="w-2.5 h-[1px] border-b border-dashed border-[#C62828] inline-block" />
                <span>{thresholdLine.label}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="relative w-full">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible"
          style={{ maxHeight: height }}
        >
          {/* Horizontal Grid lines */}
          {Array.from({ length: yTicks }).map((_, i) => {
            const val = minY + i * yStep;
            const y = scaleY(val);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#E5E9EC"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[8.5px] fill-[#7A8289] font-mono-numbers"
                >
                  {Number(val.toFixed(1))}
                </text>
              </g>
            );
          })}

          {/* Vertical Grid lines */}
          {Array.from({ length: xTicks }).map((_, i) => {
            const val = minX + i * xStep;
            const x = scaleX(val);
            return (
              <g key={`x-${i}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#E5E9EC"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 12}
                  textAnchor="middle"
                  className="text-[8.5px] fill-[#7A8289] font-mono-numbers"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Threshold Line (e.g. 80% EOL) */}
          {thresholdLine && (
            <g>
              <line
                x1={padding.left}
                y1={scaleY(thresholdLine.y)}
                x2={width - padding.right}
                y2={scaleY(thresholdLine.y)}
                stroke={thresholdLine.color}
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />
              <text
                x={width - padding.right + 4}
                y={scaleY(thresholdLine.y) + 3}
                className="text-[8.5px] font-semibold"
                fill={thresholdLine.color}
              >
                {thresholdLine.label} ({thresholdLine.y}%)
              </text>
            </g>
          )}

          {/* Data Series Polylines */}
          {series.map((s) => {
            const pointsString = s.points
              .map(p => `${scaleX(p.x)},${scaleY(p.y)}`)
              .join(' ');

            return (
              <polyline
                key={s.name}
                fill="none"
                stroke={s.color}
                strokeWidth="1.75"
                strokeDasharray={s.dashArray}
                points={pointsString}
              />
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + chartWidth / 2}
            y={height - 2}
            textAnchor="middle"
            className="text-[9px] fill-[#5E666D] font-sans font-medium"
          >
            {xAxisLabel}
          </text>
          <text
            transform={`rotate(-90)`}
            x={-(padding.top + chartHeight / 2)}
            y={12}
            textAnchor="middle"
            className="text-[9px] fill-[#5E666D] font-sans font-medium"
          >
            {yAxisLabel}
          </text>
        </svg>
      </div>
    </div>
  );
};

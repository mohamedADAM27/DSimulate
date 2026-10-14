/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Multi-Scenario Engineering Radar Chart
 */

import React from 'react';
import { ScenarioResult } from '../../types/battery';

interface EngineeringRadarChartProps {
  scenarios: ScenarioResult[];
  className?: string;
}

export const EngineeringRadarChart: React.FC<EngineeringRadarChartProps> = ({
  scenarios,
  className = '',
}) => {
  const axes = [
    { label: 'RUL (Cycles)', key: 'rul' },
    { label: 'Thermal Safety', key: 'thermal' },
    { label: 'Fast Charge Rate', key: 'cRate' },
    { label: 'Capacity Ret.', key: 'retention' },
    { label: 'Aging Resistance', key: 'aging' },
  ];

  const size = 260;
  const center = size / 2;
  const radius = 95;
  const levels = 4;

  const getAxisPoint = (axisIndex: number, normValue: number) => {
    const angle = (Math.PI * 2 / axes.length) * axisIndex - Math.PI / 2;
    const r = radius * Math.max(0.1, Math.min(1.0, normValue));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getScenarioPoints = (sc: ScenarioResult) => {
    // Normalize parameters to 0.1 - 1.0 range
    const normRul = Math.min(1.0, sc.predictedRulCycles / 1500);
    const normThermal = Math.max(0.2, 1.0 - (sc.peakOperatingTemp - 25) / 35);
    const normCRate = sc.config.chargingRateC / 3.0;
    const normRetention = sc.capacityRetentionKWh / 82.5;
    const normAging = Math.max(0.2, 1.0 - sc.degradationRatePer1000 / 25);

    const vals = [normRul, normThermal, normCRate, normRetention, normAging];
    return vals.map((v, i) => getAxisPoint(i, v));
  };

  const colors = ['#005B91', '#D97706', '#2E7D32', '#7C3AED'];

  return (
    <div className={`bg-white select-none ${className}`}>
      <div className="text-[11px] font-semibold text-[#20252A] pb-1 border-b border-[#E3E6E8] mb-1">
        Multi-Attribute Radar Analysis
      </div>

      <div className="flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] h-auto">
          {/* Concentric Grid Polygons */}
          {Array.from({ length: levels }).map((_, l) => {
            const levelRadius = (radius / levels) * (l + 1);
            const polygonPoints = axes.map((_, i) => {
              const angle = (Math.PI * 2 / axes.length) * i - Math.PI / 2;
              return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
            }).join(' ');

            return (
              <polygon
                key={l}
                points={polygonPoints}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

          {/* Radial Spokes */}
          {axes.map((axis, i) => {
            const angle = (Math.PI * 2 / axes.length) * i - Math.PI / 2;
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);
            const labelX = center + (radius + 18) * Math.cos(angle);
            const labelY = center + (radius + 14) * Math.sin(angle);

            return (
              <g key={axis.key}>
                <line
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY + 3}
                  textAnchor="middle"
                  className="text-[7.5px] fill-[#5E666D] font-medium"
                >
                  {axis.label}
                </text>
              </g>
            );
          })}

          {/* Scenario polygons */}
          {scenarios.slice(0, 3).map((sc, sIdx) => {
            const pts = getScenarioPoints(sc);
            const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
            const col = colors[sIdx % colors.length];

            return (
              <g key={sc.config.id}>
                <polygon
                  points={pointsStr}
                  fill={col}
                  fillOpacity="0.15"
                  stroke={col}
                  strokeWidth="1.8"
                />
                {pts.map((p, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={p.x}
                    cy={p.y}
                    r="2.5"
                    fill={col}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[9.5px] mt-1 justify-center">
        {scenarios.slice(0, 3).map((sc, sIdx) => (
          <span key={sc.config.id} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-[1px] inline-block"
              style={{ backgroundColor: colors[sIdx % colors.length] }}
            />
            <span className="text-[#333D47] truncate max-w-[120px]">{sc.config.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

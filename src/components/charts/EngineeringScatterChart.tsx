/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Cell Distribution Scatter Plot
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';

export const EngineeringScatterChart: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { batteryPack, selectedCellId, selectObject } = useBatteryStore();

  const allCells = batteryPack.modules.flatMap(m => m.cells);

  const minV = 3.76;
  const maxV = 3.84;
  const minT = 32.0;
  const maxT = 44.0;

  const width = 450;
  const height = 180;
  const padding = { top: 15, right: 25, bottom: 25, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const scaleX = (t: number) => padding.left + ((t - minT) / (maxT - minT)) * chartW;
  const scaleY = (v: number) => padding.top + chartH - ((v - minV) / (maxV - minV)) * chartH;

  return (
    <div className={`bg-white select-none ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#20252A] pb-1 border-b border-[#E3E6E8] mb-1">
        <span>Cell Electro-Thermal Dispersion (96 Cells)</span>
        <span className="text-[10px] text-[#7A8289]">Click node to select cell in 3D</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Horizontal grid lines (Voltage) */}
        {[3.77, 3.79, 3.81, 3.83].map(v => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={scaleY(v)}
              x2={width - padding.right}
              y2={scaleY(v)}
              stroke="#EDF1F4"
              strokeWidth="1"
            />
            <text
              x={padding.left - 4}
              y={scaleY(v) + 3}
              textAnchor="end"
              className="text-[8px] fill-[#7A8289] font-mono-numbers"
            >
              {v.toFixed(2)}V
            </text>
          </g>
        ))}

        {/* Vertical grid lines (Temperature) */}
        {[33, 36, 39, 42].map(t => (
          <g key={t}>
            <line
              x1={scaleX(t)}
              y1={padding.top}
              x2={scaleX(t)}
              y2={height - padding.bottom}
              stroke="#EDF1F4"
              strokeWidth="1"
            />
            <text
              x={scaleX(t)}
              y={height - padding.bottom + 10}
              textAnchor="middle"
              className="text-[8px] fill-[#7A8289] font-mono-numbers"
            >
              {t}°C
            </text>
          </g>
        ))}

        {/* Nominal cluster boundary indicator */}
        <ellipse
          cx={scaleX(35.2)}
          cy={scaleY(3.824)}
          rx={35}
          ry={14}
          fill="#DCECF6"
          fillOpacity="0.45"
          stroke="#0072A8"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />

        {/* Cells Scatter Nodes */}
        {allCells.map(cell => {
          const cx = scaleX(cell.temperature);
          const cy = scaleY(cell.voltage);
          const isSelected = selectedCellId === cell.id;
          const isAnomaly = cell.diagnosticState === 'WARNING';

          return (
            <circle
              key={cell.id}
              cx={cx}
              cy={cy}
              r={isSelected ? 5.5 : (isAnomaly ? 4.5 : 2.5)}
              fill={isSelected ? '#005B91' : (isAnomaly ? '#D97706' : '#5E666D')}
              stroke={isSelected ? '#FFFFFF' : '#FFFFFF'}
              strokeWidth={isSelected ? 1.5 : 0.8}
              className="cursor-pointer hover:opacity-80 transition-all"
              onClick={() => selectObject('CELL', cell.id)}
            >
              <title>{`${cell.id} (${cell.moduleId}): ${cell.voltage}V, ${cell.temperature}°C`}</title>
            </circle>
          );
        })}

        {/* Label for Outlier C-017 */}
        <text
          x={scaleX(41.7) - 6}
          y={scaleY(3.778) - 7}
          className="text-[8.5px] font-bold fill-[#D97706] font-mono-numbers"
        >
          C-017 (Thermal Outlier)
        </text>

        {/* Axis Labels */}
        <text
          x={padding.left + chartW / 2}
          y={height - 2}
          textAnchor="middle"
          className="text-[8.5px] fill-[#5E666D]"
        >
          Cell Temperature (°C)
        </text>
        <text
          transform="rotate(-90)"
          x={-(padding.top + chartH / 2)}
          y={10}
          textAnchor="middle"
          className="text-[8.5px] fill-[#5E666D]"
        >
          Voltage (V)
        </text>
      </svg>
    </div>
  );
};

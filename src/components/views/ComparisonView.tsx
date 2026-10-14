/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Multi-Scenario Comparison Workspace (Screen 12)
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { EngineeringLineChart } from '../charts/EngineeringLineChart';
import { EngineeringRadarChart } from '../charts/EngineeringRadarChart';
import { calculateSohTrajectory } from '../../services/physicsEngine';
import { GitCompare, Layers, TrendingDown, Clock, ShieldCheck } from 'lucide-react';

export const ComparisonView: React.FC = () => {
  const { comparisonResults } = useBatteryStore();

  const colors = ['#005B91', '#D97706', '#2E7D32', '#7C3AED'];

  // Build multi-scenario overlay lines
  const multiSeries = comparisonResults.map((sc, idx) => {
    const traj = calculateSohTrajectory(sc.config.ambientTemp, sc.config.fastChargingPct);
    return {
      name: sc.config.name,
      color: colors[idx % colors.length],
      dashArray: idx === 0 ? undefined : (idx === 1 ? '4,2' : '2,2'),
      points: traj.map(d => ({ x: d.cycle, y: d.predictedSoh })),
    };
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Banner */}
      <div className="h-[32px] bg-white border border-[#D5D9DD] rounded-[2px] px-3 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <GitCompare className="w-3.5 h-3.5 text-[#005B91]" />
          <span className="font-semibold text-[#20252A]">Multi-Scenario Parametric Trade-off Matrix</span>
          <span className="text-[#7A8289]">· 4 Duty Profiles Evaluated</span>
        </div>

        <div className="text-[10px] text-[#5E666D] font-mono-numbers">
          Calibration: 96S NMC 811 Traction Array
        </div>
      </div>

      {/* Structured Comparison Table */}
      <div className="bg-white border border-[#D5D9DD] rounded-[2px] overflow-hidden shrink-0">
        <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between font-semibold text-[#20252A] text-[11px]">
          <span>Scenario Trade-Off Comparison Matrix</span>
          <span className="text-[10px] text-[#7A8289]">Engineering Metrics Summary</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px] font-mono-numbers">
            <thead className="bg-[#F4F6F8] border-b border-[#D5D9DD] text-[10px] text-[#5E666D] font-sans font-semibold">
              <tr>
                <th className="py-1.5 px-2.5">Scenario Configuration</th>
                <th className="py-1.5 px-2">Climate / Temp</th>
                <th className="py-1.5 px-2">Fast Charge %</th>
                <th className="py-1.5 px-2">Daily Usage</th>
                <th className="py-1.5 px-2">SOH @ 1000c</th>
                <th className="py-1.5 px-2">SOH @ 2000c</th>
                <th className="py-1.5 px-2">Predicted RUL</th>
                <th className="py-1.5 px-2">EOL Cycle</th>
                <th className="py-1.5 px-2">Peak Temp</th>
                <th className="py-1.5 px-2">Expected Life</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6E8]">
              {comparisonResults.map((sc, idx) => {
                const isBaseline = idx === 0;

                return (
                  <tr
                    key={sc.config.id}
                    className={`hover:bg-[#F9FAFB] transition-colors ${
                      isBaseline ? 'bg-[#F0F6FA]/50 font-medium' : ''
                    }`}
                  >
                    <td className="py-2 px-2.5 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-[1px] shrink-0"
                          style={{ backgroundColor: colors[idx % colors.length] }}
                        />
                        <span className="font-semibold text-[#20252A]">{sc.config.name}</span>
                        {isBaseline && (
                          <span className="text-[9px] px-1 py-0.2 bg-[#DCECF6] text-[#005B91] rounded-[2px] font-bold">
                            BASE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[#5E666D]">{sc.config.ambientTemp}°C</td>
                    <td className="py-2 px-2 text-[#20252A]">{sc.config.fastChargingPct}%</td>
                    <td className="py-2 px-2 text-[#5E666D]">{sc.config.dailyKm} km/day</td>
                    <td className="py-2 px-2 font-semibold text-[#005B91]">{sc.sohAtCycle1000}%</td>
                    <td className="py-2 px-2 font-semibold text-[#20252A]">{sc.sohAtCycle2000}%</td>
                    <td className="py-2 px-2 font-bold text-[#0072A8]">{sc.predictedRulCycles} cyc</td>
                    <td className="py-2 px-2 text-[#20252A]">{sc.eolCycle} cyc</td>
                    <td className={`py-2 px-2 font-semibold ${sc.peakOperatingTemp > 40 ? 'text-[#C62828]' : 'text-[#20252A]'}`}>
                      {sc.peakOperatingTemp}°C
                    </td>
                    <td className="py-2 px-2 font-bold text-[#2E7D32]">{sc.batteryLifeYears} yrs</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Analysis Split: Multi-Scenario Line Chart (Left 65%) + Spider Radar (Right 35%) */}
      <div className="flex-1 flex gap-2 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <EngineeringPanel 
            title="Multi-Scenario SOH Degradation Trajectory Comparison" 
            subtitle="Extrapolated to 80% EOL Threshold"
            className="h-full"
          >
            <EngineeringLineChart
              xAxisLabel="Cumulative Operating Cycles"
              yAxisLabel="State of Health (SOH %)"
              series={multiSeries}
              thresholdLine={{ y: 80.0, label: 'EOL Threshold (80%)', color: '#C62828' }}
              height={220}
              yDomain={[65, 102]}
            />
          </EngineeringPanel>
        </div>

        <div className="w-80 xl:w-96 flex flex-col min-h-0">
          <EngineeringPanel title="Multi-Attribute Trade-Off Radar" subtitle="Normalized 5-Axis Polygon" className="h-full">
            <EngineeringRadarChart scenarios={comparisonResults} />
          </EngineeringPanel>
        </div>
      </div>
    </div>
  );
};

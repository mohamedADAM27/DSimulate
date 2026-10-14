/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Degradation Prognostics Workspace (Screen 08)
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { EngineeringLineChart } from '../charts/EngineeringLineChart';
import { calculateSohTrajectory } from '../../services/physicsEngine';
import { TrendingDown, Activity, Layers, ArrowUpRight } from 'lucide-react';

export const DegradationView: React.FC = () => {
  const { batteryPack, timelineCycle } = useBatteryStore();

  const trajectoryData = calculateSohTrajectory(22, 20);

  const sohSeries = [
    {
      name: 'Measured Historical SOH (0–700 cyc)',
      color: '#005B91',
      points: trajectoryData.filter(d => d.measuredSoh !== undefined).map(d => ({ x: d.cycle, y: d.measuredSoh! })),
    },
    {
      name: 'Physics-Informed Prognostic Fit (700–2200 cyc)',
      color: '#D97706',
      dashArray: '3,2',
      points: trajectoryData.filter(d => d.cycle >= 700).map(d => ({ x: d.cycle, y: d.predictedSoh })),
    },
    {
      name: '95% Bayesian Confidence Upper Bound',
      color: '#94A3B8',
      dashArray: '1,2',
      points: trajectoryData.filter(d => d.cycle >= 700).map(d => ({ x: d.cycle, y: d.upperBound })),
    },
    {
      name: '95% Bayesian Confidence Lower Bound',
      color: '#94A3B8',
      dashArray: '1,2',
      points: trajectoryData.filter(d => d.cycle >= 700).map(d => ({ x: d.cycle, y: d.lowerBound })),
    },
  ];

  // Resistance growth curve (R0 in mΩ vs cycle)
  const resistanceSeries = [
    {
      name: 'Pack Equivalent Resistance R0 (mΩ)',
      color: '#C62828',
      points: trajectoryData.map(d => ({
        x: d.cycle,
        y: Number((0.205 * (1 + 0.018 * Math.sqrt(d.cycle))).toFixed(3)),
      })),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Status Cards */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Current SOH</div>
            <div className="text-[18px] font-bold text-[#005B91] font-mono-numbers">{batteryPack.avgSoh}%</div>
            <div className="text-[9.5px] text-[#5E666D]">Cycle {timelineCycle} / 2000</div>
          </div>
          <TrendingDown className="w-5 h-5 text-[#005B91]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Cumulative Capacity Fade</div>
            <div className="text-[18px] font-bold text-[#D97706] font-mono-numbers">
              {Number((100 - batteryPack.avgSoh).toFixed(1))}%
            </div>
            <div className="text-[9.5px] text-[#5E666D]">Retained: {batteryPack.measuredCapacityKWh} kWh</div>
          </div>
          <Activity className="w-5 h-5 text-[#D97706]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Ohmic Resistance Growth</div>
            <div className="text-[18px] font-bold text-[#C62828] font-mono-numbers">+24.6%</div>
            <div className="text-[9.5px] text-[#5E666D]">Baseline: 0.205 Ω → Current: 0.255 Ω</div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-[#C62828]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Remaining Life to 80% EOL</div>
            <div className="text-[18px] font-bold text-[#2E7D32] font-mono-numbers">{batteryPack.predictedRul} cyc</div>
            <div className="text-[9.5px] text-[#5E666D]">Approx. 6.8 Years Service Life</div>
          </div>
          <Layers className="w-5 h-5 text-[#2E7D32]" />
        </div>
      </div>

      {/* Main Split: SOH Degradation Trajectory (Top/Left) + Mechanism Breakdown (Right) */}
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        <div className="col-span-2 flex flex-col gap-2 overflow-auto">
          <EngineeringPanel 
            title="State of Health Degradation Trajectory & 95% Confidence Bounds" 
            subtitle="Distinguishing Measured vs Estimated vs Predicted"
          >
            <EngineeringLineChart
              xAxisLabel="Cumulative Cycles"
              yAxisLabel="State of Health (SOH %)"
              series={sohSeries}
              thresholdLine={{ y: 80.0, label: 'End-of-Life (EOL) Threshold', color: '#C62828' }}
              height={205}
              yDomain={[70, 102]}
            />
          </EngineeringPanel>

          <EngineeringPanel title="Ohmic Internal Resistance (R0) Escalation Curve" subtitle="SEI Passivation Growth">
            <EngineeringLineChart
              xAxisLabel="Cumulative Cycles"
              yAxisLabel="Pack Resistance (mΩ)"
              series={resistanceSeries}
              height={140}
            />
          </EngineeringPanel>
        </div>

        {/* Right Mechanisms Breakdown */}
        <div className="flex flex-col gap-2 overflow-auto">
          <EngineeringPanel title="Degradation Mode Attribution" subtitle="Electrochemical Physics Breakdown">
            <div className="space-y-3 p-1 font-mono-numbers text-[11px]">
              <div>
                <div className="flex justify-between mb-1 font-sans">
                  <span className="font-semibold text-[#20252A]">Solid Electrolyte Interphase (SEI)</span>
                  <span className="font-bold text-[#005B91]">62.4%</span>
                </div>
                <div className="h-2 bg-[#E2E8F0] rounded-[1px] overflow-hidden">
                  <div className="h-full bg-[#005B91] w-[62.4%]"></div>
                </div>
                <div className="text-[10px] text-[#7A8289] font-sans mt-0.5">
                  Parabolic diffusion-limited film growth on graphite anode.
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-sans">
                  <span className="font-semibold text-[#20252A]">Loss of Active Lithium (LLI)</span>
                  <span className="font-bold text-[#0072A8]">23.8%</span>
                </div>
                <div className="h-2 bg-[#E2E8F0] rounded-[1px] overflow-hidden">
                  <div className="h-full bg-[#0072A8] w-[23.8%]"></div>
                </div>
                <div className="text-[10px] text-[#7A8289] font-sans mt-0.5">
                  Trapped cyclable Li+ inventory in dead lithium and surface deposits.
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-sans">
                  <span className="font-semibold text-[#20252A]">Cathode Mechanical Micro-Cracking</span>
                  <span className="font-bold text-[#D97706]">13.8%</span>
                </div>
                <div className="h-2 bg-[#E2E8F0] rounded-[1px] overflow-hidden">
                  <div className="h-full bg-[#D97706] w-[13.8%]"></div>
                </div>
                <div className="text-[10px] text-[#7A8289] font-sans mt-0.5">
                  Lattice anisotropic volume expansion during high-C discharge.
                </div>
              </div>
            </div>
          </EngineeringPanel>

          <EngineeringPanel title="Stress Acceleration Factors" subtitle="Parametric Sensitivities">
            <div className="space-y-1.5 text-[10.5px] p-1 font-mono-numbers">
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Arrhenius Temp Coeff (Ea/RT):</span>
                <span className="font-semibold text-[#20252A]">1.14× nominal</span>
              </div>
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">DC Fast-Charge Stress Index:</span>
                <span className="font-semibold text-[#D97706]">1.28× nominal</span>
              </div>
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Depth-of-Discharge (DoD) Factor:</span>
                <span className="font-semibold text-[#20252A]">1.06× nominal</span>
              </div>
              <div className="p-1.5 bg-[#F0F6FA] border border-[#DCECF6] rounded-[2px] text-[10px] text-[#005B91] font-sans mt-2">
                <strong>Model Note:</strong> Predictions represent empirical physics-informed aging equations calibrated to prototype NMC 811 cells.
              </div>
            </div>
          </EngineeringPanel>
        </div>
      </div>
    </div>
  );
};

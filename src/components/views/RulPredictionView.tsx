/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Remaining Useful Life (RUL) Prediction Workspace (Screen 09)
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { EngineeringLineChart } from '../charts/EngineeringLineChart';
import { calculateSohTrajectory } from '../../services/physicsEngine';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, Calendar, Layers } from 'lucide-react';

export const RulPredictionView: React.FC = () => {
  const { batteryPack, timelineCycle, selectObject, selectDiagnostic } = useBatteryStore();

  const trajectory = calculateSohTrajectory(22, 20);

  const rulSeries = [
    {
      name: 'Historical SOH (Observed 0–700 cyc)',
      color: '#005B91',
      points: trajectory.filter(d => d.cycle <= 700).map(d => ({ x: d.cycle, y: d.measuredSoh || d.predictedSoh })),
    },
    {
      name: 'Projected SOH to EOL (Extrapolation)',
      color: '#0072A8',
      dashArray: '3,2',
      points: trajectory.filter(d => d.cycle >= 700).map(d => ({ x: d.cycle, y: d.predictedSoh })),
    },
    {
      name: 'Upper Bound (95% Confidence)',
      color: '#94A3B8',
      dashArray: '1,2',
      points: trajectory.filter(d => d.cycle >= 700).map(d => ({ x: d.cycle, y: d.upperBound })),
    },
    {
      name: 'Lower Bound (95% Confidence)',
      color: '#94A3B8',
      dashArray: '1,2',
      points: trajectory.filter(d => d.cycle >= 700).map(d => ({ x: d.cycle, y: d.lowerBound })),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Engineering Metrics */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Predicted Pack RUL</div>
            <div className="text-[20px] font-bold text-[#005B91] font-mono-numbers">{batteryPack.predictedRul} cyc</div>
            <div className="text-[9.5px] text-[#5E666D]">Until Pack Reaches 80.0% SOH</div>
          </div>
          <Clock className="w-5 h-5 text-[#005B91]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Estimated EOL Point</div>
            <div className="text-[20px] font-bold text-[#20252A] font-mono-numbers">2,000 cyc</div>
            <div className="text-[9.5px] text-[#5E666D]">Current: Cycle {timelineCycle} (35.8% consumed)</div>
          </div>
          <Calendar className="w-5 h-5 text-[#0072A8]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">95% Prediction Interval</div>
            <div className="text-[17px] font-bold text-[#2E7D32] font-mono-numbers">1,180 – 1,390 cyc</div>
            <div className="text-[9.5px] text-[#5E666D]">Bayesian Particle Filter Envelope</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Limiting Bottleneck Cell</div>
            <div className="text-[18px] font-bold text-[#C62828] font-mono-numbers">Cell C-017 (940 cyc)</div>
            <div className="text-[9.5px] text-[#C62828]">-344 cycles below pack mean</div>
          </div>
          <AlertTriangle className="w-5 h-5 text-[#C62828]" />
        </div>
      </div>

      {/* Main Split: Trajectory Line Chart + Cell RUL Distribution Table */}
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        <div className="col-span-2 flex flex-col gap-2 overflow-auto">
          <EngineeringPanel 
            title="Remaining Useful Life (RUL) Trajectory & EOL Threshold Boundary" 
            subtitle="Physics-Informed Prognostics Model"
          >
            <EngineeringLineChart
              xAxisLabel="Cumulative Operating Cycles"
              yAxisLabel="State of Health (SOH %)"
              series={rulSeries}
              thresholdLine={{ y: 80.0, label: 'End-of-Life (EOL) Threshold', color: '#C62828' }}
              height={235}
              yDomain={[70, 102]}
            />
          </EngineeringPanel>

          {/* Prognostics Model Architecture Specification */}
          <div className="bg-white border border-[#D5D9DD] p-2 rounded-[2px] text-[11px] font-mono-numbers">
            <div className="text-[10.5px] font-semibold text-[#20252A] font-sans border-b border-[#E3E6E8] pb-1 mb-1.5">
              Prognostic Model Calibration Metadata
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10.5px]">
              <div>
                <span className="text-[#7A8289] font-sans">Model Form:</span>
                <div className="font-semibold text-[#20252A]">Square-Root Cycle + Arrhenius</div>
              </div>
              <div>
                <span className="text-[#7A8289] font-sans">Confidence Estimation:</span>
                <div className="font-semibold text-[#005B91]">Bayesian Sequential Monte Carlo</div>
              </div>
              <div>
                <span className="text-[#7A8289] font-sans">Model Status:</span>
                <div className="font-semibold text-[#2E7D32]">Deterministic Prototype Fit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Module / Cell RUL Ranking */}
        <div className="flex flex-col gap-2 overflow-auto">
          <EngineeringPanel title="Module RUL Prognostic Summary" subtitle="Cell-Level Dispersion">
            <div className="space-y-1 p-1">
              {batteryPack.modules.map(mod => {
                const isMod3 = mod.id === 'MOD-03';
                const modRul = isMod3 ? 1120 : (1284 - (mod.moduleIndex % 3) * 20);

                return (
                  <div
                    key={mod.id}
                    onClick={() => selectObject('MODULE', mod.id)}
                    className={`flex items-center justify-between p-1.5 border rounded-[2px] cursor-pointer text-[10.5px] transition-colors ${
                      isMod3 ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-white border-[#E3E6E8] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[#20252A]">{mod.name}</span>
                      <div className="text-[9.5px] text-[#7A8289] font-sans">
                        SOH: {mod.avgSoh}% · T: {mod.avgTemperature}°C
                      </div>
                    </div>
                    <div className="text-right font-mono-numbers">
                      <div className={`font-bold ${isMod3 ? 'text-[#D97706]' : 'text-[#005B91]'}`}>
                        {modRul} cyc
                      </div>
                      <div className="text-[9px] text-[#7A8289]">
                        {isMod3 ? 'Thermal bottleneck' : 'Nominal'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </EngineeringPanel>

          {/* Outlier Cell Callout */}
          <div 
            onClick={() => {
              selectObject('CELL', 'C-017');
              selectDiagnostic('D-003');
            }}
            className="border border-[#FCA5A5] bg-[#FEF2F2] p-2 rounded-[2px] cursor-pointer hover:bg-[#FEE2E2] transition-colors"
          >
            <div className="text-[11px] font-bold text-[#991B1B] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Cell C-017 Early EOL Trigger</span>
            </div>
            <div className="text-[10px] text-[#7F1D1D] mt-1 font-sans">
              Due to localized temperature elevation (41.7°C) and resistance growth (3.42 mΩ), Cell C-017 is predicted to reach 80% EOL at <strong>cycle 1,656 (940 cycles remaining)</strong>, which is 344 cycles earlier than the pack average. Click to focus in 3D digital twin.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

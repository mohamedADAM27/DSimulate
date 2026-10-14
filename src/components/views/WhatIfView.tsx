/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - What-If Scenario Lab Workspace (Screen 11)
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { EngineeringLineChart } from '../charts/EngineeringLineChart';
import { calculateSohTrajectory } from '../../services/physicsEngine';
import { 
  Sliders, 
  RotateCcw, 
  ArrowRight, 
  TrendingDown, 
  Flame, 
  Clock, 
  CheckCircle2, 
  GitCompare,
  BatteryCharging
} from 'lucide-react';

export const WhatIfView: React.FC = () => {
  const { 
    whatIfConfig, 
    whatIfResult, 
    updateWhatIfConfig, 
    applyPresetScenario, 
    comparisonResults,
    setWorkspace 
  } = useBatteryStore();

  const baselineResult = comparisonResults[0];

  // Degradation trajectory comparison
  const baselineTraj = calculateSohTrajectory(baselineResult.config.ambientTemp, baselineResult.config.fastChargingPct);
  const scenarioTraj = calculateSohTrajectory(whatIfConfig.ambientTemp, whatIfConfig.fastChargingPct);

  const compSeries = [
    {
      name: 'Baseline Specification (22°C · 15% Fast Charge)',
      color: '#005B91',
      points: baselineTraj.map(d => ({ x: d.cycle, y: d.predictedSoh })),
    },
    {
      name: `What-If: ${whatIfConfig.name}`,
      color: '#D97706',
      dashArray: '3,2',
      points: scenarioTraj.map(d => ({ x: d.cycle, y: d.predictedSoh })),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Presets Toolbar */}
      <div className="h-[32px] bg-white border border-[#D5D9DD] rounded-[2px] px-3 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#005B91]" />
          <span className="font-semibold text-[#20252A]">Parametric What-If Simulator</span>
          <span className="text-[#7A8289]">· Real-time Sensitivity & Prognostics</span>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-[#7A8289] font-sans">Duty Cycle Presets:</span>
          {[
            { id: 'BASELINE', label: 'Private EV' },
            { id: 'SCENARIO_A', label: 'Highway Fleet' },
            { id: 'SCENARIO_B', label: 'Winter Sub-Zero' },
            { id: 'SCENARIO_C', label: 'Desert Delivery' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPresetScenario(p.id)}
              className={`px-2 py-0.5 border rounded-[2px] font-medium transition-colors ${
                whatIfConfig.id === p.id 
                  ? 'bg-[#005B91] text-white border-[#005B91]' 
                  : 'bg-white border-[#D5D9DD] text-[#5E666D] hover:bg-[#F0F2F5]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Parameter Controls (Left 35%) + Comparative Prognostics (Right 65%) */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left: Engineering Parameters Form */}
        <div className="w-80 xl:w-96 bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col shrink-0 text-[11px] overflow-hidden">
          <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between font-semibold text-[#20252A]">
            <span>Operational Condition Parameters</span>
            <span className="text-[10px] text-[#7A8289]">Sensitivities</span>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-3 font-mono-numbers">
            {/* Driving Profile */}
            <div>
              <label className="text-[10px] text-[#7A8289] font-sans font-medium uppercase block mb-1">
                Driving Severity Profile
              </label>
              <select
                value={whatIfConfig.drivingProfile}
                onChange={(e) => updateWhatIfConfig({ drivingProfile: e.target.value as any })}
                className="w-full bg-white border border-[#D5D9DD] rounded-[2px] p-1 text-[11px] font-sans"
              >
                <option value="City Commute">City Commute (Mild · High Regen)</option>
                <option value="Highway High-Speed">Highway High-Speed (Sustained C-rate)</option>
                <option value="Delivery Fleet">Delivery Fleet (Stop-Start Heavy Load)</option>
                <option value="Performance Track">Performance Track (Aggressive Thermal)</option>
              </select>
            </div>

            {/* Ambient Temperature */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-sans">
                <span className="text-[#5E666D]">Operating Climate (Ambient Temp)</span>
                <span className="font-semibold text-[#20252A]">{whatIfConfig.ambientTemp}°C</span>
              </div>
              <input
                type="range"
                min="-15"
                max="45"
                step="1"
                value={whatIfConfig.ambientTemp}
                onChange={(e) => updateWhatIfConfig({ ambientTemp: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#005B91] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#7A8289] mt-0.5">
                <span>-15°C (Extreme Cold)</span>
                <span>20°C (Mild)</span>
                <span>45°C (Desert Heat)</span>
              </div>
            </div>

            {/* Fast Charging Proportion */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-sans">
                <span className="text-[#5E666D]">DC Fast-Charge Frequency (% of sessions)</span>
                <span className="font-semibold text-[#D97706]">{whatIfConfig.fastChargingPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={whatIfConfig.fastChargingPct}
                onChange={(e) => updateWhatIfConfig({ fastChargingPct: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#D97706] cursor-pointer"
              />
              <div className="text-[9.5px] text-[#7A8289] font-sans mt-0.5">
                Accelerates SEI layer growth and localized lithium plating.
              </div>
            </div>

            {/* Daily Distance */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-sans">
                <span className="text-[#5E666D]">Daily Travel Distance</span>
                <span className="font-semibold text-[#20252A]">{whatIfConfig.dailyKm} km/day</span>
              </div>
              <input
                type="range"
                min="20"
                max="350"
                step="10"
                value={whatIfConfig.dailyKm}
                onChange={(e) => updateWhatIfConfig({ dailyKm: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#005B91] cursor-pointer"
              />
            </div>

            {/* Charging Rate (C) */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-sans">
                <span className="text-[#5E666D]">Average Charging C-Rate</span>
                <span className="font-semibold text-[#0072A8]">{whatIfConfig.chargingRateC} C</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.25"
                value={whatIfConfig.chargingRateC}
                onChange={(e) => updateWhatIfConfig({ chargingRateC: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#0072A8] cursor-pointer"
              />
            </div>

            {/* Cooling Condition */}
            <div>
              <label className="text-[10px] text-[#7A8289] font-sans font-medium uppercase block mb-1">
                Thermal Management Condition
              </label>
              <select
                value={whatIfConfig.coolingCondition}
                onChange={(e) => updateWhatIfConfig({ coolingCondition: e.target.value as any })}
                className="w-full bg-white border border-[#D5D9DD] rounded-[2px] p-1 text-[11px] font-sans"
              >
                <option value="Standard Active Liquid">Standard Active Liquid (10 L/min)</option>
                <option value="Reduced Flow">Reduced Flow / Degraded Pump (4 L/min)</option>
                <option value="Maximum Chiller">Maximum Chiller Boost (18 L/min)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Comparative Output & Prognostics Trajectory */}
        <div className="flex-1 flex flex-col gap-2 overflow-auto">
          {/* Baseline vs Scenario Metric Delta Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2">
              <div className="text-[10px] text-[#7A8289] font-medium uppercase font-sans">Remaining Useful Life</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[18px] font-bold text-[#005B91] font-mono-numbers">{whatIfResult.predictedRulCycles}</span>
                <span className="text-[10px] text-[#5E666D]">cyc</span>
              </div>
              <div className="text-[10px] text-[#D97706] font-mono-numbers mt-0.5">
                Delta: {whatIfResult.predictedRulCycles - baselineResult.predictedRulCycles > 0 ? '+' : ''}
                {whatIfResult.predictedRulCycles - baselineResult.predictedRulCycles} cyc
              </div>
            </div>

            <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2">
              <div className="text-[10px] text-[#7A8289] font-medium uppercase font-sans">End-of-Life Point (80%)</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[18px] font-bold text-[#20252A] font-mono-numbers">{whatIfResult.eolCycle}</span>
                <span className="text-[10px] text-[#5E666D]">cyc</span>
              </div>
              <div className="text-[10px] text-[#5E666D] font-mono-numbers mt-0.5">
                Base: {baselineResult.eolCycle} cyc
              </div>
            </div>

            <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2">
              <div className="text-[10px] text-[#7A8289] font-medium uppercase font-sans">Projected Calendar Life</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[18px] font-bold text-[#2E7D32] font-mono-numbers">{whatIfResult.batteryLifeYears}</span>
                <span className="text-[10px] text-[#5E666D]">years</span>
              </div>
              <div className="text-[10px] text-[#5E666D] font-mono-numbers mt-0.5">
                At {whatIfConfig.dailyKm} km/day usage
              </div>
            </div>

            <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2">
              <div className="text-[10px] text-[#7A8289] font-medium uppercase font-sans">Peak Operating Temp</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-[18px] font-bold font-mono-numbers ${whatIfResult.peakOperatingTemp > 40 ? 'text-[#C62828]' : 'text-[#20252A]'}`}>
                  {whatIfResult.peakOperatingTemp}
                </span>
                <span className="text-[10px] text-[#5E666D]">°C</span>
              </div>
              <div className="text-[10px] text-[#7A8289] font-mono-numbers mt-0.5">
                Base: {baselineResult.peakOperatingTemp}°C
              </div>
            </div>
          </div>

          {/* SOH Trajectory Comparison Line Chart */}
          <EngineeringPanel 
            title="Baseline vs What-If Scenario Degradation Trajectory Comparison" 
            subtitle="Extrapolated Aging Model"
          >
            <EngineeringLineChart
              xAxisLabel="Cumulative Operating Cycles"
              yAxisLabel="State of Health (SOH %)"
              series={compSeries}
              thresholdLine={{ y: 80.0, label: 'EOL Threshold (80%)', color: '#C62828' }}
              height={220}
              yDomain={[65, 102]}
            />
          </EngineeringPanel>

          {/* Comparison Jump Button */}
          <div className="bg-white border border-[#D5D9DD] p-2.5 rounded-[2px] flex items-center justify-between">
            <div className="text-[11px] text-[#5E666D] font-sans">
              Compare this scenario alongside 3 pre-calibrated operating profiles in the multi-parameter matrix.
            </div>
            <button
              onClick={() => setWorkspace('comparison')}
              className="px-3 py-1 bg-[#005B91] hover:bg-[#004B78] text-white font-medium text-[11px] rounded-[2px] flex items-center gap-1.5 transition-colors font-sans"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Open Scenario Comparison Matrix →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

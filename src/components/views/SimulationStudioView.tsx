/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Simulation Studio Workspace (Screen 06)
 */

import React, { useState } from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { EngineeringLineChart } from '../charts/EngineeringLineChart';
import { SimulationParams } from '../../types/battery';
import { 
  Play, 
  RotateCcw, 
  Settings2, 
  CheckCircle2, 
  Cpu, 
  Sliders, 
  Zap, 
  Flame,
  ArrowRight
} from 'lucide-react';

export const SimulationStudioView: React.FC = () => {
  const { 
    simulationParams, 
    updateSimulationParams, 
    simulationHistory,
    setWorkspace,
    setVisualizationMode 
  } = useBatteryStore();

  const [localParams, setLocalParams] = useState<SimulationParams>(simulationParams);
  const [isRunning, setIsRunning] = useState(false);
  const [solverSuccess, setSolverSuccess] = useState(true);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      updateSimulationParams(localParams);
      setIsRunning(false);
      setSolverSuccess(true);
    }, 300);
  };

  const handleReset = () => {
    const defaults: SimulationParams = {
      initialSoc: 80.0,
      ambientTemp: 22.0,
      driveCycle: 'WLTP',
      fastChargeRatio: 20,
      coolingFlowRate: 10.0,
      dischargeDepth: 80,
      regenBraking: true,
      simulationDuration: 1800,
      currentCycle: 716,
    };
    setLocalParams(defaults);
    updateSimulationParams(defaults);
  };

  // Build series for current, voltage, and thermal charts
  const currentSeries = [
    {
      name: 'Dynamic Load Current (A)',
      color: '#005B91',
      points: simulationHistory.map(p => ({ x: p.time, y: p.current })),
    },
  ];

  const thermalSeries = [
    {
      name: 'Max Cell Surface Temp (°C)',
      color: '#C62828',
      points: simulationHistory.map(p => ({ x: p.time, y: p.maxCellTemp })),
    },
    {
      name: 'Mean Pack Core Temp (°C)',
      color: '#D97706',
      dashArray: '3,2',
      points: simulationHistory.map(p => ({ x: p.time, y: p.packTemp })),
    },
  ];

  const voltageSeries = [
    {
      name: 'Simulated Pack Terminal Voltage (V)',
      color: '#0072A8',
      points: simulationHistory.map(p => ({ x: p.time, y: p.packVoltage })),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Banner Toolbar */}
      <div className="h-[32px] bg-white border border-[#D5D9DD] rounded-[2px] px-3 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-[#005B91]" />
          <span className="font-semibold text-[#20252A]">Physics-Informed Transient Solver</span>
          <span className="text-[#7A8289]">· 2-RC Thevenin ECM & 1D Lumped Heat Diffusion</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-3 py-1 bg-[#005B91] hover:bg-[#004B78] text-white font-medium rounded-[2px] flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isRunning ? 'Solving ODE System...' : 'Run Simulation'}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-2 py-1 border border-[#D5D9DD] text-[#5E666D] hover:bg-[#F0F2F5] rounded-[2px]"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Split: Parameter Panel (Left) + Multi-Chart Simulation Response (Right) */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left Parameter Panel (w-80) */}
        <div className="w-72 xl:w-80 bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col shrink-0 text-[11px] overflow-hidden">
          <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between font-semibold text-[#20252A]">
            <span>Solver Input Parameters</span>
            <span className="text-[10px] text-[#7A8289]">ODE Inputs</span>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-3 font-mono-numbers">
            {/* Drive Cycle Profile */}
            <div>
              <label className="text-[10px] text-[#7A8289] font-sans font-medium uppercase block mb-1">
                Standard Drive Cycle Profile
              </label>
              <select
                value={localParams.driveCycle}
                onChange={(e) => setLocalParams({ ...localParams, driveCycle: e.target.value as any })}
                className="w-full bg-white border border-[#D5D9DD] rounded-[2px] p-1 text-[11px] font-sans"
              >
                <option value="WLTP">WLTP Class 3 (Urban + Highway Mixed)</option>
                <option value="US06">US06 Aggressive High-Acceleration Highway</option>
                <option value="CITY">City Commute (High Regenerative Braking)</option>
                <option value="FAST_CHARGE_PULSE">Extreme DC Fast Charge Pulse (350 kW)</option>
              </select>
            </div>

            {/* Initial SOC */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-sans">
                <span className="text-[#5E666D]">Initial Pack SOC</span>
                <span className="font-semibold text-[#005B91]">{localParams.initialSoc}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={localParams.initialSoc}
                onChange={(e) => setLocalParams({ ...localParams, initialSoc: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#005B91] cursor-pointer"
              />
            </div>

            {/* Ambient Temperature */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-sans">
                <span className="text-[#5E666D]">Ambient Temperature</span>
                <span className="font-semibold text-[#20252A]">{localParams.ambientTemp}°C</span>
              </div>
              <input
                type="range"
                min="-10"
                max="45"
                step="1"
                value={localParams.ambientTemp}
                onChange={(e) => setLocalParams({ ...localParams, ambientTemp: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#005B91] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#7A8289] mt-0.5">
                <span>-10°C (Cold)</span>
                <span>22°C (Std)</span>
                <span>45°C (Desert)</span>
              </div>
            </div>

            {/* Cooling Flow Rate */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-sans">
                <span className="text-[#5E666D]">Cooling Liquid Flow Rate</span>
                <span className="font-semibold text-[#0072A8]">{localParams.coolingFlowRate} L/min</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={localParams.coolingFlowRate}
                onChange={(e) => setLocalParams({ ...localParams, coolingFlowRate: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#0072A8] cursor-pointer"
              />
            </div>

            {/* Fast Charging Proportion */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-sans">
                <span className="text-[#5E666D]">Fast Charging Ratio</span>
                <span className="font-semibold text-[#D97706]">{localParams.fastChargeRatio}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={localParams.fastChargeRatio}
                onChange={(e) => setLocalParams({ ...localParams, fastChargeRatio: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#D97706] cursor-pointer"
              />
            </div>

            {/* Physics Solver Metadata */}
            <div className="p-2 border border-[#E3E6E8] bg-[#F9FAFB] rounded-[2px] text-[10px] space-y-1 font-sans">
              <div className="font-semibold text-[#20252A] uppercase">Active ODE Equations</div>
              <div className="text-[#5E666D]">· dSOC/dt = -I(t) / Q_nominal</div>
              <div className="text-[#5E666D]">· dV_rc/dt = (I·R1 - V_rc) / (R1·C1)</div>
              <div className="text-[#5E666D]">· m·Cp·dT/dt = I²·R0 - h·A·(T - T_amb)</div>
              <div className="text-[#2E7D32] font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Solver: 4th-Order Runge-Kutta (RK4)</span>
              </div>
            </div>

            {/* Quick jump to digital twin */}
            <button
              onClick={() => {
                setVisualizationMode('THERMAL');
                setWorkspace('digital-twin');
              }}
              className="w-full py-1.5 bg-[#F0F6FA] text-[#005B91] border border-[#005B91] hover:bg-[#E0EEF7] font-semibold text-[10.5px] rounded-[2px] flex items-center justify-center gap-1 transition-colors"
            >
              <span>View in 3D Digital Twin</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Multi-Chart Studio Views */}
        <div className="flex-1 flex flex-col gap-2 overflow-auto">
          <EngineeringPanel title="Current Load Profile (Input Vector)" subtitle="Drive Cycle Demanded Load">
            <EngineeringLineChart
              xAxisLabel="Time (seconds)"
              yAxisLabel="Current (A)"
              series={currentSeries}
              height={155}
            />
          </EngineeringPanel>

          <EngineeringPanel title="Pack Voltage Dynamic Response (V_terminal)" subtitle="ECM State Output">
            <EngineeringLineChart
              xAxisLabel="Time (seconds)"
              yAxisLabel="Pack Voltage (V)"
              series={voltageSeries}
              height={155}
            />
          </EngineeringPanel>

          <EngineeringPanel title="Thermal Dissipation & Hotspot Dynamics" subtitle="Lumped Node Output">
            <EngineeringLineChart
              xAxisLabel="Time (seconds)"
              yAxisLabel="Temperature (°C)"
              series={thermalSeries}
              height={155}
            />
          </EngineeringPanel>
        </div>
      </div>
    </div>
  );
};

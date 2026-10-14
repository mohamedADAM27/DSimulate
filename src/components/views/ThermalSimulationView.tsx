/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Thermal & Cooling Fluid Flow Digital Twin Workspace (Screen 07)
 */

import React, { useState, useEffect } from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { Battery3DCanvas } from '../three/Battery3DCanvas';
import { CellPackCfdSimulation } from '../three/CellPackCfdSimulation';
import { ThermalHotspotInvestigation } from './ThermalHotspotInvestigation';
import { VisualizationLegend } from '../common/VisualizationLegend';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { EngineeringLineChart } from '../charts/EngineeringLineChart';
import { 
  Thermometer, 
  Wind, 
  SplitSquareVertical, 
  Box, 
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  ShieldAlert
} from 'lucide-react';

export const ThermalSimulationView: React.FC = () => {
  const { 
    batteryPack, 
    setVisualizationMode, 
    simulationHistory, 
    selectObject, 
    selectDiagnostic,
    coolantFlowVelocity,
    coolantFluidType,
    calculatedHeatTransferCoeff
  } = useBatteryStore();

  const [activeThermalMode, setActiveThermalMode] = useState<'HOTSPOT_INVESTIGATION' | 'CFD_COOLING' | 'PACK_DYNAMICS'>('HOTSPOT_INVESTIGATION');

  useEffect(() => {
    setVisualizationMode('THERMAL');
  }, [setVisualizationMode]);

  const thermalCompSeries = [
    {
      name: 'Cell C-017 (Hotspot Anomaly)',
      color: '#C62828',
      points: simulationHistory.map(p => ({ x: p.time, y: p.maxCellTemp })),
    },
    {
      name: 'Module 03 Average',
      color: '#D97706',
      points: simulationHistory.map(p => ({ x: p.time, y: p.packTemp + 1.8 })),
    },
    {
      name: 'Pack Baseline Average',
      color: '#005B91',
      dashArray: '3,2',
      points: simulationHistory.map(p => ({ x: p.time, y: p.packTemp })),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* View Mode Switcher Header with Cross-Coupled Telemetry */}
      <div className="h-[34px] bg-white border border-[#D5D9DD] rounded-[2px] px-2.5 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-[#0072A8]" />
          <span className="font-semibold text-[#20252A]">Thermal Management & Fluid Dynamics Digital Twin</span>
          <span className="text-[#7A8289]">· Coupled Convection-Diffusion CFD & Hotspot Analytics</span>
        </div>

        {/* Live Synchronized Telemetry Indicators */}
        <div className="hidden lg:flex items-center gap-3 text-[10.5px] font-mono-numbers text-[#5E666D]">
          <span>Flow: <strong className="text-[#0072A8]">{coolantFlowVelocity.toFixed(2)} m/s</strong></span>
          <span>·</span>
          <span>h: <strong className="text-[#20252A]">{calculatedHeatTransferCoeff} W/m²K</strong></span>
          <span>·</span>
          <span>Hotspot Peak: <strong className={batteryPack.maxCellTemp > 45 ? 'text-[#C62828]' : 'text-[#D97706]'}>{batteryPack.maxCellTemp} °C</strong></span>
        </div>

        {/* Workspace Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#F0F2F5] p-0.5 rounded-[2px] border border-[#D5D9DD] text-[10.5px]">
          <button
            onClick={() => setActiveThermalMode('HOTSPOT_INVESTIGATION')}
            className={`px-2.5 py-0.5 font-medium rounded-[2px] flex items-center gap-1.5 transition-colors ${
              activeThermalMode === 'HOTSPOT_INVESTIGATION'
                ? 'bg-[#005B91] text-white shadow-xs font-semibold'
                : 'text-[#5E666D] hover:text-[#20252A]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#F87171]" />
            <span>Thermal Hotspot Investigation (TR3D_CASE03)</span>
          </button>

          <button
            onClick={() => setActiveThermalMode('CFD_COOLING')}
            className={`px-2.5 py-0.5 font-medium rounded-[2px] flex items-center gap-1.5 transition-colors ${
              activeThermalMode === 'CFD_COOLING'
                ? 'bg-[#005B91] text-white shadow-xs font-semibold'
                : 'text-[#5E666D] hover:text-[#20252A]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>CFD Fluid Flow & Cooling (PKE4_CellPackCooling)</span>
          </button>

          <button
            onClick={() => setActiveThermalMode('PACK_DYNAMICS')}
            className={`px-2.5 py-0.5 font-medium rounded-[2px] flex items-center gap-1.5 transition-colors ${
              activeThermalMode === 'PACK_DYNAMICS'
                ? 'bg-[#005B91] text-white shadow-xs font-semibold'
                : 'text-[#5E666D] hover:text-[#20252A]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Pack Heat Dynamics (DS-EVBAT-001)</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE MODE */}
      {activeThermalMode === 'HOTSPOT_INVESTIGATION' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <ThermalHotspotInvestigation className="h-full w-full" />
        </div>
      ) : activeThermalMode === 'CFD_COOLING' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <CellPackCfdSimulation className="h-full w-full" />
        </div>
      ) : (
        /* RENDER MODE 3: Traction Pack Thermal Dynamics */
        <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
          {/* Top Thermal Metrics Ribbon */}
          <div className="grid grid-cols-4 gap-2 shrink-0">
            <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#7A8289] font-medium uppercase">Peak Cell Temperature</div>
                <div className="text-[18px] font-bold text-[#C62828] font-mono-numbers">{batteryPack.maxCellTemp} °C</div>
                <div className="text-[9.5px] text-[#5E666D]">Cell C-017 (Module 03)</div>
              </div>
              <Flame className="w-5 h-5 text-[#C62828]" />
            </div>

            <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#7A8289] font-medium uppercase">Pack Mean Temperature</div>
                <div className="text-[18px] font-bold text-[#20252A] font-mono-numbers">{batteryPack.temperature} °C</div>
                <div className="text-[9.5px] text-[#5E666D]">Target Window: 25.0°C – 35.0°C</div>
              </div>
              <Thermometer className="w-5 h-5 text-[#005B91]" />
            </div>

            <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#7A8289] font-medium uppercase">Cross-Pack Thermal Spread (ΔT)</div>
                <div className="text-[18px] font-bold text-[#D97706] font-mono-numbers">
                  {Number((batteryPack.maxCellTemp - batteryPack.minCellTemp).toFixed(1))} °C
                </div>
                <div className="text-[9.5px] text-[#D97706]">Exceeds 5.0°C Design Limit</div>
              </div>
              <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            </div>

            <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#7A8289] font-medium uppercase">Cold Plate Heat Flux</div>
                <div className="text-[18px] font-bold text-[#0072A8] font-mono-numbers">4.18 kW</div>
                <div className="text-[9.5px] text-[#5E666D]">Flow: {coolantFlowVelocity.toFixed(1)} m/s · h = {calculatedHeatTransferCoeff} W/m²K</div>
              </div>
              <Wind className="w-5 h-5 text-[#0072A8]" />
            </div>
          </div>

          {/* Split: 3D Thermal Viewport + Analysis */}
          <div className="flex-1 flex gap-2 min-h-0">
            <div className="flex-1 bg-white border border-[#D5D9DD] rounded-[2px] relative overflow-hidden flex flex-col">
              <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between text-[11px] font-semibold text-[#20252A] shrink-0">
                <span>3D Thermal Gradient Simulation Viewport</span>
                <span className="text-[10px] text-[#7A8289] font-normal">Scientific Jet/Turbo Distribution</span>
              </div>

              <div className="flex-1 relative">
                <Battery3DCanvas className="w-full h-full" showControls={true} />

                <div className="absolute bottom-12 left-3 z-10 pointer-events-auto max-w-xs">
                  <VisualizationLegend />
                </div>

                <div 
                  onClick={() => {
                    selectObject('CELL', 'C-017');
                    selectDiagnostic('D-003');
                  }}
                  className="absolute top-3 right-3 bg-white/95 border border-[#FCA5A5] p-2 rounded-[2px] text-[10.5px] shadow-sm cursor-pointer hover:bg-[#FEF2F2] transition-colors"
                >
                  <div className="font-bold text-[#C62828] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Localized Thermal Hotspot: Cell C-017</span>
                  </div>
                  <div className="text-[#7F1D1D] font-mono-numbers mt-0.5">
                    Observed: {batteryPack.maxCellTemp}°C · Click to inspect
                  </div>
                </div>
              </div>
            </div>

            {/* Right Analysis Panel */}
            <div className="w-80 xl:w-96 flex flex-col gap-2 shrink-0 overflow-auto">
              <EngineeringPanel title="Transient Thermal Dissipation Curve" subtitle="Drive Cycle Heat Rise">
                <EngineeringLineChart
                  xAxisLabel="Time (seconds)"
                  yAxisLabel="Surface Temp (°C)"
                  series={thermalCompSeries}
                  height={190}
                />
              </EngineeringPanel>

              <EngineeringPanel title="Thermal Dissipation Heat Balance" subtitle="Lumped Thermodynamic Nodes">
                <div className="space-y-2 text-[11px] font-mono-numbers p-1">
                  <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                    <span className="text-[#5E666D] font-sans">Joule Heat Generation (I²·R0):</span>
                    <span className="font-semibold text-[#20252A]">2,840 W</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                    <span className="text-[#5E666D] font-sans">Reversible Entropic Heat (I·T·∂Voc/∂T):</span>
                    <span className="font-semibold text-[#20252A]">310 W</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                    <span className="text-[#5E666D] font-sans">Cooling Plate Heat Removal:</span>
                    <span className="font-semibold text-[#0072A8]">-2,620 W</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                    <span className="text-[#5E666D] font-sans">Net Pack Heat Accumulation:</span>
                    <span className="font-semibold text-[#D97706]">+530 W</span>
                  </div>
                  <div className="p-1.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[2px] text-[10px] text-[#92400E] font-sans">
                    <strong>Cooling Diagnostic:</strong> Coolant velocity: {coolantFlowVelocity.toFixed(2)} m/s ({coolantFluidType}). Localized stagnation near Module 03 tab weld enhances Cell C-017 thermal gradient.
                  </div>
                </div>
              </EngineeringPanel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

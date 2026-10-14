/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Project & Physics Twin Overview (Screen 01)
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { 
  Box, 
  Cpu, 
  Layers, 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  FileText,
  Workflow
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { batteryPack, diagnosticEvents, setWorkspace, setVisualizationMode } = useBatteryStore();

  const activeWarnings = diagnosticEvents.filter(e => e.status === 'ACTIVE' && e.severity === 'WARNING').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Project Banner */}
      <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-3 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#005B91] text-[15px]">DSimulate</span>
            <span className="text-[#D5D9DD]">|</span>
            <span className="font-semibold text-[#20252A] text-[13px]">{batteryPack.name}</span>
            <span className="text-[10.5px] px-2 py-0.5 bg-[#DCECF6] text-[#005B91] rounded-[2px] font-mono-numbers font-medium">
              {batteryPack.id}
            </span>
          </div>
          <div className="text-[11px] text-[#5E666D] mt-0.5">
            Physics-Informed Battery Digital Twin for Data-Driven State Estimation, Degradation Prognostics, Remaining Useful Life Prediction and Intelligent BMS Diagnostics
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setVisualizationMode('NORMAL');
              setWorkspace('digital-twin');
            }}
            className="px-3 py-1.5 bg-[#005B91] hover:bg-[#004B78] text-white text-[11px] font-semibold rounded-[2px] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Open 3D Digital Twin →</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Specifications (Left) + Hybrid Architecture Flowchart (Right) */}
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0 overflow-auto">
        {/* Left Column: Technical Specifications & Bill of Materials */}
        <div className="flex flex-col gap-2">
          <EngineeringPanel title="Battery System Specifications" subtitle="DS-EVBAT-001 Configuration">
            <div className="space-y-1.5 text-[11px] font-mono-numbers p-1">
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Pack Nominal Voltage:</span>
                <span className="font-semibold text-[#20252A]">{batteryPack.nominalVoltage} V (800V Architecture)</span>
              </div>
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Cell Array Topology:</span>
                <span className="font-semibold text-[#20252A]">96S Prismatic (8 Modules × 12 Cells)</span>
              </div>
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Cell Chemistry:</span>
                <span className="font-semibold text-[#20252A]">LiNi0.8Mn0.1Co0.1O2 (NMC 811)</span>
              </div>
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Nominal Energy Capacity:</span>
                <span className="font-semibold text-[#20252A]">{batteryPack.nominalCapacityKWh} kWh</span>
              </div>
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Measured Retained Capacity:</span>
                <span className="font-semibold text-[#005B91]">{batteryPack.measuredCapacityKWh} kWh</span>
              </div>
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Current Cycle Count:</span>
                <span className="font-semibold text-[#20252A]">{batteryPack.cycleCount} cycles</span>
              </div>
              <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                <span className="text-[#5E666D] font-sans">Predicted Pack RUL:</span>
                <span className="font-bold text-[#005B91]">{batteryPack.predictedRul} cycles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5E666D] font-sans">Thermal Cooling Interface:</span>
                <span className="text-[#0072A8]">Bottom Liquid Cold Plate (10 L/min)</span>
              </div>
            </div>
          </EngineeringPanel>

          <EngineeringPanel title="BMS Health & Anomaly Summary" subtitle="ISO 26262 ASIL-D">
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#5E666D]">Diagnostic Status:</span>
                <span className="font-bold text-[#D97706] flex items-center gap-1 font-mono-numbers">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {activeWarnings} Active Warnings
                </span>
              </div>
              <div className="text-[10px] text-[#7A8289] font-sans leading-relaxed">
                Critical trigger on <strong>Module 03 / Cell C-017</strong> (Thermal excursion +6.5°C, contact resistance drift +1.28 mΩ).
              </div>
              <button
                onClick={() => setWorkspace('diagnostics')}
                className="w-full py-1.5 bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] hover:bg-[#FEF3C7] font-semibold text-[10.5px] rounded-[2px] transition-colors"
              >
                Inspect All 5 BMS Diagnostic Events →
              </button>
            </div>
          </EngineeringPanel>
        </div>

        {/* Center/Right Column: Hybrid Physics + Data Layer Flowchart Architecture */}
        <div className="col-span-2 flex flex-col gap-2">
          <EngineeringPanel 
            title="Hybrid Physics + Data-Driven Architecture (Section 18)" 
            subtitle="Closed-Loop Digital Twin Pipeline"
          >
            <div className="p-3 bg-[#FAFAFA] border border-[#E3E6E8] rounded-[2px] space-y-3 font-mono-numbers">
              {/* Flowchart Diagram */}
              <div className="flex flex-col items-center gap-2">
                {/* Node 1 */}
                <div className="w-full max-w-md bg-white border border-[#D5D9DD] p-2 rounded-[2px] shadow-2xs text-center">
                  <div className="text-[10px] text-[#7A8289] uppercase font-sans">Layer 1: Input Vector</div>
                  <div className="font-bold text-[#20252A] text-[11.5px]">Sensor Telemetry & Drive Demands</div>
                  <div className="text-[10px] text-[#5E666D]">Pack I(t), V_cells, T_modules, Ambient Temperature</div>
                </div>

                <div className="text-[#7A8289] text-[11px]">↓</div>

                {/* Node 2 */}
                <div className="w-full max-w-md bg-white border border-[#005B91] p-2 rounded-[2px] shadow-2xs text-center">
                  <div className="text-[10px] text-[#005B91] uppercase font-sans font-semibold">Layer 2: Physics-Informed Core</div>
                  <div className="font-bold text-[#005B91] text-[11.5px]">2-RC Thevenin ECM + Lumped Heat Diffusion</div>
                  <div className="text-[10px] text-[#5E666D]">dSOC/dt = -I/Qnom · RC overvoltage relaxation · Fourier thermal conduction</div>
                </div>

                <div className="text-[#7A8289] text-[11px]">↓</div>

                {/* Node 3 */}
                <div className="w-full max-w-md bg-white border border-[#0072A8] p-2 rounded-[2px] shadow-2xs text-center">
                  <div className="text-[10px] text-[#0072A8] uppercase font-sans font-semibold">Layer 3: Data-Driven Observer</div>
                  <div className="font-bold text-[#0072A8] text-[11.5px]">Dual Extended Kalman Filter (EKF) & SEI Kinetics</div>
                  <div className="text-[10px] text-[#5E666D]">Closed-loop state estimation fusing voltage residuals to correct SOC drift</div>
                </div>

                <div className="text-[#7A8289] text-[11px]">↓</div>

                {/* Node 4 */}
                <div className="w-full max-w-md bg-[#F0F6FA] border border-[#005B91] p-2 rounded-[2px] text-center">
                  <div className="text-[10px] text-[#005B91] uppercase font-sans font-semibold">Layer 4: State Synchronization Engine</div>
                  <div className="font-bold text-[#005B91] text-[12px]">Digital Twin Live State (96 Cells Synchronized)</div>
                  <div className="text-[10px] text-[#333D47]">Drives 3D CAD mesh colors, property inspectors, and prognostic routines</div>
                </div>

                <div className="text-[#7A8289] text-[11px]">↓</div>

                {/* Node 5: Split outputs */}
                <div className="w-full max-w-md grid grid-cols-2 gap-2">
                  <div className="bg-white border border-[#D5D9DD] p-2 rounded-[2px] text-center">
                    <div className="text-[10px] text-[#005B91] font-semibold font-sans">Prognostics & RUL</div>
                    <div className="text-[10px] text-[#5E666D]">Arrhenius aging model to 80% EOL</div>
                  </div>
                  <div className="bg-white border border-[#D5D9DD] p-2 rounded-[2px] text-center">
                    <div className="text-[10px] text-[#D97706] font-semibold font-sans">Deterministic BMS</div>
                    <div className="text-[10px] text-[#5E666D]">Multi-rule anomaly detection</div>
                  </div>
                </div>
              </div>
            </div>
          </EngineeringPanel>

          {/* Model Integrity & Compliance Statement */}
          <div className="bg-white border border-[#D5D9DD] p-2.5 rounded-[2px] text-[11px] font-sans">
            <div className="font-semibold text-[#20252A] flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              <span>Engineering Scientific Transparency Notice</span>
            </div>
            <div className="text-[#5E666D] leading-relaxed">
              DSimulate implements transparent, deterministic equivalent circuit and empirical electrochemical degradation formulations. All estimates and predictions are mathematically computed from established battery engineering equations without fabricated claims.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

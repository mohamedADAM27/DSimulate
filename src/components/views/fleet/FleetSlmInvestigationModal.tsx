/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Fleet Physics SLM Investigation Modal
 */

import React, { useState } from 'react';
import { FleetMaintenanceItem } from '../../../types/fleetMaintenance';
import { useBatteryStore } from '../../../stores/useBatteryStore';
import { 
  X, 
  Cpu, 
  ArrowRight, 
  Activity, 
  ShieldAlert, 
  CheckCircle, 
  Layers, 
  Box, 
  AlertTriangle,
  FileText
} from 'lucide-react';

interface FleetSlmInvestigationModalProps {
  item: FleetMaintenanceItem;
  onClose: () => void;
  onNavigateToInterventionIntel: () => void;
}

export const FleetSlmInvestigationModal: React.FC<FleetSlmInvestigationModalProps> = ({
  item,
  onClose,
  onNavigateToInterventionIntel
}) => {
  const { setWorkspace, setVisualizationMode } = useBatteryStore();
  const [activeTab, setActiveTab] = useState<'ROOT_CAUSE' | 'FEASIBILITY' | 'DIGITAL_TWIN'>('ROOT_CAUSE');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-[#003B5C] text-white px-4 py-3 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#38BDF8]" />
            <span className="font-bold text-[13px] tracking-wide uppercase">
              Physics-Focused SLM: Root-Cause Investigation & Scenario Feasibility
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 hover:bg-[#00273D] border border-black/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle & Anomaly Bar */}
        <div className="bg-[#005B91] text-white p-3 border-b-2 border-black flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-black text-[#38BDF8] px-1.5 py-0.5 border border-white/20 font-bold">
                {item.vehicleId}
              </span>
              <span className="font-bold text-[12.5px]">{item.vehicleName}</span>
              <span className="text-[10.5px] text-white/80 font-mono">({item.chemistry})</span>
            </div>
            <div className="text-[11.5px] text-[#E0F2FE] font-medium mt-0.5">
              Anomaly: {item.detectedIssue}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-white/80">Model Grounding:</div>
            <div className="text-[11px] font-mono font-bold text-[#38BDF8]">
              {item.calculationMethod} ({item.confidencePct}% Conf)
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b-2 border-black bg-[#F4F5F6] text-[11px] font-mono font-bold">
          <button
            onClick={() => setActiveTab('ROOT_CAUSE')}
            className={`flex-1 py-2 px-3 border-r border-black uppercase text-center transition-colors ${
              activeTab === 'ROOT_CAUSE' ? 'bg-white text-[#005B91] border-b-2 border-b-[#005B91]' : 'text-[#5E666D] hover:bg-white/60'
            }`}
          >
            1. Electrochemical Root-Cause
          </button>
          <button
            onClick={() => setActiveTab('FEASIBILITY')}
            className={`flex-1 py-2 px-3 border-r border-black uppercase text-center transition-colors ${
              activeTab === 'FEASIBILITY' ? 'bg-white text-[#005B91] border-b-2 border-b-[#005B91]' : 'text-[#5E666D] hover:bg-white/60'
            }`}
          >
            2. Feasible Maintenance Scenarios
          </button>
          <button
            onClick={() => setActiveTab('DIGITAL_TWIN')}
            className={`flex-1 py-2 px-3 uppercase text-center transition-colors ${
              activeTab === 'DIGITAL_TWIN' ? 'bg-white text-[#005B91] border-b-2 border-b-[#005B91]' : 'text-[#5E666D] hover:bg-white/60'
            }`}
          >
            3. Digital Twin Telemetry Evidence
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-[12px] flex-1">
          {activeTab === 'ROOT_CAUSE' && (
            <div className="space-y-3">
              <div className="border border-black p-3 bg-[#F8FAFC]">
                <h5 className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#005B91]" />
                  <span>SLM First-Principles Physical Hypothesis</span>
                </h5>
                <p className="text-[12px] text-[#20252A] leading-relaxed">
                  The physics-focused small language model evaluated coupled thermal-ohmic degradation equations for pack <strong className="font-mono">{item.batteryPackId}</strong>. Based on continuous telemetry with {item.evidence.length} verified physical sensors, the primary driving mechanism is identified as:
                </p>
                <div className="mt-2.5 p-2.5 bg-white border-2 border-black font-mono text-[11px] space-y-1">
                  <div className="text-[#005B91] font-bold">
                    MECHANISM: {item.category === 'BATTERY_THERMAL' 
                      ? 'Localized Heat Generation via Impedance Mismatch & Contact Resistance'
                      : item.category === 'CELL_IMBALANCE' 
                      ? 'Loss of Active Lithium & Anodic SEI Thickening Divergence'
                      : 'Hydraulic Loop Flow Restriction & Reduced Heat Transfer Flux'}
                  </div>
                  <div className="text-[#5E666D]">
                    MATHEMATICAL CORRELATION: Q_gen = I² · R_int + I · T · (∂U_ocv / ∂T) | Residual error &lt; 3.8%
                  </div>
                </div>
              </div>

              {/* Physical Evidence Verification */}
              <div className="border border-black p-3 bg-white space-y-2">
                <h5 className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px]">
                  Corroborating Telemetry Evidence ({item.dataFreshness})
                </h5>
                <div className="space-y-1.5">
                  {item.evidence.map((ev, idx) => (
                    <div key={idx} className="border border-[#D5D9DD] p-2 bg-[#F9FAFB] flex items-start justify-between">
                      <div>
                        <div className="font-bold text-[11.5px] text-[#20252A]">{ev.parameter}</div>
                        <div className="text-[10px] text-[#5E666D]">{ev.physicalSignificance}</div>
                        <div className="text-[9.5px] font-mono text-[#005B91] mt-0.5">Sensor: {ev.sourceSensor}</div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-mono font-bold text-[12px] text-[#DC2626]">{ev.observed}</span>
                        <div className="font-mono text-[9.5px] text-[#5E666D]">Baseline: {ev.baseline} ({ev.delta})</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uncertainty and Missing Inputs Notice */}
              <div className="border border-black p-2.5 bg-[#FFFBEB] text-[#92400E] text-[11px] font-mono space-y-1">
                <div className="font-bold uppercase tracking-wider">
                  Model Uncertainty & Transparent Assumptions:
                </div>
                <div>Uncertainty Index: <strong>{item.uncertaintyPct}%</strong> · Reason: {item.uncertaintyReason}</div>
                {item.missingInputs && item.missingInputs.length > 0 && (
                  <div className="text-[#B45309]">
                    Missing Laboratory Inputs: {item.missingInputs.join(', ')} (Prioritized rule-based fallback applied)
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'FEASIBILITY' && (
            <div className="space-y-3">
              <div className="border border-black p-3 bg-[#F8FAFC]">
                <h5 className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] mb-2">
                  Evaluated Maintenance Scenarios (Digital Twin Simulation)
                </h5>
                <div className="space-y-2.5">
                  {/* Scenario 1 */}
                  <div className="border-2 border-[#16A34A] bg-[#F0FDF4] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-[11px] text-[#166534] bg-white px-1.5 py-0.5 border border-[#16A34A]">
                        RECOMMENDED: Comprehensive Coolant Flush & Module Rebalancing
                      </span>
                      <span className="font-mono font-bold text-[11px] text-[#166534]">Confidence: 94%</span>
                    </div>
                    <p className="text-[11.5px] text-[#14532D] mt-1">
                      Targeted maintenance bay intervention: Flush glycol circuit branch #4, apply fresh thermal TIM, and execute precision balancing.
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[10px] text-[#14532D] pt-2 border-t border-[#86EFAC]">
                      <div>Expected Duration: <strong>{item.expectedServiceDurationHours} hrs</strong></div>
                      <div>Expected SOH Gain: <strong>+0.8%</strong></div>
                      <div>RUL Extension: <strong>+320 cycles</strong></div>
                    </div>
                  </div>

                  {/* Scenario 2 */}
                  <div className="border border-[#D5D9DD] bg-white p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-[11px] text-[#5E666D]">
                        ALTERNATIVE: Software De-rating Only (No Hardware Bay Time)
                      </span>
                      <span className="font-mono text-[10.5px] text-[#DC2626]">NOT RECOMMENDED FOR ASIL-D</span>
                    </div>
                    <p className="text-[11px] text-[#5E666D] mt-1">
                      Derate maximum peak discharge current by 35% via BMS OTA parameter update. Does not address local thermal hotspot and risks accelerated pouch degradation under hot weather.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DIGITAL_TWIN' && (
            <div className="space-y-3">
              <div className="border border-black p-3 bg-[#F8FAFC]">
                <h5 className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] mb-1.5">
                  Real-Time Digital Twin Physics Coupling
                </h5>
                <p className="text-[11.5px] text-[#20252A]">
                  This fleet vehicle is directly mapped to the physics model in DSimulate. You can inspect the individual 3D cells, temperature gradients across modules, and electrochemical state estimation.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="border border-black p-2 bg-white">
                    <span className="text-[#5E666D] block text-[10px]">Active Pack Mapping:</span>
                    <strong className="text-[#005B91]">{item.batteryPackId}</strong>
                  </div>
                  <div className="border border-black p-2 bg-white">
                    <span className="text-[#5E666D] block text-[10px]">Coupled Physical Layers:</span>
                    <strong className="text-[#20252A]">3D CFD + 1D Electrochemistry</strong>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setVisualizationMode('THERMAL');
                      setWorkspace('digital-twin');
                    }}
                    className="flex-1 py-2 px-3 border-2 border-black bg-[#005B91] hover:bg-[#003B5C] text-white font-mono font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>View in 3D Digital Twin</span>
                  </button>
                  <button
                    onClick={() => {
                      setWorkspace('diagnostics');
                    }}
                    className="flex-1 py-2 px-3 border-2 border-black bg-white hover:bg-[#F3F4F6] text-[#20252A] font-mono font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>View BMS Diagnostics</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with direct launch to Intervention Intelligence */}
        <div className="p-3 border-t-2 border-black bg-[#F8FAFC] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border-2 border-black bg-white hover:bg-[#F3F4F6] font-mono font-bold text-[11px] uppercase tracking-wider"
          >
            Close
          </button>
          
          <button
            onClick={onNavigateToInterventionIntel}
            className="px-5 py-2 border-2 border-black bg-[#003B5C] hover:bg-[#00273D] text-[#38BDF8] hover:text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center gap-2"
          >
            <span>Open in Intervention Intelligence Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

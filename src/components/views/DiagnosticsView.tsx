/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Intelligent BMS Diagnostics Workspace (Screen 10)
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck,
  ArrowRight, 
  Zap, 
  Thermometer, 
  Eye, 
  Box, 
  Layers,
  Filter,
  Cpu
} from 'lucide-react';
import { interventionService } from '../../services/interventionService';

export const DiagnosticsView: React.FC = () => {
  const { 
    batteryPack,
    diagnosticEvents, 
    selectedDiagnosticId, 
    selectDiagnostic, 
    setWorkspace, 
    selectObject,
    setVisualizationMode 
  } = useBatteryStore();

  const selectedEvent = diagnosticEvents.find(e => e.id === selectedDiagnosticId) || diagnosticEvents[0];

  const handleRowClick = (id: string) => {
    selectDiagnostic(id);
  };

  const handleFocus3D = (event: typeof selectedEvent) => {
    selectDiagnostic(event.id);
    if (event.objectType === 'CELL') {
      selectObject('CELL', event.objectId);
    } else if (event.objectType === 'MODULE') {
      selectObject('MODULE', event.objectId);
    } else {
      selectObject('PACK');
    }

    if (event.parameter.toLowerCase().includes('temperature') || event.parameter.toLowerCase().includes('thermal')) {
      setVisualizationMode('THERMAL');
    } else if (event.parameter.toLowerCase().includes('voltage')) {
      setVisualizationMode('VOLTAGE');
    }

    setWorkspace('digital-twin');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Banner */}
      <div className="h-[32px] bg-white border border-[#D5D9DD] rounded-[2px] px-3 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-[#005B91]" />
          <span className="font-semibold text-[#20252A]">Deterministic BMS Anomaly Detection Engine</span>
          <span className="text-[#7A8289]">
            {diagnosticEvents.length > 0 ? `· ${diagnosticEvents.length} Active Rule Violations` : '· Awaiting Simulation Execution'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10.5px] text-[#5E666D]">
          <span>Safety Standard: ISO 26262 ASIL-D / UL 2580</span>
        </div>
      </div>

      {/* Main Split: Diagnostics Table (Left/Center 65%) + Physics Root-Cause Inspector (Right 35%) */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left: Engineering Diagnostics Event Table */}
        <div className="flex-1 bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col overflow-hidden">
          <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between font-semibold text-[#20252A] text-[11px] shrink-0">
            <span>BMS Anomaly & Fault Log</span>
            <span className="text-[10px] text-[#7A8289] font-normal">
              {diagnosticEvents.length > 0 ? 'Click any row to select & synchronize 3D Twin' : 'Run simulation timeline to evaluate active alerts'}
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            {diagnosticEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#FAFBFD]">
                <div className="w-12 h-12 rounded-full bg-[#EAEFF4] flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6 text-[#005B91]" />
                </div>
                <div className="font-semibold text-[13px] text-[#20252A]">No Active Diagnostic Alerts</div>
                <p className="text-[11px] text-[#5E666D] max-w-sm mt-1 leading-relaxed">
                  Press the <strong>Play / Run Simulation</strong> button on the timeline below. The deterministic ODE solver will process cell dynamics, highlight localized cell faults with caution symbols, and publish verified BMS alerts.
                </p>
              </div>
            ) : (
            <table className="w-full text-left border-collapse text-[11px] font-mono-numbers">
              <thead className="bg-[#F4F6F8] border-b border-[#D5D9DD] sticky top-0 text-[10px] text-[#5E666D] font-sans font-semibold">
                <tr>
                  <th className="py-1.5 px-2">ID</th>
                  <th className="py-1.5 px-2">Component</th>
                  <th className="py-1.5 px-2">Parameter</th>
                  <th className="py-1.5 px-2">Observed</th>
                  <th className="py-1.5 px-2">Expected</th>
                  <th className="py-1.5 px-2">Deviation</th>
                  <th className="py-1.5 px-2">Severity</th>
                  <th className="py-1.5 px-2">Status</th>
                  <th className="py-1.5 px-2 text-right">3D Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6E8]">
                {diagnosticEvents.map((evt) => {
                  const isSelected = selectedDiagnosticId === evt.id;
                  const isWarning = evt.severity === 'WARNING';

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => handleRowClick(evt.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-[#DCECF6] font-semibold text-[#005B91]' 
                          : 'hover:bg-[#F0F4F8] text-[#20252A]'
                      }`}
                    >
                      <td className="py-1.5 px-2 font-bold">{evt.id}</td>
                      <td className="py-1.5 px-2 font-semibold">
                        <span className="font-sans">{evt.objectId}</span>
                      </td>
                      <td className="py-1.5 px-2 font-sans">{evt.parameter}</td>
                      <td className="py-1.5 px-2 font-bold text-[#C62828]">{evt.observed}</td>
                      <td className="py-1.5 px-2 text-[#5E666D]">{evt.expected}</td>
                      <td className="py-1.5 px-2 font-semibold text-[#D97706]">{evt.deviation}</td>
                      <td className="py-1.5 px-2 font-sans">
                        {isWarning ? (
                          <span className="text-[#D97706] flex items-center gap-1 font-semibold text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                            WARNING
                          </span>
                        ) : (
                          <span className="text-[#2E7D32] flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 font-sans">
                        <span className={`text-[9.5px] px-1 py-0.2 rounded-[2px] ${
                          evt.status === 'ACTIVE' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#E2E8F0] text-[#475569]'
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocus3D(evt);
                          }}
                          className="px-1.5 py-0.5 bg-white border border-[#005B91] hover:bg-[#005B91] hover:text-white text-[#005B91] text-[10px] rounded-[2px] font-sans transition-colors"
                        >
                          Focus 3D →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>

          <div className="h-[24px] bg-[#F7F8F9] border-t border-[#D5D9DD] px-2 flex items-center justify-between text-[10px] text-[#7A8289] shrink-0 font-mono-numbers">
            <span>Deterministic Rule Check Cycle: 716</span>
            <span>Scan Frequency: 100 Hz BMS CAN Bus</span>
          </div>
        </div>

        {/* Right: Selected Anomaly Physics Root-Cause Investigation */}
        {selectedEvent && (
          <div className="w-80 xl:w-96 bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col shrink-0 text-[11px] overflow-hidden">
            <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between font-semibold text-[#20252A]">
              <span>Root-Cause Diagnostic Inspector</span>
              <span className="text-[10.5px] font-bold text-[#005B91] font-mono-numbers">{selectedEvent.id}</span>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-3 font-mono-numbers">
              {/* Event Header Banner */}
              <div className="p-2 border border-[#FDE68A] bg-[#FFFBEB] rounded-[2px]">
                <div className="flex items-center gap-1.5 text-[#92400E] font-bold font-sans text-[12px]">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>{selectedEvent.parameter}</span>
                </div>
                <div className="text-[10px] text-[#78350F] font-sans mt-0.5">
                  Target: <strong>{selectedEvent.objectType} {selectedEvent.objectId}</strong> · Timestamp: {selectedEvent.timestamp}
                </div>
              </div>

              {/* Observed vs Expected Comparison Grid */}
              <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-white">
                <div className="text-[10px] font-semibold text-[#5E666D] font-sans uppercase mb-1.5">
                  Telemetry Comparison
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <div className="text-[9.5px] text-[#7A8289] font-sans">Observed</div>
                    <div className="font-bold text-[#C62828] text-[13px]">{selectedEvent.observed}</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] text-[#7A8289] font-sans">Expected</div>
                    <div className="font-medium text-[#5E666D] text-[13px]">{selectedEvent.expected}</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] text-[#7A8289] font-sans">Deviation</div>
                    <div className="font-bold text-[#D97706] text-[13px]">{selectedEvent.deviation}</div>
                  </div>
                </div>
              </div>

              {/* Physical Symptom Description */}
              <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-white text-[10.5px] font-sans">
                <div className="font-semibold text-[#20252A] mb-1">Phenomenon Description</div>
                <div className="text-[#333D47] leading-relaxed">
                  {selectedEvent.description}
                </div>
              </div>

              {/* Electrochemical Physics Root Cause */}
              <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-[#F9FAFB] text-[10.5px] font-sans">
                <div className="font-semibold text-[#005B91] mb-1">Electrochemical Root Cause</div>
                <div className="text-[#333D47] leading-relaxed">
                  {selectedEvent.rootCause}
                </div>
              </div>

              {/* Recommended Action / Mitigation */}
              <div className="border border-[#BFDBFE] rounded-[2px] p-2 bg-[#EFF6FF] text-[10.5px] font-sans">
                <div className="font-semibold text-[#1E40AF] mb-1">Recommended Mitigation</div>
                <div className="text-[#1E3A8A] leading-relaxed">
                  1. Increase coolant flow rate to 14 L/min to suppress cell thermal runaway risks.<br />
                  2. Derate peak fast-charge C-rate to 1.0C until cell impedance stabilizes.<br />
                  3. Schedule cell contact torque & ultrasonic weld inspection at next service window.
                </div>
              </div>

              {/* One-Click 3D Digital Twin Navigation */}
              <button
                onClick={() => handleFocus3D(selectedEvent)}
                className="w-full py-2 bg-[#005B91] hover:bg-[#004B78] text-white font-semibold text-[11px] rounded-[2px] flex items-center justify-center gap-1.5 transition-colors font-sans shadow-xs cursor-pointer"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Synchronize & Highlight Component in 3D View</span>
              </button>

              {/* Launch Intervention Intelligence Investigation */}
              <button
                onClick={() => {
                  interventionService.createNewInvestigation(batteryPack, selectedEvent);
                  setWorkspace('intervention-intelligence');
                }}
                className="w-full py-2 bg-[#003B5C] hover:bg-[#00273D] text-[#38BDF8] hover:text-white font-mono font-bold text-[11px] border-2 border-black flex items-center justify-center gap-2 transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Investigate Anomaly in Intervention Intelligence (SLM) →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - New Investigation Creation Modal (Brutalist Style)
 */

import React, { useState } from 'react';
import { useBatteryStore } from '../../../stores/useBatteryStore';
import { DiagnosticEvent } from '../../../types/battery';
import { 
  X, 
  Cpu, 
  AlertTriangle, 
  Plus, 
  Layers, 
  Thermometer, 
  Zap, 
  Activity 
} from 'lucide-react';

interface NewInvestigationModalProps {
  onClose: () => void;
  onCreate: (customTitle?: string, diagnosis?: DiagnosticEvent) => void;
}

export const NewInvestigationModal: React.FC<NewInvestigationModalProps> = ({
  onClose,
  onCreate,
}) => {
  const { batteryPack, diagnosticEvents } = useBatteryStore();

  const [title, setTitle] = useState('');
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string>(
    diagnosticEvents[0]?.id || 'CUSTOM'
  );
  const [customParameter, setCustomParameter] = useState('Cell Surface Temperature');
  const [customCellId, setCustomCellId] = useState('C-017');
  const [customObserved, setCustomObserved] = useState('42.5 °C');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDiagnosticId !== 'CUSTOM') {
      const selectedDiag = diagnosticEvents.find((d: DiagnosticEvent) => d.id === selectedDiagnosticId);
      onCreate(title || undefined, selectedDiag);
    } else {
      const customDiag: DiagnosticEvent = {
        id: `DIAG-USER-${Date.now().toString(36).toUpperCase()}`,
        objectId: customCellId,
        objectType: 'CELL',
        parameter: customParameter,
        observed: customObserved,
        expected: '28.0 °C',
        unit: '°C',
        deviation: '+14.5 °C (+51.8%)',
        severity: 'WARNING',
        status: 'ACTIVE',
        cycle: batteryPack.cycleCount,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        description: `User-defined investigation for ${customParameter} on cell ${customCellId}.`,
        rootCause: 'Under active physics SLM evaluation.',
      };
      onCreate(title || undefined, customDiag);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 select-none">
      <div className="bg-white border-4 border-black w-full max-w-xl shadow-[8px_8px_0px_#003B5C] font-mono">
        {/* Header */}
        <div className="bg-[#003B5C] text-white p-3 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#38BDF8]" />
            <span className="font-extrabold text-[13px] tracking-wider uppercase">
              CREATE NEW INTERVENTION INVESTIGATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[#38BDF8] p-1 border border-black hover:border-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleCreate} className="p-4 flex flex-col gap-3 text-[11px]">
          {/* Active Battery Pack Context */}
          <div className="p-2.5 bg-[#FAFBFD] border-2 border-black">
            <div className="text-[9.5px] uppercase font-bold text-[#5E666D] mb-1">
              TARGET BATTERY PACK DIGITAL TWIN
            </div>
            <div className="flex items-center justify-between">
              <span className="font-black text-[13px] text-[#005B91]">{batteryPack.name}</span>
              <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold">
                {batteryPack.architecture}
              </span>
            </div>
            <div className="text-[9.5px] text-[#7A8289] mt-1">
              Live State: {batteryPack.packVoltage}V · T_max {batteryPack.maxCellTemp}°C · SOH {batteryPack.avgSoh}% · RUL {batteryPack.predictedRul} cycles
            </div>
          </div>

          {/* Investigation Title */}
          <div>
            <label className="block text-[9.5px] uppercase font-bold text-[#20252A] mb-1">
              INVESTIGATION CASE TITLE (OPTIONAL)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cell C-017 Thermal Hotspot & SEI Layer Mitigation"
              className="w-full bg-[#FAFBFD] border-2 border-black p-2 text-[#20252A] focus:outline-hidden focus:border-[#005B91]"
            />
          </div>

          {/* Source Diagnostic Selection */}
          <div>
            <label className="block text-[9.5px] uppercase font-bold text-[#20252A] mb-1">
              SELECT SOURCE ANOMALY / DIAGNOSIS
            </label>

            <div className="space-y-1.5">
              {diagnosticEvents.map((diag: DiagnosticEvent) => (
                <label 
                  key={diag.id}
                  className={`flex items-center justify-between p-2 border-2 cursor-pointer transition-all ${
                    selectedDiagnosticId === diag.id 
                      ? 'bg-[#EBF4FA] border-black shadow-[2px_2px_0px_#000]' 
                      : 'border-[#D5D9DD] hover:border-black'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="diagSource"
                      checked={selectedDiagnosticId === diag.id}
                      onChange={() => setSelectedDiagnosticId(diag.id)}
                      className="accent-[#005B91]"
                    />
                    <div>
                      <div className="font-bold text-[#20252A]">
                        {diag.parameter} [{diag.objectId}]
                      </div>
                      <div className="text-[9.5px] text-[#C62828] font-bold">
                        Observed: {diag.observed} (Deviation: {diag.deviation})
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] bg-[#D97706] text-white px-1.5 py-0.2 font-bold">
                    {diag.severity}
                  </span>
                </label>
              ))}

              <label 
                className={`flex items-center gap-2 p-2 border-2 cursor-pointer transition-all ${
                  selectedDiagnosticId === 'CUSTOM' 
                    ? 'bg-[#EBF4FA] border-black shadow-[2px_2px_0px_#000]' 
                    : 'border-[#D5D9DD] hover:border-black'
                }`}
              >
                <input
                  type="radio"
                  name="diagSource"
                  checked={selectedDiagnosticId === 'CUSTOM'}
                  onChange={() => setSelectedDiagnosticId('CUSTOM')}
                  className="accent-[#005B91]"
                />
                <span className="font-bold text-[#20252A]">Define Custom Anomaly Parameter Target</span>
              </label>
            </div>
          </div>

          {/* Custom Parameter Fields */}
          {selectedDiagnosticId === 'CUSTOM' && (
            <div className="p-2.5 bg-[#FAFBFD] border-2 border-black grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] uppercase font-bold text-[#5E666D] block mb-0.5">PARAMETER</label>
                <input
                  type="text"
                  value={customParameter}
                  onChange={(e) => setCustomParameter(e.target.value)}
                  className="w-full bg-white border border-black p-1 text-[10px]"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-[#5E666D] block mb-0.5">TARGET CELL</label>
                <input
                  type="text"
                  value={customCellId}
                  onChange={(e) => setCustomCellId(e.target.value)}
                  className="w-full bg-white border border-black p-1 text-[10px]"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-[#5E666D] block mb-0.5">OBSERVED VALUE</label>
                <input
                  type="text"
                  value={customObserved}
                  onChange={(e) => setCustomObserved(e.target.value)}
                  className="w-full bg-white border border-black p-1 text-[10px]"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black mt-1">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#F4F5F6] hover:bg-[#E2E8F0] text-[#20252A] border-2 border-black px-3 py-1.5 font-bold uppercase text-[10.5px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black px-4 py-1.5 font-bold uppercase text-[10.5px] shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              Initialize Case & Connect Twin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

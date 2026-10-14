/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Engineering Object Inspector Panel
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { 
  Zap, 
  Thermometer, 
  Activity, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Eye, 
  Layers,
  ShieldAlert
} from 'lucide-react';

export const ObjectInspector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    batteryPack, 
    selectedObjectType, 
    selectedModuleId, 
    selectedCellId,
    diagnosticEvents,
    setIsolate,
    isolatedObjectId,
    selectDiagnostic,
    setWorkspace,
    setVisualizationMode,
    selectObject
  } = useBatteryStore();

  // Find active cell or module
  let activeCell = null;
  let activeModule = null;

  if (selectedCellId) {
    for (const m of batteryPack.modules) {
      const c = m.cells.find(cell => cell.id === selectedCellId);
      if (c) {
        activeCell = c;
        activeModule = m;
        break;
      }
    }
  } else if (selectedModuleId) {
    activeModule = batteryPack.modules.find(m => m.id === selectedModuleId);
  }

  const isIsolated = isolatedObjectId === (selectedCellId || selectedModuleId);

  const toggleIsolation = () => {
    if (isIsolated) {
      setIsolate(null);
    } else {
      setIsolate(selectedCellId || selectedModuleId || null);
    }
  };

  return (
    <div className={`bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col h-full select-none text-[11px] ${className}`}>
      {/* Header */}
      <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-[#20252A]">
          <Activity className="w-3.5 h-3.5 text-[#005B91]" />
          <span>Engineering Object Inspector</span>
        </div>

        {/* Isolation Action */}
        {(selectedCellId || selectedModuleId) && (
          <button
            onClick={toggleIsolation}
            className={`px-1.5 py-0.5 text-[10px] rounded-[2px] transition-colors border ${
              isIsolated 
                ? 'bg-[#005B91] text-white border-[#005B91]' 
                : 'text-[#5E666D] border-[#D5D9DD] hover:bg-[#EAEFF4]'
            }`}
          >
            {isIsolated ? 'Show All' : 'Isolate in 3D'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2.5 space-y-3 font-mono-numbers">
        {/* CASE 1: CELL SELECTED */}
        {activeCell ? (
          <>
            {/* Identity Banner */}
            <div className="border border-[#D5D9DD] bg-[#F7F9FB] p-2 rounded-[2px]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-[#005B91] font-sans">
                    {activeCell.id}
                  </div>
                  <div className="text-[10px] text-[#5E666D] font-sans">
                    Prismatic Li-ion Cell · Module {activeModule?.id}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {activeCell.diagnosticState === 'WARNING' ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-1.5 py-0.5 rounded-[2px] font-medium font-sans">
                      <AlertTriangle className="w-3 h-3" />
                      Warning State
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-1.5 py-0.5 rounded-[2px] font-medium font-sans">
                      <CheckCircle2 className="w-3 h-3" />
                      Nominal
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Electrical Telemetry */}
            <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-white">
              <div className="text-[10.5px] font-semibold text-[#20252A] font-sans flex items-center gap-1 border-b border-[#E3E6E8] pb-1 mb-1.5">
                <Zap className="w-3.5 h-3.5 text-[#0072A8]" />
                <span>Electrical Parameters (2-RC ECM)</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Terminal Voltage</div>
                  <div className="font-semibold text-[#20252A]">{activeCell.voltage} V</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Measured vs Estimated</div>
                  <div className="text-[#5E666D]">{activeCell.measuredVoltage}V / {activeCell.estimatedVoltage}V</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Load Current</div>
                  <div className="font-semibold text-[#20252A]">{activeCell.current} A</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Internal Resistance R0</div>
                  <div className={`font-semibold ${activeCell.internalResistance > 2.8 ? 'text-[#D97706]' : 'text-[#20252A]'}`}>
                    {activeCell.internalResistance} mΩ
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Capacity Remaining</div>
                  <div className="text-[#20252A]">{activeCell.capacityAh} Ah / {activeCell.nominalCapacityAh} Ah</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Voltage Deviation</div>
                  <div className="text-[#5E666D]">
                    {Number(((activeCell.voltage - 3.824) * 1000).toFixed(1))} mV
                  </div>
                </div>
              </div>
            </div>

            {/* Thermal Telemetry */}
            <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-white">
              <div className="text-[10.5px] font-semibold text-[#20252A] font-sans flex items-center gap-1 border-b border-[#E3E6E8] pb-1 mb-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#C62828]" />
                <span>Thermal Dynamics (Lumped Node)</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Surface Temperature</div>
                  <div className={`text-[13px] font-bold ${activeCell.temperature > 39 ? 'text-[#C62828]' : 'text-[#20252A]'}`}>
                    {activeCell.temperature} °C
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Temp Delta from Pack</div>
                  <div className={`font-semibold ${activeCell.temperature - batteryPack.temperature > 4 ? 'text-[#C62828]' : 'text-[#5E666D]'}`}>
                    +{Number((activeCell.temperature - batteryPack.temperature).toFixed(1))} °C
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Heat Generation (I²R)</div>
                  <div className="text-[#20252A]">
                    {Number((Math.pow(activeCell.current, 2) * (activeCell.internalResistance / 1000)).toFixed(2))} W
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Cooling Heat Flux</div>
                  <div className="text-[#5E666D]">
                    {Number((1.8 * Math.max(0, activeCell.temperature - 22.0)).toFixed(2))} W
                  </div>
                </div>
              </div>
            </div>

            {/* State & Degradation Prognostics */}
            <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-white">
              <div className="text-[10.5px] font-semibold text-[#20252A] font-sans flex items-center gap-1 border-b border-[#E3E6E8] pb-1 mb-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#005B91]" />
                <span>State & Degradation Prognostics</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">State of Charge (SOC)</div>
                  <div className="font-semibold text-[#20252A]">{activeCell.soc} %</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">State of Health (SOH)</div>
                  <div className={`font-semibold ${activeCell.soh < 85 ? 'text-[#D97706]' : 'text-[#20252A]'}`}>
                    {activeCell.soh} %
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Predicted RUL (EOL 80%)</div>
                  <div className="font-bold text-[#005B91]">{activeCell.predictedRul} cycles</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Degradation Index</div>
                  <div className="text-[#5E666D]">{activeCell.degradationIndex}</div>
                </div>
              </div>
            </div>

            {/* Linked Diagnostic Events */}
            {diagnosticEvents.filter(e => e.objectId === activeCell?.id).length > 0 && (
              <div className="border border-[#FDE68A] bg-[#FFFBEB] rounded-[2px] p-2">
                <div className="text-[10.5px] font-semibold text-[#92400E] font-sans flex items-center gap-1 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Associated Diagnostic Events</span>
                </div>
                {diagnosticEvents
                  .filter(e => e.objectId === activeCell?.id)
                  .map(evt => (
                    <div 
                      key={evt.id}
                      onClick={() => selectDiagnostic(evt.id)}
                      className="cursor-pointer bg-white border border-[#FCD34D] p-1.5 rounded-[2px] mt-1 hover:bg-[#FEF3C7] transition-colors"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-[#005B91]">{evt.id} · {evt.parameter}</span>
                        <span className="text-[#D97706] font-semibold">{evt.deviation}</span>
                      </div>
                      <div className="text-[9.5px] text-[#78350F] font-sans mt-0.5">
                        {evt.description}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        ) : activeModule ? (
          /* CASE 2: MODULE SELECTED */
          <>
            <div className="border border-[#D5D9DD] bg-[#F7F9FB] p-2 rounded-[2px]">
              <div className="text-[13px] font-bold text-[#005B91] font-sans">
                {activeModule.name}
              </div>
              <div className="text-[10px] text-[#5E666D] font-sans">
                12S Prismatic Sub-Assembly · Total 12 Cells
              </div>
            </div>

            <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-white space-y-2">
              <div className="text-[10.5px] font-semibold text-[#20252A] font-sans">
                Module Aggregate Telemetry
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Mean Voltage</div>
                  <div className="font-semibold text-[#20252A]">{activeModule.avgVoltage} V</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Voltage Spread (ΔV)</div>
                  <div className={`font-semibold ${activeModule.voltageSpread > 30 ? 'text-[#D97706]' : 'text-[#20252A]'}`}>
                    {activeModule.voltageSpread} mV
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Mean Temperature</div>
                  <div className="font-semibold text-[#20252A]">{activeModule.avgTemperature} °C</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Max Cell Temp</div>
                  <div className={`font-semibold ${activeModule.maxTemperature > 38 ? 'text-[#C62828]' : 'text-[#20252A]'}`}>
                    {activeModule.maxTemperature} °C
                  </div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Module SOH</div>
                  <div className="text-[#20252A]">{activeModule.avgSoh} %</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Module SOC</div>
                  <div className="text-[#20252A]">{activeModule.avgSoc} %</div>
                </div>
              </div>
            </div>

            {/* Cells in Module mini table */}
            <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-white">
              <div className="text-[10.5px] font-semibold text-[#20252A] font-sans mb-1.5">
                Module Cells (12)
              </div>
              <div className="space-y-1">
                {activeModule.cells.map(c => (
                  <div
                    key={c.id}
                    onClick={() => selectObject('CELL', c.id)}
                    className="flex justify-between items-center px-1.5 py-0.5 bg-[#F9FAFB] hover:bg-[#EAEFF4] cursor-pointer rounded-[2px] text-[10.5px]"
                  >
                    <span className="font-semibold text-[#005B91]">{c.id}</span>
                    <span>{c.voltage}V</span>
                    <span className={c.temperature > 39 ? 'text-[#C62828] font-semibold' : ''}>{c.temperature}°C</span>
                    <span>{c.soh}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* CASE 3: PACK SELECTED */
          <>
            <div className="border border-[#D5D9DD] bg-[#F7F9FB] p-2 rounded-[2px]">
              <div className="text-[13px] font-bold text-[#005B91] font-sans">
                {batteryPack.name}
              </div>
              <div className="text-[10px] text-[#5E666D] font-sans">
                ID: {batteryPack.id} · {batteryPack.architecture}
              </div>
            </div>

            <div className="border border-[#D5D9DD] rounded-[2px] p-2 bg-white">
              <div className="text-[10.5px] font-semibold text-[#20252A] font-sans mb-1.5">
                Pack Specifications & Live Telemetry
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px]">
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Pack Bus Voltage</div>
                  <div className="font-semibold text-[#20252A]">{batteryPack.packVoltage} V</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Nominal Pack Voltage</div>
                  <div className="text-[#5E666D]">{batteryPack.nominalVoltage} V (800V class)</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Pack Current Load</div>
                  <div className="font-semibold text-[#20252A]">{batteryPack.packCurrent} A</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Nominal Energy Capacity</div>
                  <div className="text-[#20252A]">{batteryPack.nominalCapacityKWh} kWh</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Measured Capacity</div>
                  <div className="font-semibold text-[#005B91]">{batteryPack.measuredCapacityKWh} kWh</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Global State of Health</div>
                  <div className="font-semibold text-[#20252A]">{batteryPack.avgSoh} %</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Mean State of Charge</div>
                  <div className="font-semibold text-[#20252A]">{batteryPack.avgSoc} %</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Cumulative Cycle Count</div>
                  <div className="text-[#20252A]">{batteryPack.cycleCount} cycles</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Max Cell Temperature</div>
                  <div className="text-[#C62828] font-bold">{batteryPack.maxCellTemp} °C</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Pack Voltage Spread (ΔV)</div>
                  <div className="text-[#D97706] font-semibold">{batteryPack.voltageSpread} mV</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Estimated Pack RUL</div>
                  <div className="font-bold text-[#005B91]">{batteryPack.predictedRul} cycles</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-[#7A8289] font-sans">Operational Hours</div>
                  <div className="text-[#5E666D]">{batteryPack.operatingHours} hrs</div>
                </div>
              </div>
            </div>

            {/* Quick shortcuts */}
            <div className="p-2 border border-[#D5D9DD] rounded-[2px] bg-[#F7F8F9] space-y-1.5">
              <div className="text-[10px] font-semibold text-[#5E666D] font-sans uppercase">
                Engineering Diagnostics Jump
              </div>
              <button
                onClick={() => {
                  setWorkspace('diagnostics');
                }}
                className="w-full py-1 text-center bg-white border border-[#D5D9DD] hover:bg-[#EAEFF4] text-[#005B91] font-semibold text-[10.5px] rounded-[2px] transition-colors"
              >
                Inspect 5 BMS Diagnostic Events →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

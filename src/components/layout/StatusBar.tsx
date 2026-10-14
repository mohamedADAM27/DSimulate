/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Bottom Status Bar
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { Database, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { 
    batteryPack, 
    selectedObjectType, 
    selectedModuleId, 
    selectedCellId,
    visualizationMode,
    timelineCycle,
    diagnosticEvents
  } = useBatteryStore();

  const selectedName = selectedCellId 
    ? `Cell ${selectedCellId} (${selectedModuleId})` 
    : (selectedModuleId ? `Module ${selectedModuleId}` : 'Battery Pack DS-EVBAT-001');

  const activeWarnings = diagnosticEvents.filter(e => e.status === 'ACTIVE' && e.severity === 'WARNING').length;

  return (
    <footer className="h-[24px] bg-[#E9ECEF] border-t border-[#D5D9DD] px-3 flex items-center justify-between text-[10.5px] text-[#5E666D] select-none shrink-0 font-mono-numbers">
      <div className="flex items-center gap-4">
        {/* Selected target */}
        <div className="flex items-center gap-1.5 text-[#20252A]">
          <span className="text-[#7A8289]">Target:</span>
          <span className="font-semibold text-[#005B91]">{selectedName}</span>
        </div>

        <span className="text-[#D5D9DD]">|</span>

        {/* Visualization layer */}
        <div className="flex items-center gap-1">
          <span className="text-[#7A8289]">Layer:</span>
          <span className="text-[#20252A] font-medium">{visualizationMode}</span>
        </div>

        <span className="text-[#D5D9DD] hidden sm:inline">|</span>

        {/* Timeline cycle */}
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-[#7A8289]">Cycle:</span>
          <span className="text-[#20252A] font-medium">{timelineCycle} / 2000</span>
        </div>

        <span className="text-[#D5D9DD] hidden md:inline">|</span>

        {/* Global SOH & RUL */}
        <div className="hidden md:flex items-center gap-2">
          <span>SOH: <strong className="text-[#20252A]">{batteryPack.avgSoh}%</strong></span>
          <span>·</span>
          <span>RUL: <strong className="text-[#20252A]">{batteryPack.predictedRul} cyc</strong></span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Diagnostics count */}
        <div className="flex items-center gap-1">
          {activeWarnings > 0 ? (
            <span className="text-[#D97706] flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {activeWarnings} Warnings
            </span>
          ) : (
            <span className="text-[#2E7D32] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              All Systems Normal
            </span>
          )}
        </div>

        <span className="text-[#D5D9DD] hidden lg:inline">|</span>

        {/* Data integrity */}
        <div className="hidden lg:flex items-center gap-1 text-[#5E666D]">
          <Database className="w-3 h-3 text-[#7A8289]" />
          <span>Prototype Simulation Dataset (NMC 811)</span>
        </div>

        <span className="text-[#D5D9DD] hidden xl:inline">|</span>

        {/* Units */}
        <div className="hidden xl:block text-[#7A8289]">
          Units: SI (V, A, °C, mΩ, kWh)
        </div>
      </div>
    </footer>
  );
};

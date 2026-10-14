/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Secondary Workspace Navigation Ribbon
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { WorkspaceTab } from '../../types/battery';
import { 
  Box, 
  Layers, 
  Gauge, 
  PlayCircle, 
  Flame, 
  Wind,
  TrendingDown, 
  Clock, 
  AlertOctagon, 
  Sliders, 
  GitCompare, 
  FileText, 
  Info 
} from 'lucide-react';

interface TabItem {
  id: WorkspaceTab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'digital-twin', label: 'Digital Twin', icon: Box },
  { id: 'explorer-3d', label: '3D Explorer', icon: Layers },
  { id: 'state-estimation', label: 'State Estimation', icon: Gauge },
  { id: 'simulation-studio', label: 'Simulation Studio', icon: PlayCircle },
  { id: 'thermal', label: 'Thermal & Cooling', icon: Wind },
  { id: 'degradation', label: 'Degradation', icon: TrendingDown },
  { id: 'rul', label: 'RUL Prediction', icon: Clock },
  { id: 'diagnostics', label: 'BMS Diagnostics', icon: AlertOctagon },
  { id: 'what-if', label: 'What-If Lab', icon: Sliders },
  { id: 'comparison', label: 'Comparison', icon: GitCompare },
  { id: 'results', label: 'Results', icon: FileText },
  { id: 'overview', label: 'Overview', icon: Info },
];

export const WorkspaceRibbon: React.FC = () => {
  const { currentWorkspace, setWorkspace, diagnosticEvents } = useBatteryStore();

  const activeAlerts = diagnosticEvents.filter(e => e.status === 'ACTIVE' && e.severity === 'WARNING').length;

  return (
    <div className="h-[34px] bg-[#FFFFFF] border-b border-[#D5D9DD] px-2 flex items-center justify-between select-none shrink-0 overflow-x-auto text-[11.5px]">
      <div className="flex items-center space-x-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentWorkspace === tab.id;
          const isDiagnosticsTab = tab.id === 'diagnostics';

          return (
            <button
              key={tab.id}
              onClick={() => setWorkspace(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-colors border-b-2 relative ${
                isActive
                  ? 'border-[#005B91] text-[#005B91] bg-[#F0F6FA]'
                  : 'border-transparent text-[#5E666D] hover:text-[#20252A] hover:bg-[#F7F8F9]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#005B91]' : 'text-[#7A8289]'}`} />
              <span>{tab.label}</span>
              {isDiagnosticsTab && activeAlerts > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] ml-0.5"></span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#7A8289] font-mono-numbers pr-2">
        <span>V_PACK: <strong className="text-[#20252A]">768.4 V</strong></span>
        <span>·</span>
        <span>T_MAX: <strong className="text-[#C62828]">41.7 °C</strong></span>
        <span>·</span>
        <span>ΔV: <strong className="text-[#D97706]">46 mV</strong></span>
      </div>
    </div>
  );
};

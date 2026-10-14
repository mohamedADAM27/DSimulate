/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Engineering Object Hierarchy Tree
 */

import React, { useState } from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { 
  ChevronRight, 
  ChevronDown, 
  Box, 
  Layers, 
  BatteryCharging, 
  Search, 
  AlertTriangle,
  FolderTree,
  Filter
} from 'lucide-react';

export const EngineeringTree: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    batteryPack, 
    selectedObjectType, 
    selectedModuleId, 
    selectedCellId, 
    selectObject 
  } = useBatteryStore();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'PACK': true,
    'MOD-01': false,
    'MOD-02': false,
    'MOD-03': true, // Expanded by default to showcase C-017
    'MOD-04': false,
    'MOD-05': false,
    'MOD-06': false,
    'MOD-07': false,
    'MOD-08': false,
  });

  const [filterText, setFilterText] = useState('');

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = { 'PACK': true };
    batteryPack.modules.forEach(m => { all[m.id] = true; });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({ 'PACK': true });
  };

  const isPackSelected = selectedObjectType === 'PACK';

  return (
    <div className={`bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col h-full select-none text-[11px] ${className}`}>
      {/* Tree Header */}
      <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-[#20252A]">
          <FolderTree className="w-3.5 h-3.5 text-[#005B91]" />
          <span>Product Structure Tree</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#5E666D]">
          <button 
            onClick={expandAll} 
            className="px-1 hover:text-[#005B91] hover:bg-[#EAEFF4] rounded-[2px]"
            title="Expand All"
          >
            +All
          </button>
          <span>/</span>
          <button 
            onClick={collapseAll} 
            className="px-1 hover:text-[#005B91] hover:bg-[#EAEFF4] rounded-[2px]"
            title="Collapse All"
          >
            -All
          </button>
        </div>
      </div>

      {/* Filter search field */}
      <div className="p-1.5 border-b border-[#E3E6E8] bg-[#FAFAFA]">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-[#7A8289]" />
          <input
            type="text"
            placeholder="Search hierarchy..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-white border border-[#D5D9DD] text-[10.5px] pl-6 pr-2 py-0.5 rounded-[2px] focus:outline-hidden focus:border-[#0072A8]"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-1 font-mono-numbers">
        {/* Root Pack Node */}
        <div>
          <div
            onClick={() => selectObject('PACK')}
            className={`flex items-center gap-1 px-1.5 py-1 rounded-[2px] cursor-pointer transition-colors ${
              isPackSelected
                ? 'bg-[#DCECF6] text-[#005B91] font-medium border-l-2 border-[#005B91]'
                : 'hover:bg-[#F0F2F5] text-[#20252A]'
            }`}
          >
            <button
              onClick={(e) => toggleNode('PACK', e)}
              className="p-0.5 text-[#7A8289] hover:text-[#20252A]"
            >
              {expandedNodes['PACK'] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <Box className="w-3.5 h-3.5 text-[#005B91] shrink-0" />
            <span className="truncate font-sans font-medium">{batteryPack.id}</span>
            <span className="text-[10px] text-[#7A8289] ml-auto shrink-0 font-sans">8 Mod · 96 Cell</span>
          </div>

          {/* Module Nodes */}
          {expandedNodes['PACK'] && (
            <div className="pl-3.5 border-l border-[#E3E6E8] ml-2 mt-0.5 space-y-0.5">
              {batteryPack.modules
                .filter(m => !filterText || m.name.toLowerCase().includes(filterText.toLowerCase()) || m.cells.some(c => c.id.toLowerCase().includes(filterText.toLowerCase())))
                .map((mod) => {
                  const isModSelected = selectedObjectType === 'MODULE' && selectedModuleId === mod.id;
                  const isModExpanded = expandedNodes[mod.id];
                  const hasWarning = mod.diagnosticState === 'WARNING';

                  return (
                    <div key={mod.id}>
                      <div
                        onClick={() => selectObject('MODULE', mod.id)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] cursor-pointer transition-colors ${
                          isModSelected
                            ? 'bg-[#DCECF6] text-[#005B91] font-medium border-l-2 border-[#005B91]'
                            : 'hover:bg-[#F0F2F5] text-[#20252A]'
                        }`}
                      >
                        <button
                          onClick={(e) => toggleNode(mod.id, e)}
                          className="p-0.5 text-[#7A8289] hover:text-[#20252A]"
                        >
                          {isModExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        <Layers className={`w-3.5 h-3.5 shrink-0 ${hasWarning ? 'text-[#D97706]' : 'text-[#5E666D]'}`} />
                        <span className="truncate font-sans">{mod.name}</span>

                        {hasWarning && (
                          <AlertTriangle className="w-3 h-3 text-[#D97706] shrink-0 ml-1" />
                        )}

                        <span className="text-[10px] text-[#7A8289] ml-auto shrink-0 font-sans">
                          {mod.avgTemperature}°C
                        </span>
                      </div>

                      {/* Cell Nodes */}
                      {isModExpanded && (
                        <div className="pl-3 border-l border-[#E3E6E8] ml-2 mt-0.5 space-y-0.5">
                          {mod.cells
                            .filter(c => !filterText || c.id.toLowerCase().includes(filterText.toLowerCase()))
                            .map((cell) => {
                              const isCellSelected = selectedCellId === cell.id;
                              const isCellWarning = cell.diagnosticState === 'WARNING';

                              return (
                                <div
                                  key={cell.id}
                                  onClick={() => selectObject('CELL', cell.id)}
                                  className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] cursor-pointer text-[10.5px] transition-colors ${
                                    isCellSelected
                                      ? 'bg-[#DCECF6] text-[#005B91] font-semibold border-l-2 border-[#005B91]'
                                      : 'hover:bg-[#F0F2F5] text-[#333D47]'
                                  }`}
                                >
                                  <BatteryCharging className={`w-3 h-3 shrink-0 ${
                                    isCellWarning ? 'text-[#D97706]' : 'text-[#7A8289]'
                                  }`} />
                                  <span className="font-semibold">{cell.id}</span>
                                  
                                  {isCellWarning && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0"></span>
                                  )}

                                  <span className="ml-auto text-[9.5px] text-[#7A8289]">
                                    {cell.voltage}V · {cell.temperature}°C
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Tree footer metadata */}
      <div className="h-[22px] bg-[#F7F8F9] border-t border-[#D5D9DD] px-2 flex items-center justify-between text-[10px] text-[#7A8289] shrink-0">
        <span>Total: 96 Cells in 8 Modules</span>
        <span className="font-medium text-[#20252A]">Config: 96S1P</span>
      </div>
    </div>
  );
};

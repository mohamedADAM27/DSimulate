/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - 3D Battery Explorer Workspace (Screen 03)
 */

import React from 'react';
import { Battery3DCanvas } from '../three/Battery3DCanvas';
import { VisualizationLegend } from '../common/VisualizationLegend';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { 
  Box, 
  Layers, 
  Ruler, 
  Maximize2, 
  Eye, 
  EyeOff, 
  Sliders, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const Explorer3DView: React.FC = () => {
  const { 
    batteryPack, 
    selectedObjectType, 
    selectedModuleId, 
    selectedCellId, 
    selectObject,
    explodeProgress,
    setExplodeProgress,
    sectionCutActive,
    toggleSectionCut,
    wireframeActive,
    toggleWireframe,
    isolatedObjectId,
    setIsolate
  } = useBatteryStore();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top CAD Action Toolbar */}
      <div className="h-[32px] bg-white border border-[#D5D9DD] rounded-[2px] px-3 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#005B91] flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-[#005B91]" />
            <span>3D CAD Model Inspector</span>
          </span>
          <span className="text-[#D5D9DD]">|</span>
          <span className="text-[#5E666D]">
            Assembly: <strong className="text-[#20252A]">DS-EVBAT-001 (800V Skate Pack)</strong>
          </span>
        </div>

        {/* CAD Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSectionCut}
            className={`px-2 py-0.5 border rounded-[2px] text-[10.5px] font-medium transition-colors ${
              sectionCutActive ? 'bg-[#005B91] text-white border-[#005B91]' : 'border-[#D5D9DD] text-[#5E666D] hover:bg-[#F0F2F5]'
            }`}
          >
            {sectionCutActive ? 'Disable Section Plane' : 'Enable Section Cut (Z=-0.5)'}
          </button>

          <button
            onClick={toggleWireframe}
            className={`px-2 py-0.5 border rounded-[2px] text-[10.5px] font-medium transition-colors ${
              wireframeActive ? 'bg-[#005B91] text-white border-[#005B91]' : 'border-[#D5D9DD] text-[#5E666D] hover:bg-[#F0F2F5]'
            }`}
          >
            {wireframeActive ? 'Solid Shaded' : 'Wireframe Mode'}
          </button>

          {isolatedObjectId && (
            <button
              onClick={() => setIsolate(null)}
              className="px-2 py-0.5 bg-[#DCECF6] text-[#0072A8] border border-[#0072A8] rounded-[2px] text-[10.5px] font-medium hover:bg-[#C9E2F1]"
            >
              Exit Isolation Mode
            </button>
          )}
        </div>
      </div>

      {/* Main Split View: BOM Hierarchy Table (Left) + Dominant 3D Viewport (Center) */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left BOM / CAD Component Tree */}
        <div className="w-72 bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col shrink-0 text-[11px] overflow-hidden">
          <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2 flex items-center justify-between font-semibold text-[#20252A]">
            <span>Assembly Parts List (BOM)</span>
            <span className="text-[10px] text-[#7A8289]">96 Cells</span>
          </div>

          <div className="flex-1 overflow-auto p-1.5 space-y-1 font-mono-numbers">
            {/* Battery Enclosure Part */}
            <div 
              onClick={() => selectObject('PACK')}
              className={`p-1.5 border rounded-[2px] cursor-pointer ${
                selectedObjectType === 'PACK' ? 'bg-[#DCECF6] border-[#005B91]' : 'border-[#E3E6E8] hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="font-semibold text-[#005B91] font-sans">1. Aluminum Base Enclosure</div>
              <div className="text-[10px] text-[#5E666D]">Al 6061-T6 · 2150 × 1380 × 140 mm</div>
            </div>

            {/* Cooling Plate Part */}
            <div 
              onClick={() => selectObject('PACK')}
              className="p-1.5 border border-[#E3E6E8] rounded-[2px] cursor-pointer hover:bg-[#F9FAFB]"
            >
              <div className="font-semibold text-[#0072A8] font-sans">2. Liquid Cold Plate Heat Exchanger</div>
              <div className="text-[10px] text-[#5E666D]">Aluminum Extrusion · 10 L/min Glycol-Water</div>
            </div>

            {/* Modules List */}
            <div className="text-[10.5px] font-semibold text-[#20252A] pt-1 font-sans">
              3. Battery Modules (8S Array)
            </div>
            {batteryPack.modules.map(mod => {
              const isSelected = selectedModuleId === mod.id;
              const hasWarning = mod.diagnosticState === 'WARNING';

              return (
                <div
                  key={mod.id}
                  onClick={() => selectObject('MODULE', mod.id)}
                  className={`p-1.5 border rounded-[2px] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#DCECF6] border-[#005B91]' : 'border-[#E3E6E8] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#20252A] font-sans">{mod.name}</span>
                    {hasWarning && <span className="text-[#D97706] text-[10px] font-sans font-medium">Alert</span>}
                  </div>
                  <div className="text-[10px] text-[#5E666D] flex justify-between mt-0.5">
                    <span>12 Cells (Prismatic)</span>
                    <span>{mod.avgTemperature}°C · {mod.avgVoltage}V</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-[26px] bg-[#F7F8F9] border-t border-[#D5D9DD] px-2 flex items-center justify-between text-[10px] text-[#7A8289]">
            <span>Total Weight: 485 kg</span>
            <span>Energy: 82.5 kWh</span>
          </div>
        </div>

        {/* Dominant 3D Viewport */}
        <div className="flex-1 bg-white border border-[#D5D9DD] rounded-[2px] relative overflow-hidden">
          <Battery3DCanvas className="w-full h-full" showControls={true} />

          {/* Floating Colormap Legend */}
          <div className="absolute bottom-12 left-3 z-10 pointer-events-auto max-w-xs">
            <VisualizationLegend />
          </div>

          {/* Dimension overlay badge */}
          <div className="absolute top-3 left-3 bg-white/95 border border-[#D5D9DD] px-2.5 py-1.5 rounded-[2px] text-[10.5px] text-[#20252A] shadow-xs pointer-events-none">
            <div className="font-semibold text-[#005B91] flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              <span>Pack Envelope Dimensions</span>
            </div>
            <div className="font-mono-numbers text-[10px] text-[#5E666D] mt-0.5">
              L: 2,150 mm · W: 1,380 mm · H: 140 mm · Ground Clr: 165 mm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

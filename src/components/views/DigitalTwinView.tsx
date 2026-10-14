/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Digital Twin Hero Engineering Workspace (Screen 02)
 */

import React from 'react';
import { EngineeringTree } from '../common/EngineeringTree';
import { Battery3DCanvas } from '../three/Battery3DCanvas';
import { ObjectInspector } from '../inspector/ObjectInspector';
import { SimulationTimeline } from '../simulation/SimulationTimeline';
import { VisualizationLegend } from '../common/VisualizationLegend';

export const DigitalTwinView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* 3-Column Engineering Split Pane */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Left Column: Product Structure Tree (w-72 / 280px) */}
        <div className="w-64 xl:w-72 shrink-0 h-full flex flex-col">
          <EngineeringTree className="h-full" />
        </div>

        {/* Center Column: 3D CAD/CAE Model Viewport (Flex-1) */}
        <div className="flex-1 h-full flex flex-col min-w-0 bg-white border border-[#D5D9DD] rounded-[2px] overflow-hidden relative">
          <Battery3DCanvas className="w-full h-full" showControls={true} />

          {/* Overlay colormap legend in bottom-left */}
          <div className="absolute bottom-12 left-3 z-10 pointer-events-auto max-w-xs">
            <VisualizationLegend />
          </div>
        </div>

        {/* Right Column: Object & Telemetry Inspector (w-80 / 320px) */}
        <div className="w-72 xl:w-80 shrink-0 h-full flex flex-col">
          <ObjectInspector className="h-full" />
        </div>
      </div>

      {/* Bottom Panel: Simulation Timeline & Cycle Scrubber */}
      <div className="h-[74px] shrink-0">
        <SimulationTimeline className="h-full" />
      </div>
    </div>
  );
};

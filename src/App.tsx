/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Physics-Informed Battery Digital Twin Application Entrypoint
 */

import React from 'react';
import { useBatteryStore } from './stores/useBatteryStore';
import { HeaderBar } from './components/layout/HeaderBar';
import { WorkspaceRibbon } from './components/layout/WorkspaceRibbon';
import { StatusBar } from './components/layout/StatusBar';
import { BatteryInitializationWorkflow } from './components/initialization/BatteryInitializationWorkflow';

// Workspaces
import { DigitalTwinView } from './components/views/DigitalTwinView';
import { Explorer3DView } from './components/views/Explorer3DView';
import { StateEstimationView } from './components/views/StateEstimationView';
import { SimulationStudioView } from './components/views/SimulationStudioView';
import { ThermalSimulationView } from './components/views/ThermalSimulationView';
import { DegradationView } from './components/views/DegradationView';
import { RulPredictionView } from './components/views/RulPredictionView';
import { DiagnosticsView } from './components/views/DiagnosticsView';
import { WhatIfView } from './components/views/WhatIfView';
import { ComparisonView } from './components/views/ComparisonView';
import { ResultsView } from './components/views/ResultsView';
import { OverviewView } from './components/views/OverviewView';
import { InterventionIntelligenceView } from './components/views/InterventionIntelligenceView';
import { FleetIntelligenceView } from './components/views/FleetIntelligenceView';

export default function App() {
  const { currentWorkspace, isInitializingBattery, setIsInitializingBattery } = useBatteryStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const [revealedCount, setRevealedCount] = React.useState(0);
  const loadingWord = "LOADING...";

  React.useEffect(() => {
    // 2-second total loading screen display
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Character-by-character reveal timer (~150ms per letter)
    const charTimer = setInterval(() => {
      setRevealedCount(prev => (prev < loadingWord.length ? prev + 1 : prev));
    }, 150);

    return () => {
      clearTimeout(timer);
      clearInterval(charTimer);
    };
  }, [loadingWord.length]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#005B91] w-screen h-screen select-none border-2 border-black box-border">
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-[0.16em] uppercase"
          style={{ fontFamily: "'Plus Jakarta Sans', 'Trebuchet MS', 'Segoe UI', -apple-system, sans-serif" }}
        >
          DSIMULATE
        </h1>

        {/* Character-by-character font revealing LOADING animation */}
        <div className="mt-5 flex items-center justify-center gap-1 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase text-white/90">
          {loadingWord.split("").map((char, index) => {
            const isVisible = index < revealedCount;
            return (
              <span
                key={index}
                className="inline-block transition-all duration-200"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.75)',
                  filter: isVisible ? 'none' : 'blur(2px)',
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Battery Connection & Initialization Workflow (runs after loading, before workspace)
  if (isInitializingBattery) {
    return <BatteryInitializationWorkflow onClose={() => setIsInitializingBattery(false)} />;
  }

  const renderActiveWorkspace = () => {
    switch (currentWorkspace) {
      case 'digital-twin':
        return <DigitalTwinView />;
      case 'explorer-3d':
        return <Explorer3DView />;
      case 'state-estimation':
        return <StateEstimationView />;
      case 'simulation-studio':
        return <SimulationStudioView />;
      case 'thermal':
        return <ThermalSimulationView />;
      case 'degradation':
        return <DegradationView />;
      case 'rul':
        return <RulPredictionView />;
      case 'diagnostics':
        return <DiagnosticsView />;
      case 'what-if':
        return <WhatIfView />;
      case 'comparison':
        return <ComparisonView />;
      case 'results':
        return <ResultsView />;
      case 'intervention-intelligence':
        return <InterventionIntelligenceView />;
      case 'fleet-intelligence':
        return <FleetIntelligenceView />;
      case 'overview':
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F4F5F6] border-2 border-black box-border">
      {/* 1. Persistent Enterprise Application Header (Deep Blue #005B91) */}
      <HeaderBar />

      {/* 2. Compact Workspace Ribbon Navigation Bar */}
      <WorkspaceRibbon />

      {/* 3. Primary Engineering Workspace Canvas */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {renderActiveWorkspace()}
      </main>

      {/* 4. Engineering Telemetry & Synchronization Status Bar */}
      <StatusBar />
    </div>
  );
}

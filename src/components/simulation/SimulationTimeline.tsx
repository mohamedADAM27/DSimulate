/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Simulation Playback Timeline & Cycle Scrubber
 */

import React, { useEffect, useRef, useState } from 'react';
import { useBatteryStore, batteryStore } from '../../stores/useBatteryStore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  FastForward, 
  Clock, 
  Activity, 
  Flame, 
  Zap,
  AlertTriangle 
} from 'lucide-react';

export const SimulationTimeline: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    simulationRunning, 
    simulationCurrentStep, 
    simulationHistory, 
    setSimulationRunning, 
    setSimulationStep, 
    timelineCycle, 
    setTimelineCycle,
    batteryPack,
    faultCellsIdentified,
    activeAlertsShown,
    diagnosticEvents,
  } = useBatteryStore();

  const [timelineMode, setTimelineMode] = useState<'TRANSIENT' | 'CYCLE_AGING'>('TRANSIENT');

  // Animation playback interval for time-domain simulation
  useEffect(() => {
    let intervalId: any;
    if (simulationRunning) {
      intervalId = setInterval(() => {
        const nextStep = (batteryStore.getState().simulationCurrentStep + 1);
        if (nextStep >= simulationHistory.length) {
          batteryStore.setSimulationRunning(false);
          batteryStore.setSimulationLifecycle('COMPLETED');
        } else {
          batteryStore.setSimulationStep(nextStep);
        }
      }, 250);
    }
    return () => clearInterval(intervalId);
  }, [simulationRunning, simulationHistory.length]);

  const currentPoint = simulationHistory[simulationCurrentStep] || simulationHistory[0];

  const handleTransientSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const step = parseInt(e.target.value);
    setSimulationStep(step);
  };

  const handleCycleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cyc = parseInt(e.target.value);
    setTimelineCycle(cyc);
  };

  const handlePlayPause = () => {
    if (simulationRunning) {
      batteryStore.setSimulationRunning(false);
    } else {
      if (!faultCellsIdentified) {
        batteryStore.startSimulationRun();
      } else {
        batteryStore.setSimulationRunning(true);
      }
    }
  };

  const handleStep = () => {
    if (!faultCellsIdentified) {
      batteryStore.startSimulationRun();
      return;
    }
    const nextStep = Math.min(simulationHistory.length - 1, simulationCurrentStep + 1);
    setSimulationStep(nextStep);
  };

  const handleReset = () => {
    batteryStore.resetSimulationRun();
  };

  return (
    <div className={`bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex flex-col justify-between select-none text-[11px] ${className}`}>
      {/* Top Header & Mode Toggle */}
      <div className="flex items-center justify-between border-b border-[#E3E6E8] pb-1.5 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-semibold text-[#20252A]">
            <Clock className="w-3.5 h-3.5 text-[#005B91]" />
            <span>Simulation Timeline Control</span>
          </div>

          <div className="flex items-center gap-1 bg-[#F0F2F5] p-0.5 rounded-[2px] border border-[#D5D9DD]">
            <button
              onClick={() => { setTimelineMode('TRANSIENT'); }}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-[2px] transition-colors ${
                timelineMode === 'TRANSIENT' ? 'bg-white text-[#005B91] shadow-xs font-semibold' : 'text-[#5E666D]'
              }`}
            >
              Time-Domain (0–1800s)
            </button>
            <button
              onClick={() => { setTimelineMode('CYCLE_AGING'); }}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-[2px] transition-colors ${
                timelineMode === 'CYCLE_AGING' ? 'bg-white text-[#005B91] shadow-xs font-semibold' : 'text-[#5E666D]'
              }`}
            >
              Cycle Aging (0–2000 cyc)
            </button>
          </div>
        </div>

        {/* Live point telemetry readout */}
        <div className="flex items-center gap-3 text-[10.5px] font-mono-numbers text-[#5E666D]">
          {timelineMode === 'TRANSIENT' ? (
            <>
              <span>t: <strong className="text-[#20252A]">{currentPoint?.time}s</strong></span>
              <span>·</span>
              <span>I: <strong className="text-[#005B91]">{currentPoint?.current}A</strong></span>
              <span>·</span>
              <span>V: <strong className="text-[#20252A]">{currentPoint?.packVoltage}V</strong></span>
              <span>·</span>
              <span>SOC: <strong className="text-[#20252A]">{currentPoint?.packSoc}%</strong></span>
              <span>·</span>
              <span>T_max: <strong className="text-[#C62828]">{currentPoint?.maxCellTemp}°C</strong></span>
            </>
          ) : (
            <>
              <span>Current Cycle: <strong className="text-[#005B91]">{timelineCycle} cyc</strong></span>
              <span>·</span>
              <span>Pack SOH: <strong className="text-[#20252A]">{batteryPack.avgSoh}%</strong></span>
              <span>·</span>
              <span>RUL to 80%: <strong className="text-[#2E7D32]">{batteryPack.predictedRul} cyc</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Main Track & Controls Bar */}
      <div className="flex items-center gap-3">
        {/* Playback Action Buttons */}
        {timelineMode === 'TRANSIENT' ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePlayPause}
              className={`px-2.5 py-1 rounded-[2px] flex items-center gap-1.5 font-semibold text-[10.5px] transition-all border shadow-xs ${
                simulationRunning
                  ? 'bg-[#D97706] text-white border-[#B45309]'
                  : 'bg-[#005B91] text-white border-[#004B78] hover:bg-[#004B78]'
              }`}
              title="Run deterministic 2-RC simulation to localize faults in modules and evaluate active alerts"
            >
              {simulationRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white" />}
              <span>{simulationRunning ? 'Pause' : 'Play / Run'}</span>
            </button>

            <button
              onClick={handleStep}
              disabled={simulationRunning}
              className="p-1 text-[#5E666D] border border-[#D5D9DD] hover:bg-[#F0F2F5] rounded-[2px]"
              title="Step Forward"
            >
              <SkipForward className="w-3 h-3" />
            </button>

            <button
              onClick={handleReset}
              className="p-1 text-[#5E666D] border border-[#D5D9DD] hover:bg-[#F0F2F5] rounded-[2px]"
              title="Reset to 0s and clear diagnostics"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            {/* Diagnostic Stage Indicator */}
            {!faultCellsIdentified && !activeAlertsShown && (
              <span className="hidden sm:inline-flex text-[9.5px] text-[#5E666D] bg-[#F0F2F5] px-1.5 py-0.5 rounded-[2px] border border-[#D5D9DD] font-sans">
                Ready · Press Play
              </span>
            )}
            {faultCellsIdentified && !activeAlertsShown && (
              <span className="inline-flex text-[9.5px] text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded-[2px] border border-[#FDE68A] items-center gap-1 font-sans animate-pulse font-medium">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Fault Localized (MOD-03)</span>
              </span>
            )}
            {activeAlertsShown && (
              <span className="inline-flex text-[9.5px] text-[#C62828] bg-[#FEE2E2] px-1.5 py-0.5 rounded-[2px] border border-[#FECACA] items-center gap-1 font-sans font-medium">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>{diagnosticEvents.length} Active Alerts</span>
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0 text-[10px]">
            <span className="text-[#7A8289]">Jumps:</span>
            {[0, 250, 500, 716, 1200, 2000].map(cyc => (
              <button
                key={cyc}
                onClick={() => setTimelineCycle(cyc)}
                className={`px-1.5 py-0.5 border rounded-[2px] font-mono-numbers ${
                  timelineCycle === cyc
                    ? 'bg-[#005B91] text-white border-[#005B91] font-semibold'
                    : 'bg-white border-[#D5D9DD] text-[#5E666D] hover:bg-[#F0F2F5]'
                }`}
              >
                {cyc === 716 ? '716 (Cur)' : `${cyc}`}
              </button>
            ))}
          </div>
        )}

        {/* Range Slider Scrubber */}
        <div className="flex-1 flex flex-col justify-center">
          {timelineMode === 'TRANSIENT' ? (
            <>
              <input
                type="range"
                min="0"
                max={simulationHistory.length - 1}
                value={simulationCurrentStep}
                onChange={handleTransientSlider}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#005B91] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#7A8289] font-mono-numbers mt-0.5">
                <span>0s (Start)</span>
                <span>300s</span>
                <span>600s</span>
                <span>900s</span>
                <span>1200s</span>
                <span>1500s</span>
                <span>1800s (End)</span>
              </div>
            </>
          ) : (
            <>
              <input
                type="range"
                min="0"
                max="2200"
                step="25"
                value={timelineCycle}
                onChange={handleCycleSlider}
                className="w-full h-1.5 bg-[#E2E8F0] accent-[#005B91] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#7A8289] font-mono-numbers mt-0.5">
                <span>0 cyc (BOL)</span>
                <span>500 cyc</span>
                <span className="text-[#005B91] font-bold">716 cyc (Current State)</span>
                <span>1200 cyc</span>
                <span className="text-[#C62828] font-semibold">2000 cyc (80% EOL)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

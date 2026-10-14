/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Screen 4: Live Data Processing Pipeline Workspace
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  DataSourceType, 
  BatterySystemConfig, 
  PipelineStageState, 
  PipelineStageId,
  UnifiedTelemetryFrame,
  SyntheticConfiguration,
  CanConfiguration,
  ObdConfiguration,
  OemApiConfiguration
} from '../../types/initialization';
import { 
  INITIAL_PIPELINE_STAGES, 
  executeDataPipeline 
} from '../../services/dataPipelineService';
import { BatteryPack, DiagnosticEvent } from '../../types/battery';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Terminal, 
  Cpu, 
  Layers, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  Gauge
} from 'lucide-react';

interface Props {
  batteryConfig: BatterySystemConfig;
  dataSource: DataSourceType;
  syntheticConfig: SyntheticConfiguration;
  canConfig: CanConfiguration;
  obdConfig: ObdConfiguration;
  oemApiConfig: OemApiConfiguration;
  onPipelineComplete: (pack: BatteryPack, diagnostics: DiagnosticEvent[]) => void;
  onRestart: () => void;
}

export const ScreenDataPipeline: React.FC<Props> = ({
  batteryConfig,
  dataSource,
  syntheticConfig,
  canConfig,
  obdConfig,
  oemApiConfig,
  onPipelineComplete,
  onRestart,
}) => {
  const [stages, setStages] = useState<PipelineStageState[]>(INITIAL_PIPELINE_STAGES);
  const [activeStageId, setActiveStageId] = useState<PipelineStageId>('acquisition');
  const [allLogs, setAllLogs] = useState<string[]>([]);
  const [latestFrame, setLatestFrame] = useState<UnifiedTelemetryFrame | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalPack, setFinalPack] = useState<BatteryPack | null>(null);
  const [finalDiagnostics, setFinalDiagnostics] = useState<DiagnosticEvent[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log console
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allLogs]);

  // Execute pipeline on mount
  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      const result = await executeDataPipeline({
        batteryConfig,
        dataSource,
        syntheticConfig,
        canConfig,
        obdConfig,
        oemApiConfig,
        onStageUpdate: (stageId, update) => {
          if (isCancelled) return;
          setActiveStageId(stageId);
          setStages(prev =>
            prev.map(s => {
              if (s.id === stageId) {
                const updated = { ...s, ...update };
                if (update.logs) {
                  setAllLogs(curr => [...curr, ...update.logs!]);
                }
                return updated;
              }
              return s;
            })
          );
        },
        onFrameGenerated: frame => {
          if (isCancelled) return;
          setLatestFrame(frame);
        },
      });

      if (!isCancelled) {
        setFinalPack(result.pack);
        setFinalDiagnostics(result.diagnostics);
        setIsCompleted(true);
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, []);

  const activeStage = stages.find(s => s.id === activeStageId) || stages[0];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] text-[#20252A] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3.5 bg-white border-b border-[#D5D9DD] shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#005B91] font-semibold bg-[#EBF5FB] px-2 py-0.5 border border-[#B9E0F7]">
                Stage 4 of 4 · Real-Time Execution
              </span>
              <span className="text-xs text-[#5E666D]">·</span>
              <span className="text-xs text-[#5E666D] font-mono-numbers">
                8-STAGE DATA PROCESSING PIPELINE
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1A1D20] mt-0.5">
              Live Data Processing Pipeline
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRestart}
              className="px-3 py-1.5 border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#475569] rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Reconfigure</span>
            </button>

            {isCompleted && finalPack && (
              <button
                onClick={() => onPipelineComplete(finalPack, finalDiagnostics)}
                className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-[2px] shadow-sm flex items-center gap-2 cursor-pointer transition-all animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Launch Digital Twin Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Stages list on left, Stage inspector + live logs + frame inspector on right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: 8 Stages Progress List (4 cols) */}
        <div className="lg:col-span-4 border-r border-[#D5D9DD] bg-white flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-semibold uppercase text-[#64748B]">
              Pipeline Sequence (8 Stages)
            </span>
            <span className="text-[10px] font-mono font-bold text-[#005B91]">
              {stages.filter(s => s.status === 'SUCCESS').length} / 8 Completed
            </span>
          </div>

          <div className="divide-y divide-[#F1F5F9] flex-1">
            {stages.map((st, idx) => {
              const isSelected = activeStageId === st.id;
              const isDone = st.status === 'SUCCESS';
              const isRunning = st.status === 'RUNNING';

              return (
                <div
                  key={st.id}
                  onClick={() => setActiveStageId(st.id)}
                  className={`p-3.5 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-[#F0F6FA] border-l-4 border-[#005B91]'
                      : 'hover:bg-[#FBFBFC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      ) : isRunning ? (
                        <div className="w-4 h-4 border-2 border-[#005B91] border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#94A3B8] shrink-0" />
                      )}
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#005B91]' : 'text-[#0F172A]'}`}>
                        {st.name}
                      </span>
                    </div>

                    <span className="text-[10.5px] font-mono font-semibold text-[#64748B]">
                      {st.progress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#E2E8F0] h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isDone ? 'bg-[#16A34A]' : isRunning ? 'bg-[#005B91]' : 'bg-[#CBD5E1]'
                      }`}
                      style={{ width: `${st.progress}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[#64748B] mt-1.5 line-clamp-1">
                    {st.details}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Completion summary box */}
          {isCompleted && (
            <div className="p-4 bg-[#F0FDF4] border-t border-[#BBF7D0] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#15803D]">
                <ShieldCheck className="w-4 h-4" />
                <span>All 8 Pipeline Stages Validated</span>
              </div>
              <p className="text-[11px] text-[#166534] leading-snug">
                Initialized {batteryConfig.model} [96-cell twin] with {batteryConfig.chemistry} electro-thermal models. Ready to inspect.
              </p>
              <button
                onClick={() => onPipelineComplete(finalPack!, finalDiagnostics)}
                className="w-full py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-[2px] transition-colors"
              >
                Launch Digital Twin Workspace
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Active Stage Inspector, Live Metrics, Frame Inspector & Engine Log Terminal (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-[#F8F9FA] overflow-y-auto">
          {/* Active Stage Details Banner */}
          <div className="p-4 bg-white border-b border-[#D5D9DD]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                  Stage Inspector
                </span>
                <h3 className="text-base font-bold text-[#0F172A]">{activeStage.name}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">{activeStage.description}</p>
              </div>

              <div className="px-2.5 py-1 rounded-[2px] font-mono text-xs font-bold uppercase border"
                style={{
                  backgroundColor: activeStage.status === 'SUCCESS' ? '#DCFCE7' : activeStage.status === 'RUNNING' ? '#E0F2FE' : '#F1F5F9',
                  borderColor: activeStage.status === 'SUCCESS' ? '#86EFAC' : activeStage.status === 'RUNNING' ? '#7DD3FC' : '#CBD5E1',
                  color: activeStage.status === 'SUCCESS' ? '#15803D' : activeStage.status === 'RUNNING' ? '#0369A1' : '#64748B',
                }}
              >
                {activeStage.status}
              </div>
            </div>

            {/* Stage Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {Object.entries(activeStage.metrics).map(([key, val]) => (
                <div key={key} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2px]">
                  <div className="text-[10px] font-mono uppercase text-[#64748B]">{key}</div>
                  <div className="text-sm font-mono-numbers font-bold text-[#0F172A] mt-0.5">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Frame Inspector */}
          {latestFrame && (
            <div className="p-4 bg-white border-b border-[#D5D9DD]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-mono font-semibold uppercase text-[#64748B]">
                  Decoded Telemetry Frame (Sequence #{latestFrame.sequenceId})
                </span>
                <div className="flex items-center gap-2 font-mono text-[10.5px]">
                  <span className="px-1.5 py-0.5 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold">
                    PROVENANCE: {latestFrame.provenance}
                  </span>
                  <span className="text-[#16A34A] font-semibold">Quality: {latestFrame.dataQualityPct}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-numbers">
                <div className="p-2 bg-[#F1F5F9] rounded-[2px]">
                  <div className="text-[10px] text-[#64748B]">PACK VOLTAGE</div>
                  <div className="text-sm font-bold text-[#005B91]">{latestFrame.packVoltageV} V</div>
                </div>

                <div className="p-2 bg-[#F1F5F9] rounded-[2px]">
                  <div className="text-[10px] text-[#64748B]">PACK CURRENT</div>
                  <div className="text-sm font-bold text-[#0F172A]">{latestFrame.packCurrentA} A</div>
                </div>

                <div className="p-2 bg-[#F1F5F9] rounded-[2px]">
                  <div className="text-[10px] text-[#64748B]">STATE OF CHARGE</div>
                  <div className="text-sm font-bold text-[#15803D]">{latestFrame.packSocPct}%</div>
                </div>

                <div className="p-2 bg-[#F1F5F9] rounded-[2px]">
                  <div className="text-[10px] text-[#64748B]">MAX CELL TEMP</div>
                  <div className="text-sm font-bold text-[#C62828]">{latestFrame.maxTempC} °C</div>
                </div>
              </div>
            </div>
          )}

          {/* Engine Real-Time Log Console */}
          <div className="flex-1 flex flex-col bg-[#14181B] text-[#E0E6ED] min-h-[220px]">
            <div className="h-8 bg-[#0D1013] border-b border-[#252C32] px-3 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="font-mono text-[11px] font-semibold text-[#94A3B8]">
                  DSimulate Engine Pipeline Log Console
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#64748B]">
                <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                <span>STREAM ACTIVE</span>
              </div>
            </div>

            <div className="flex-1 p-3 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-1 select-text">
              {allLogs.length === 0 ? (
                <div className="text-[#64748B] italic">Initializing processing log stream...</div>
              ) : (
                allLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#64748B] select-none text-[10px]">[{idx + 1}]</span>
                    <span className={
                      log.includes('[VAL]') ? 'text-[#FBBF24]' :
                      log.includes('[PHYS]') ? 'text-[#38BDF8]' :
                      log.includes('[SYNC]') ? 'text-[#4ADE80]' :
                      log.includes('[ACQ]') ? 'text-[#93C5FD]' :
                      'text-[#E2E8F0]'
                    }>
                      {log}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

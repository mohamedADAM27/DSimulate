/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Enterprise Engineering Header Bar
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { 
  Search, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  FolderTree, 
  Zap, 
  Layers,
  Cpu 
} from 'lucide-react';

export const HeaderBar: React.FC = () => {
  const { 
    batteryPack, 
    diagnosticEvents, 
    selectObject, 
    activeDataSource, 
    activeVehicleInfo,
    setIsInitializingBattery,
    setWorkspace,
    currentWorkspace 
  } = useBatteryStore();

  const activeWarnings = diagnosticEvents.filter(e => e.status === 'ACTIVE' && e.severity === 'WARNING').length;

  return (
    <header className="h-[42px] bg-[#005B91] text-white flex items-center justify-between px-3 text-xs select-none shrink-0 border-b border-[#004773]">
      {/* Brand & Active Model Context */}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => selectObject('PACK')}
          className="cursor-pointer font-bold tracking-tight text-[14px] hover:text-[#E0F2FE] transition-colors flex items-center gap-1.5"
        >
          <span>DSimulate</span>
        </div>

        <div className="h-4 w-[1px] bg-white/20"></div>

        {/* Project & Model Context Identifier */}
        <div className="flex items-center gap-2 text-[11px] text-white/90">
          <FolderTree className="w-3.5 h-3.5 text-white/70" />
          <span className="font-semibold text-white">{batteryPack.name || batteryPack.id}</span>
          <span className="text-white/80 hidden sm:inline font-mono text-[10.5px]">[{batteryPack.id}]</span>
          <span className="text-white/70 hidden md:inline text-[10.5px]">· {batteryPack.architecture}</span>
        </div>

        {/* Data Source Badge */}
        <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 bg-white/10 border border-white/20 rounded-[2px]">
          <span className="text-white/70">SOURCE:</span>
          <span className="text-[#38BDF8] font-bold">{activeDataSource || 'SYNTHETIC'}</span>
        </div>
      </div>

      {/* Center Search / Command Palette Input */}
      <div className="hidden xl:flex items-center relative w-72">
        <Search className="w-3.5 h-3.5 absolute left-2.5 text-white/60 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter modules, cells, diagnostic codes..."
          className="w-full bg-[#004B78] text-white placeholder-white/50 text-[11px] pl-8 pr-3 py-1 rounded-[2px] border border-white/20 focus:outline-hidden focus:border-[#7DD3FC] focus:bg-[#004169] transition-all"
        />
      </div>

      {/* Right Controls & Telemetry Status */}
      <div className="flex items-center gap-2.5 text-[11px]">
        {/* Intervention Intelligence Direct Workspace Button */}
        <button
          onClick={() => setWorkspace('intervention-intelligence')}
          className={`flex items-center gap-1.5 px-2.5 py-1 border font-bold transition-all cursor-pointer ${
            currentWorkspace === 'intervention-intelligence'
              ? 'bg-[#38BDF8] text-[#003B5C] border-white shadow-[2px_2px_0px_#000]'
              : 'bg-[#003B5C] hover:bg-[#00273D] border-[#38BDF8]/60 text-white hover:border-[#38BDF8]'
          }`}
          title="Open Intervention Intelligence — Vertical AI engineering workspace"
        >
          <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="hidden md:inline font-mono text-[10.5px]">Intervention Intel</span>
          <span className="px-1 py-0.2 bg-[#38BDF8] text-[#003B5C] text-[8.5px] font-black uppercase">AI</span>
        </button>

        {/* Initialize / Switch Battery System Button */}
        <button
          onClick={() => setIsInitializingBattery(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#004B78] hover:bg-[#004169] border border-white/25 text-white font-semibold transition-all cursor-pointer shadow-2xs hover:border-[#7DD3FC]"
          title="Connect new battery, change vehicle model, or configure data telemetry stream"
        >
          <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="hidden sm:inline">Connect / Initialize Battery</span>
          <span className="sm:hidden">Init</span>
        </button>

        {/* Health status badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-white/10 border border-white/15">
          {activeWarnings > 0 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span className="text-[#FBBF24] font-medium font-mono-numbers">{activeWarnings} Active</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span className="text-[#4ADE80] font-medium">Nominal</span>
            </>
          )}
        </div>

        {/* Solver State */}
        <div className="hidden lg:flex items-center gap-1.5 text-white/80 text-[10.5px]">
          <Activity className="w-3 h-3 text-[#38BDF8]" />
          <span>Solver: <span className="text-white font-mono-numbers">Deterministic 2-RC</span></span>
        </div>
      </div>
    </header>
  );
};

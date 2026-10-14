/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Intervention Intelligence Desktop Header (Brutalist Style)
 */

import React from 'react';
import { 
  InterventionInvestigation 
} from '../../../types/intervention';
import { 
  Activity, 
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import { generateInterventionPdfReport } from '../../../services/interventionPdfReportService';

interface InterventionHeaderProps {
  investigation: InterventionInvestigation;
  slmStatus: { online: boolean; model: string; error?: string };
  onNewInvestigation: () => void;
  onSaveInvestigation: () => void;
  onRefreshSlm: () => void;
  hasUnsavedChanges: boolean;
}

export const InterventionHeader: React.FC<InterventionHeaderProps> = ({
  investigation,
  slmStatus,
  onNewInvestigation,
  onSaveInvestigation,
  onRefreshSlm,
  hasUnsavedChanges,
}) => {
  const handleExportPdf = () => {
    const doc = generateInterventionPdfReport(investigation);
    doc.save(`DSimulate_Intervention_${investigation.id}.pdf`);
  };

  const handleExportJson = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(investigation, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `DSimulate_Intervention_${investigation.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-[#2E7D32] text-white border-black';
      case 'APPROVED':
        return 'bg-[#005B91] text-white border-black';
      case 'PENDING_APPROVAL':
        return 'bg-[#D97706] text-white border-black';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-[#C62828] text-white border-black';
      default:
        return 'bg-[#F4F5F6] text-[#20252A] border-black';
    }
  };

  return (
    <div className="bg-[#003B5C] text-white border-b-2 border-black px-3 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
      {/* Title & Active Case Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[13px] tracking-wider uppercase text-white font-mono">
                INTERVENTION INTELLIGENCE
              </span>
              <span className="px-1.5 py-0.2 bg-[#38BDF8] text-[#003B5C] text-[9.5px] font-black uppercase tracking-wider border border-black">
                VERTICAL AI
              </span>
            </div>
            <div className="text-[10px] text-white/80 font-mono flex items-center gap-2">
              <span>CASE: <strong className="text-white">{investigation.id}</strong></span>
              <span>·</span>
              <span className="truncate max-w-[240px] text-white/90">{investigation.title}</span>
            </div>
          </div>
        </div>

        <div className="hidden lg:block h-7 w-[2px] bg-black/40"></div>

        {/* Selected Battery Pack Info */}
        <div className="hidden lg:flex items-center gap-2 bg-[#004A75] border-2 border-black px-2.5 py-1 text-[11px] font-mono shadow-[2px_2px_0px_#000]">
          <FolderGit2 className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-white/70">PACK:</span>
          <span className="font-bold text-white">{investigation.packName}</span>
          <span className="text-[#38BDF8] text-[10px]">[{investigation.batterySnapshot.architecture}]</span>
        </div>

        {/* Investigation Status Badge */}
        <div className={`px-2 py-0.5 border-2 text-[10px] font-black font-mono uppercase tracking-wider shadow-[2px_2px_0px_#000] ${getStatusBadgeColor(investigation.status)}`}>
          {investigation.status.replace('_', ' ')}
        </div>
      </div>

      {/* Right Controls: Twin Status, SLM Indicator & Actions */}
      <div className="flex items-center gap-2 text-[11px]">
        {/* Digital Twin Live Link Status */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#00273D] border-2 border-black px-2 py-1 font-mono text-[10px] shadow-[2px_2px_0px_#000]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ADE80]"></span>
          </span>
          <span className="text-white/70">TWIN:</span>
          <span className="text-[#4ADE80] font-bold">SYNCED (2-RC)</span>
        </div>

        {/* Physics SLM Status */}
        <div 
          onClick={onRefreshSlm}
          title={slmStatus.online ? `Model: ${slmStatus.model} Online` : `SLM Error: ${slmStatus.error || 'Offline'}. Click to re-check.`}
          className={`cursor-pointer flex items-center gap-1.5 border-2 border-black px-2 py-1 font-mono text-[10px] shadow-[2px_2px_0px_#000] transition-transform active:translate-x-[1px] active:translate-y-[1px] ${
            slmStatus.online 
              ? 'bg-[#005B91] text-white hover:bg-[#0072A8]' 
              : 'bg-[#C62828] text-white hover:bg-[#D32F2F]'
          }`}
        >
          <Activity className="w-3 h-3 text-[#38BDF8]" />
          <span>SLM:</span>
          <span className="font-bold">{slmStatus.online ? 'ONLINE (GEMINI 3.8)' : 'OFFLINE'}</span>
          <RefreshCw className="w-2.5 h-2.5 ml-0.5 opacity-70 hover:opacity-100" />
        </div>

        {/* Action: New Investigation */}
        <button
          onClick={onNewInvestigation}
          className="flex items-center bg-[#F4F5F6] text-[#20252A] hover:bg-white border-2 border-black px-3 py-1 font-mono font-bold text-[10.5px] uppercase shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          title="Create a new intervention case from current Digital Twin snapshot"
        >
          <span className="inline">New Case</span>
        </button>

        {/* Action: Save Investigation */}
        <button
          onClick={onSaveInvestigation}
          className={`flex items-center border-2 border-black px-3 py-1 font-mono font-bold text-[10.5px] uppercase shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
            hasUnsavedChanges
              ? 'bg-[#D97706] text-white hover:bg-[#B45309]'
              : 'bg-[#005B91] text-white hover:bg-[#0072A8]'
          }`}
          title="Persist investigation state to local storage"
        >
          <span className="inline">{hasUnsavedChanges ? 'Save *' : 'Save'}</span>
        </button>

        {/* Action: Export Report PDF */}
        <button
          onClick={handleExportPdf}
          className="flex items-center bg-[#20252A] text-white hover:bg-black border-2 border-black px-3 py-1 font-mono font-bold text-[10.5px] uppercase shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          title="Download formal engineering PDF investigation dossier"
        >
          <span className="inline">Export PDF</span>
        </button>

        {/* Action: Export JSON */}
        <button
          onClick={handleExportJson}
          className="hidden 2xl:flex items-center gap-1 bg-[#004A75] text-white hover:bg-[#005B91] border-2 border-black px-2 py-1 font-mono text-[10px] uppercase shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          title="Download raw investigation JSON"
        >
          <span>JSON</span>
        </button>
      </div>
    </div>
  );
};
